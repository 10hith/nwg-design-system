import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stampIds } from './stamp_ids.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function renderList(items, render) {
  return Array.isArray(items) ? items.map(render).join('') : '';
}

function derivedSlots(slide) {
  const slots = {...(slide.slots || {})};
  slots.presenters = slots.presenters ?? renderList(slots.presenter_items, p => `<div class="presenter"><div class="avatar"></div><div><p class="name" data-role="presenter-name">${esc(p.name)}</p><p class="role" data-role="presenter-role">${esc(p.role)}</p></div></div>`);
  slots.agenda = slots.agenda ?? renderList(slots.agenda_items, (t, i) => `<div class="aitem"><div class="n">${i + 1}</div><div class="t" data-role="agenda-item">${esc(t)}</div></div>`);
  slots.items = slots.items ?? renderList(slots.stack_items, t => `<div class="chk" data-role="item"><span class="ring">✓</span><span>${esc(t)}</span></div>`);
  slots.columns = slots.columns ?? renderList(slots.column_items, col => `<div class="col" data-role="column"><h3>${esc(col.heading)}</h3><ul>${renderList(col.bullets, b => `<li data-role="bullet">${esc(b)}</li>`)}</ul></div>`);
  slots.matrix = slots.matrix ?? renderMatrix(slots.matrix_data);
  slots.stats_1 = slots.stats_1 ?? renderStats(slots.stats_group_1);
  slots.stats_2 = slots.stats_2 ?? renderStats(slots.stats_group_2);
  slots.chart = slots.chart ?? renderChart(slide.chart_data);
  slots.narrative = slots.narrative ?? renderList(slots.narrative_items, t => `<div class="arrowrow" data-role="narrative"><div class="a"></div><p>${esc(t)}</p></div>`);
  slots.callouts = slots.callouts ?? renderList(slots.callout_items, c => `<div class="co" data-role="callout"><h4>${esc(c.title)}</h4><p>${esc(c.body)}</p></div>`);
  slots.legend = slots.legend ?? renderList(slots.legend_items, (l, i) => `<span data-role="legend"><i style="background:var(--p${[800,600,500,400,300,200][i] || 200})"></i>${esc(l)}</span>`);
  slots.steps = slots.steps ?? renderList(slots.step_items, s => `<div data-role="step"><div class="step-hd"><div class="d">${esc(s.date)}</div><h4>${esc(s.title)}</h4></div><div class="step-body">${esc(s.body)}</div><div class="step-pic"></div></div>`);
  slots.actions = slots.actions ?? renderList(slots.action_items, a => `<div class="step-actions" data-role="action"><div class="label">NWG actions</div><div>${esc(a)}</div></div>`);
  slots.children = slots.children ?? renderList(slots.child_items, c => `<div class="child${c.focus ? ' focus' : ''}" data-role="child">${esc(c.label)}</div>`);
  slots.grid = slots.grid ?? renderList(slots.grid_items, g => `<div class="g" data-role="grid-item">${esc(g)}</div>`);
  slots.body = slots.body ?? renderList(slots.paragraphs, p => `<p>${esc(p)}</p>`);
  return slots;
}

function renderStats(items) {
  return renderList(items, s => `<div class="stat4" data-role="stat"><p class="n">${esc(s.value)}</p><p class="l">${esc(s.label)}</p></div>`);
}

function renderMatrix(data) {
  if (!data) return '';
  const headers = data.headers || [];
  const rows = data.rows || [];
  const top = ['<div></div>', ...headers.map((h, i) => `<div class="colhd${i === data.highlight_col ? ' dark' : ''}" data-role="column-heading"><h4>${esc(h.title || h)}</h4><p class="sub">${esc(h.subtitle || '')}</p></div>`)].join('');
  const body = rows.map(row => [`<div class="rowlab" data-role="row-label">${esc(row.label)}</div>`, ...(row.values || []).map((v, i) => `<div class="cell${i === data.highlight_col ? ' dark' : ''}" data-role="cell">${esc(v)}</div>`)].join('')).join('');
  return top + body;
}

function renderChart(chart) {
  const values = chart?.series?.[0]?.values || [40, 60, 80, 95];
  const labels = chart?.x_axis || ['2019','2024','2029F','2034F'];
  const max = Math.max(...values, 1);
  const bars = values.map((v, i) => `<div class="b${i >= values.length - 2 ? ' hi' : ''}" style="height:${Math.max(8, Math.round(v / max * 95))}%" data-role="bar"><div class="cap">${esc(v)}</div></div>`).join('');
  return `<div class="barchart" data-role="chart">${bars}</div><div class="years">${labels.map(l => `<span>${esc(l)}</span>`).join('')}</div>`;
}

export function buildSlide(projectDir, slideId, page = null) {
  const slidePath = path.join(projectDir, 'slides', `${slideId}.json`);
  const slide = JSON.parse(fs.readFileSync(slidePath, 'utf8'));
  const outPath = path.join(projectDir, 'slides', `${slideId}.html`);

  if (slide.template === 'composed') {
    const body = slide.html_body || `<div class="slide" style="display:grid;place-items:center"><p style="color:var(--p700);font-size:24px">Empty composed slide: ${slideId}</p></div>`;
    const shell = fs.readFileSync(path.join(skillRoot, 'templates/_shared/slide-shell.html'), 'utf8');
    const full = shell
      .replace('{{title}}', esc(slide.slots?.title || slideId))
      .replace('{{content}}', body);
    fs.writeFileSync(outPath, full);
    return outPath;
  }

  const [layout, variant] = slide.template.split('/');
  const templatePath = path.join(skillRoot, 'templates', layout, `${variant}.html`);
  const idMapPath = path.join(skillRoot, 'templates', layout, `${variant}.id-map.json`);
  let html = fs.readFileSync(templatePath, 'utf8');
  const idMap = JSON.parse(fs.readFileSync(idMapPath, 'utf8'));
  const slots = derivedSlots(slide);
  slots.page = page ?? slideId.replace(/^slide-/, '').replace(/^0/, '');
  html = html.replace(/{{\s*([\w-]+)\s*}}/g, (_, key) => {
    if (slots[key] === undefined || slots[key] === null || slots[key] === '') return `<span class="missing-slot">${esc(key)}</span>`;
    return String(slots[key]);
  });
  html = stampIds(html, idMap, slideId);
  const shell = fs.readFileSync(path.join(skillRoot, 'templates/_shared/slide-shell.html'), 'utf8');
  const full = shell.replace('{{title}}', esc(slide.slots?.title || slideId)).replace('{{content}}', html);
  fs.writeFileSync(outPath, full);
  return outPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [projectDir, slideId] = process.argv.slice(2);
  if (!projectDir || !slideId) throw new Error('Usage: node build_slide.mjs <deck-dir> <slide-id>');
  console.log(buildSlide(path.resolve(projectDir), slideId));
}
