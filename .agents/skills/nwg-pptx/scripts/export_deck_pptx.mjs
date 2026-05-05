import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const C = {
  purple900: '2B0A4A', purple800: '3D0F66', purple700: '4F1783', purple500: '7B2CBF',
  purple100: 'ECDCF7', purple050: 'F7EFFC', gold: 'FDAB1F', ink: '1F1B2E', muted: '4E4E5A',
  line: 'D7D7DE', white: 'FFFFFF', green: '0F8A5F', blue: '1C7293', rose: 'E43E6E'
};
const W = 13.333;
const H = 7.5;
const M = 0.46;

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function text(value) { return value == null ? '' : String(value); }
function list(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === 'object' ? value : {}; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

async function loadPptxGen() {
  const require = createRequire(import.meta.url);
  const candidates = ['pptxgenjs'];
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (globalRoot) candidates.push(path.join(globalRoot, 'pptxgenjs'));
  } catch { }
  candidates.push('/opt/homebrew/lib/node_modules/pptxgenjs');
  candidates.push('/usr/local/lib/node_modules/pptxgenjs');
  for (const candidate of candidates) {
    try { return require(candidate); } catch { }
    try { return (await import(pathToFileURL(candidate).href)).default; } catch { }
  }
  throw new Error('pptxgenjs not found. Install the export runtime with: npm install -g pptxgenjs');
}

function setup(pptx, deck) {
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'nwg-pptx';
  pptx.company = 'NatWest Group';
  pptx.subject = deck.subtitle || deck.title || 'NWG deck';
  pptx.title = deck.title || deck.deck_id || 'NWG deck';
  pptx.lang = 'en-GB';
  pptx.theme = {
    headFontFace: 'Arial', bodyFontFace: 'Arial', lang: 'en-GB'
  };
  pptx.defineSlideMaster({
    title: 'NWG',
    background: { color: C.white },
    objects: [
      { line: { x: M, y: H - 0.34, w: W - 2 * M, h: 0, line: { color: C.line, width: 0.6 } } },
      { text: { text: deck.brand?.deck_footer || 'NatWest Group · Confidential', options: { x: M, y: H - 0.27, w: 5.7, h: 0.14, fontFace: 'Arial', fontSize: 6.5, color: C.muted, margin: 0 } } }
    ],
    slideNumber: { x: W - 0.85, y: H - 0.28, color: C.muted, fontFace: 'Arial', fontSize: 6.5 }
  });
}

function title(slide, value, y = 0.55, color = C.ink, size = 28, w = 8.8, x = M) {
  slide.addText(text(value), { x, y, w, h: 0.75, fontFace: 'Arial', fontSize: size, bold: true, color, breakLine: false, fit: 'shrink', margin: 0.02 });
}
function kicker(slide, value, x = M, y = 0.34, color = C.purple700) {
  if (!value) return;
  slide.addText(text(value).toUpperCase(), { x, y, w: 4.6, h: 0.22, fontFace: 'Arial', fontSize: 8.5, bold: true, color, charSpacing: 1.8, margin: 0 });
}
function footerPage(slide, page) {
  slide.addText(String(page).padStart(2, '0'), { x: W - 0.82, y: H - 0.28, w: 0.35, h: 0.12, fontSize: 6.5, color: C.muted, margin: 0, align: 'right' });
}
function pill(slide, value, x, y, w, color = C.purple800) {
  slide.addShape(slide.ShapeType.roundRect, { x, y, w, h: 0.34, rectRadius: 0.07, fill: { color }, line: { color }, radius: 0.08 });
  slide.addText(text(value), { x: x + 0.08, y: y + 0.08, w: w - 0.16, h: 0.12, fontSize: 7.8, bold: true, color: C.white, margin: 0, fit: 'shrink' });
}
function bullets(slide, items, x, y, w, options = {}) {
  list(items).forEach((item, i) => {
    const yy = y + i * (options.gap || 0.48);
    slide.addShape(slide.ShapeType.ellipse, { x, y: yy + 0.06, w: 0.13, h: 0.13, fill: { color: options.dot || C.gold }, line: { color: options.dot || C.gold } });
    slide.addText(text(item), { x: x + 0.23, y: yy, w: w - 0.23, h: options.h || 0.32, fontSize: options.size || 10.5, color: options.color || C.ink, margin: 0, fit: 'shrink', breakLine: false });
  });
}
function card(slide, x, y, w, h, fill = C.white, line = C.line) {
  slide.addShape(slide.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: line, width: 0.7 } });
}
function chartSeries(chartData) {
  const chart = obj(chartData);
  const labels = list(chart.x_axis).map(text);
  const series = list(chart.series).map((s, i) => ({ name: text(s.name || `Series ${i + 1}`), labels, values: list(s.values).map(Number) }));
  return series.length ? series : [{ name: 'Value', labels: labels.length ? labels : ['A', 'B', 'C'], values: [30, 45, 25] }];
}
function chartType(pptx, type) {
  const key = String(type || 'bar').toLowerCase();
  if (key === 'line' || key === 'area' || key === 'scatter') return pptx.charts.LINE;
  if (key === 'pie') return pptx.charts.PIE;
  if (key === 'donut' || key === 'doughnut') return pptx.charts.DOUGHNUT || pptx.charts.PIE;
  return pptx.charts.BAR;
}
function nativeChart(pptx, slide, chartData, x, y, w, h, titleText = '') {
  const chart = obj(chartData);
  const type = String(chart.type || 'bar').toLowerCase();
  const opts = {
    x, y, w, h,
    showLegend: list(chart.series).length > 1,
    showValue: false,
    showCategoryName: false,
    showTitle: Boolean(titleText),
    title: titleText,
    titleFontFace: 'Arial', titleFontSize: 10, titleColor: C.ink,
    chartColors: [C.purple700, C.gold, C.blue, C.green, C.rose, C.purple500],
    catAxisLabelColor: C.muted, valAxisLabelColor: C.muted,
    valGridLine: { color: 'EEEAF5', size: 0.4 },
    catGridLine: { style: 'none' },
    showCatName: true,
    showValAxis: type !== 'pie' && type !== 'donut',
    showCatAxis: type !== 'pie' && type !== 'donut'
  };
  if (type === 'bar') opts.barDir = 'col';
  if (type === 'line' || type === 'area' || type === 'scatter') opts.lineSize = 2.2;
  if (type === 'pie' || type === 'donut') {
    opts.showPercent = true;
    opts.holeSize = type === 'donut' ? 55 : undefined;
  }
  slide.addChart(chartType(pptx, type), chartSeries(chart), opts);
  if (chart.y_axis_label && type !== 'pie' && type !== 'donut') {
    slide.addText(text(chart.y_axis_label), { x, y: y - 0.16, w: 1.2, h: 0.12, fontSize: 6.5, color: C.muted, margin: 0 });
  }
}

function renderCover(slide, s, page) {
  slide.background = { color: C.purple900 };
  slide.addShape(slide.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.purple900 }, line: { color: C.purple900 } });
  slide.addShape(slide.ShapeType.arc, { x: 9.25, y: -0.45, w: 4.7, h: 4.7, adjustPoint: 0.35, line: { color: C.gold, width: 2.2 }, fill: { color: C.purple900, transparency: 100 } });
  kicker(slide, s.kicker, M, 0.72, C.gold);
  title(slide, s.title, 1.34, C.white, 39, 9.6, M);
  slide.addText(text(s.subtitle), { x: M, y: 3.12, w: 7.4, h: 0.42, fontSize: 15, color: C.purple100, margin: 0, fit: 'shrink' });
  slide.addText(text(s.date), { x: M, y: 6.55, w: 3.0, h: 0.22, fontSize: 10, color: C.white, bold: true, margin: 0 });
  footerPage(slide, page);
}
function renderSection(slide, s, page) {
  slide.addShape(slide.ShapeType.rect, { x: 0, y: 0, w: 3.0, h: H, fill: { color: C.purple800 }, line: { color: C.purple800 } });
  slide.addText(text(s.section_number || String(page).padStart(2, '0')), { x: 0.55, y: 0.62, w: 1.4, h: 0.7, fontSize: 34, bold: true, color: C.gold, margin: 0 });
  title(slide, s.title, 2.05, C.ink, 36, 7.8, 3.45);
  slide.addText(text(s.kicker || s.speaker || ''), { x: 3.5, y: 1.55, w: 4.2, h: 0.22, fontSize: 9, bold: true, color: C.purple700, margin: 0 });
  slide.addText(text(s.role || ''), { x: 3.5, y: 5.92, w: 3.5, h: 0.22, fontSize: 10, color: C.muted, margin: 0 });
  footerPage(slide, page);
}
function renderAgenda(slide, s, page) {
  title(slide, s.title, 0.55, C.ink, 30, 7.2);
  card(slide, 0.65, 1.55, 3.6, 4.85, C.purple050, 'E4D4EF');
  slide.addText('Presenters', { x: 0.93, y: 1.9, w: 2.4, h: 0.2, fontSize: 12, bold: true, color: C.purple800, margin: 0 });
  list(s.presenter_items).forEach((p, i) => {
    const y = 2.42 + i * 0.86;
    slide.addShape(slide.ShapeType.ellipse, { x: 0.93, y, w: 0.42, h: 0.42, fill: { color: C.purple700 }, line: { color: C.purple700 } });
    slide.addText(text(p.name), { x: 1.53, y: y - 0.01, w: 2.2, h: 0.18, fontSize: 10, bold: true, color: C.ink, margin: 0 });
    slide.addText(text(p.role), { x: 1.53, y: y + 0.22, w: 2.2, h: 0.16, fontSize: 7.5, color: C.muted, margin: 0 });
  });
  list(s.agenda_items).forEach((item, i) => {
    const y = 1.56 + i * 0.78;
    slide.addText(String(i + 1).padStart(2, '0'), { x: 5.05, y, w: 0.42, h: 0.3, fontSize: 15, bold: true, color: C.gold, margin: 0 });
    slide.addText(text(item), { x: 5.75, y: y + 0.02, w: 5.6, h: 0.3, fontSize: 14, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
    slide.addShape(slide.ShapeType.line, { x: 5.05, y: y + 0.54, w: 6.3, h: 0, line: { color: C.line, width: 0.7 } });
  });
  footerPage(slide, page);
}
function renderStack(slide, s, page) {
  title(slide, s.title, 0.54, C.ink, 29, 9.0);
  kicker(slide, s.kicker, M, 0.32);
  list(s.stack_items).forEach((item, i) => {
    const y = 1.55 + i * 0.82;
    card(slide, 1.05, y, 10.7, 0.55, i % 2 ? C.white : C.purple050, i % 2 ? C.line : 'E4D4EF');
    slide.addShape(slide.ShapeType.ellipse, { x: 1.34, y: y + 0.14, w: 0.25, h: 0.25, fill: { color: C.gold }, line: { color: C.gold } });
    slide.addText(text(item), { x: 1.82, y: y + 0.14, w: 9.2, h: 0.22, fontSize: 13, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
  });
  if (s.footer) slide.addText(text(s.footer), { x: M, y: 6.65, w: 7.0, h: 0.16, fontSize: 7.5, color: C.muted, margin: 0 });
  footerPage(slide, page);
}
function render3Col(slide, s, page) {
  title(slide, s.title, 0.44, C.ink, 27, 9.4);
  pill(slide, s.banner || 'Focus areas', 0.75, 1.25, 11.85);
  const cols = list(s.column_items).slice(0, 3);
  cols.forEach((col, i) => {
    const x = 0.75 + i * 4.02;
    card(slide, x, 1.9, 3.7, 4.35, C.white, 'E4D4EF');
    slide.addShape(slide.ShapeType.ellipse, { x: x + 0.18, y: 2.15, w: 0.36, h: 0.36, fill: { color: [C.purple700, C.gold, C.blue][i] }, line: { color: [C.purple700, C.gold, C.blue][i] } });
    slide.addText(text(col.heading), { x: x + 0.72, y: 2.12, w: 2.55, h: 0.28, fontSize: 13, bold: true, color: C.purple800, margin: 0, fit: 'shrink' });
    bullets(slide, col.bullets, x + 0.3, 2.85, 3.05, { gap: 0.58, size: 9.2 });
  });
  if (s.footer) pill(slide, s.footer, 0.75, 6.42, 11.85, C.purple700);
  footerPage(slide, page);
}
function renderMatrix(slide, s, page) {
  title(slide, s.title, 0.42, C.ink, 27, 9.2);
  kicker(slide, s.kicker, M, 0.23);
  const data = obj(s.matrix_data);
  const headers = list(data.headers);
  const rows = list(data.rows);
  const x0 = 0.9, y0 = 1.48, rowH = 0.58, labW = 2.2;
  const colW = headers.length ? (10.6 - labW) / headers.length : 2;
  headers.forEach((h, i) => {
    const x = x0 + labW + i * colW;
    const dark = i === data.highlight_col;
    card(slide, x, y0, colW - 0.04, 0.58, dark ? C.purple800 : C.purple050, dark ? C.purple800 : 'E4D4EF');
    slide.addText(text(h.title || h), { x: x + 0.1, y: y0 + 0.1, w: colW - 0.24, h: 0.16, fontSize: 8.5, bold: true, color: dark ? C.white : C.purple800, margin: 0, fit: 'shrink' });
    slide.addText(text(h.subtitle || ''), { x: x + 0.1, y: y0 + 0.31, w: colW - 0.24, h: 0.12, fontSize: 6.2, color: dark ? C.purple100 : C.muted, margin: 0, fit: 'shrink' });
  });
  rows.forEach((r, ri) => {
    const y = y0 + 0.75 + ri * rowH;
    slide.addText(text(r.label), { x: x0, y: y + 0.15, w: labW - 0.12, h: 0.16, fontSize: 8.2, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
    list(r.values).forEach((v, ci) => {
      const x = x0 + labW + ci * colW;
      const dark = ci === data.highlight_col;
      card(slide, x, y, colW - 0.04, 0.42, dark ? C.purple700 : C.white, dark ? C.purple700 : C.line);
      slide.addText(text(v), { x: x + 0.08, y: y + 0.13, w: colW - 0.2, h: 0.12, fontSize: 7.8, color: dark ? C.white : C.ink, align: 'center', margin: 0, fit: 'shrink' });
    });
  });
  footerPage(slide, page);
}
function renderStats(slide, s, page) {
  title(slide, s.title, 0.42, C.ink, 27, 9.4);
  const groups = [[s.group_1_title, list(s.stats_group_1), 1.55], [s.group_2_title, list(s.stats_group_2), 4.15]];
  groups.forEach(([label, stats, yBase]) => {
    pill(slide, label || 'Metrics', 0.8, yBase, 3.0, C.purple800);
    stats.slice(0, 4).forEach((st, i) => {
      const x = 0.8 + i * 3.0;
      card(slide, x, yBase + 0.58, 2.68, 1.34, i % 2 ? C.white : C.purple050, 'E4D4EF');
      slide.addText(text(st.value), { x: x + 0.18, y: yBase + 0.84, w: 2.15, h: 0.34, fontSize: 22, bold: true, color: C.purple800, margin: 0, fit: 'shrink' });
      slide.addText(text(st.label), { x: x + 0.2, y: yBase + 1.28, w: 2.15, h: 0.24, fontSize: 7.8, color: C.muted, margin: 0, fit: 'shrink' });
    });
  });
  footerPage(slide, page);
}
function renderChart(slide, s, chartData, page, pptx) {
  nativeChart(pptx, slide, chartData, 0.72, 1.35, 6.7, 4.85, '');
  kicker(slide, s.kicker, 8.0, 1.12);
  title(slide, s.title, 1.48, C.ink, 25, 4.45, 8.0);
  bullets(slide, s.narrative_items, 8.05, 3.28, 4.3, { gap: 0.62, size: 10.2, h: 0.4 });
  footerPage(slide, page);
}
function renderHub(slide, s, chartData, page, pptx) {
  title(slide, s.title, 0.42, C.ink, 27, 8.8);
  kicker(slide, s.kicker, M, 0.22);
  nativeChart(pptx, slide, chartData || { type: 'donut', x_axis: list(s.legend_items), series: [{ name: 'Share', values: [40, 25, 20, 15] }] }, 0.85, 1.45, 5.2, 4.55, '');
  slide.addText(text(s.center_value || ''), { x: 2.45, y: 3.15, w: 1.6, h: 0.36, fontSize: 20, bold: true, color: C.purple800, align: 'center', margin: 0, fit: 'shrink' });
  list(s.callout_items).slice(0, 3).forEach((c, i) => {
    const y = 1.45 + i * 1.45;
    card(slide, 6.85, y, 5.25, 1.05, C.purple050, 'E4D4EF');
    slide.addText(text(c.title), { x: 7.1, y: y + 0.18, w: 4.6, h: 0.18, fontSize: 11, bold: true, color: C.purple800, margin: 0, fit: 'shrink' });
    slide.addText(text(c.body), { x: 7.1, y: y + 0.48, w: 4.6, h: 0.28, fontSize: 8.2, color: C.ink, margin: 0, fit: 'shrink' });
  });
  list(s.legend_items).slice(0, 6).forEach((l, i) => {
    slide.addShape(slide.ShapeType.rect, { x: 1.05 + (i % 3) * 1.45, y: 6.15 + Math.floor(i / 3) * 0.25, w: 0.12, h: 0.12, fill: { color: [C.purple700, C.gold, C.blue, C.green, C.rose, C.purple500][i] }, line: { color: [C.purple700, C.gold, C.blue, C.green, C.rose, C.purple500][i] } });
    slide.addText(text(l), { x: 1.23 + (i % 3) * 1.45, y: 6.11 + Math.floor(i / 3) * 0.25, w: 1.1, h: 0.12, fontSize: 6.5, color: C.muted, margin: 0, fit: 'shrink' });
  });
  footerPage(slide, page);
}
function renderProcess(slide, s, page) {
  title(slide, s.title, 0.42, C.ink, 27, 9.2);
  kicker(slide, s.kicker, M, 0.22);
  list(s.step_items).slice(0, 3).forEach((step, i) => {
    const x = 0.8 + i * 4.05;
    card(slide, x, 1.62, 3.52, 3.05, C.white, 'E4D4EF');
    slide.addText(text(step.date), { x: x + 0.22, y: 1.9, w: 1.3, h: 0.16, fontSize: 8, bold: true, color: C.gold, margin: 0 });
    slide.addText(text(step.title), { x: x + 0.22, y: 2.18, w: 2.95, h: 0.34, fontSize: 13, bold: true, color: C.purple800, margin: 0, fit: 'shrink' });
    slide.addText(text(step.body), { x: x + 0.22, y: 2.9, w: 2.95, h: 0.72, fontSize: 8.6, color: C.ink, margin: 0.02, fit: 'shrink' });
  });
  list(s.action_items).slice(0, 3).forEach((a, i) => {
    card(slide, 0.8 + i * 4.05, 5.22, 3.52, 0.62, C.purple050, 'E4D4EF');
    slide.addText(text(a), { x: 1.02 + i * 4.05, y: 5.42, w: 3.05, h: 0.18, fontSize: 8.4, bold: true, color: C.purple800, margin: 0, fit: 'shrink' });
  });
  footerPage(slide, page);
}
function renderTree(slide, s, page) {
  title(slide, s.title, 0.42, C.ink, 27, 9.2);
  card(slide, 4.75, 1.35, 3.45, 0.72, C.purple800, C.purple800);
  slide.addText(text(s.parent), { x: 4.95, y: 1.58, w: 3.05, h: 0.16, fontSize: 12, bold: true, color: C.white, align: 'center', margin: 0, fit: 'shrink' });
  const children = list(s.child_items).slice(0, 5);
  children.forEach((c, i) => {
    const spacing = 10.6 / Math.max(children.length, 1);
    const x = 1.05 + i * spacing;
    slide.addShape(slide.ShapeType.line, { x: 6.48, y: 2.08, w: x + 0.85 - 6.48, h: 1.02, line: { color: C.line, width: 1.1 } });
    card(slide, x, 3.1, 1.7, 0.68, c.focus ? C.gold : C.purple050, c.focus ? C.gold : 'E4D4EF');
    slide.addText(text(c.label), { x: x + 0.12, y: 3.33, w: 1.45, h: 0.12, fontSize: 7.7, bold: true, color: c.focus ? C.ink : C.purple800, align: 'center', margin: 0, fit: 'shrink' });
  });
  if (s.grid_title) slide.addText(text(s.grid_title), { x: 1.05, y: 4.78, w: 2.3, h: 0.18, fontSize: 10, bold: true, color: C.purple800, margin: 0 });
  list(s.grid_items).slice(0, 6).forEach((g, i) => {
    const x = 1.05 + (i % 3) * 3.72, y = 5.12 + Math.floor(i / 3) * 0.5;
    card(slide, x, y, 3.22, 0.36, C.white, C.line);
    slide.addText(text(g), { x: x + 0.14, y: y + 0.12, w: 2.9, h: 0.1, fontSize: 7.3, color: C.ink, margin: 0, fit: 'shrink' });
  });
  footerPage(slide, page);
}
function renderClose(slide, s, page) {
  slide.background = { color: C.purple900 };
  slide.addShape(slide.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.purple900 }, line: { color: C.purple900 } });
  title(slide, s.title, 1.45, C.white, 42, 7.8, 0.8);
  slide.addText(text(s.subtitle), { x: 0.82, y: 2.45, w: 5.8, h: 0.34, fontSize: 17, color: C.gold, bold: true, margin: 0, fit: 'shrink' });
  list(s.paragraphs).forEach((p, i) => slide.addText(text(p), { x: 0.85 + (i % 2) * 5.8, y: 4.8 + Math.floor(i / 2) * 0.45, w: 5.0, h: 0.25, fontSize: 8.2, color: C.purple100, margin: 0, fit: 'shrink' }));
  footerPage(slide, page);
}
function renderFallback(slide, s, page) {
  title(slide, s.title || 'Untitled slide', 0.55, C.ink, 28, 9.0);
  const entries = Object.entries(s).filter(([k]) => k !== 'title').slice(0, 9);
  entries.forEach(([k, v], i) => {
    slide.addText(`${k}: ${Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : text(v)}`, { x: 0.8, y: 1.45 + i * 0.42, w: 10.8, h: 0.24, fontSize: 8.5, color: C.ink, margin: 0, fit: 'shrink' });
  });
  footerPage(slide, page);
}

async function renderComposedAsImage(pptx, slideJson, slideHtmlPath, page) {
  const slide = pptx.addSlide('NWG');
  slide.ShapeType = pptx.ShapeType;
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    const globalRoots = ['/opt/homebrew/lib/node_modules', '/usr/local/lib/node_modules'];
    try {
      const gr = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (gr) globalRoots.unshift(gr);
    } catch { }
    for (const root of globalRoots) {
      try {
        const req = createRequire(path.join(root, 'puppeteer', 'package.json'));
        puppeteer = req(path.join(root, 'puppeteer'));
        break;
      } catch { }
    }
  }
  if (!puppeteer) {
    renderFallback(slide, obj(slideJson.slots), page);
    slide.addText('⚠ puppeteer not found — install with: npm install -g puppeteer', { x: 0.5, y: 6.8, w: 12, h: 0.3, fontSize: 9, color: C.rose, margin: 0 });
    return;
  }
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  await pg.goto(`file://${path.resolve(slideHtmlPath)}`, { waitUntil: 'networkidle0' });
  const imgRaw = await pg.screenshot({ type: 'png' });
  await browser.close();
  const imgB64 = Buffer.from(imgRaw).toString('base64');
  slide.addImage({ data: `data:image/png;base64,${imgB64}`, x: 0, y: 0, w: W, h: H });
  slide.addText(String(page).padStart(2, '0'), { x: W - 0.82, y: H - 0.28, w: 0.35, h: 0.12, fontSize: 6.5, color: C.white, margin: 0, align: 'right' });
}

async function renderSlide(pptx, deck, slideJson, index, root) {
  const slots = obj(slideJson.slots);
  const layout = String(slideJson.template || '').split('/')[0];
  if (layout === 'composed') {
    const slideHtmlPath = path.join(root, 'slides', `${slideJson.id}.html`);
    await renderComposedAsImage(pptx, slideJson, slideHtmlPath, index + 1);
    return;
  }
  const slide = pptx.addSlide('NWG');
  slide.ShapeType = pptx.ShapeType;
  switch (layout) {
    case 's-cover': renderCover(slide, slots, index + 1); break;
    case 's-section': renderSection(slide, slots, index + 1); break;
    case 's-agenda': renderAgenda(slide, slots, index + 1); break;
    case 's-stack': renderStack(slide, slots, index + 1); break;
    case 's-3col': render3Col(slide, slots, index + 1); break;
    case 's-matrix': renderMatrix(slide, slots, index + 1); break;
    case 's-stats': renderStats(slide, slots, index + 1); break;
    case 's-chart': renderChart(slide, slots, slideJson.chart_data, index + 1, pptx); break;
    case 's-hub': renderHub(slide, slots, slideJson.chart_data, index + 1, pptx); break;
    case 's-process': renderProcess(slide, slots, index + 1); break;
    case 's-tree': renderTree(slide, slots, index + 1); break;
    case 's-close': renderClose(slide, slots, index + 1); break;
    default: renderFallback(slide, slots, index + 1);
  }
}

export async function exportDeck(projectDir) {
  const PptxGenJS = await loadPptxGen();
  const pptx = new PptxGenJS();
  const root = path.resolve(projectDir);
  const deck = readJson(path.join(root, 'deck.json'));
  setup(pptx, deck);
  for (const [index, id] of deck.slides.entries()) {
    await renderSlide(pptx, deck, readJson(path.join(root, 'slides', `${id}.json`)), index, root);
  }
  const out = path.join(root, 'deck.pptx');
  await pptx.writeFile({ fileName: out });
  const manifest = {
    title: deck.title,
    output: out,
    slides: deck.slides.map(id => ({ id, json: path.join(root, 'slides', `${id}.json`), html: path.join(root, 'slides', `${id}.html`) })),
    exported_at: new Date().toISOString(),
    editable_text: true,
    native_charts: true
  };
  fs.writeFileSync(path.join(root, 'pptx-export-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return out;
}

if (process.argv[1] === __filename) {
  const [projectDir] = process.argv.slice(2);
  if (!projectDir) throw new Error('Usage: node export_deck_pptx.mjs <deck-dir>');
  exportDeck(projectDir).then(out => console.log(`Wrote ${out}`));
}
