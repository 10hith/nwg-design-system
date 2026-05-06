import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDeck } from './build_deck.mjs';

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, v) { fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); }

/**
 * Parse a component element ID of the form `slide-NN--type-index`
 * Returns { slideId, componentType, componentIndex } or null.
 */
function parseElementId(elementId) {
  const m = String(elementId || '').match(/^(slide-[^-]+(?:-\d+)?)--([a-z-]+)-(\d+)$/);
  if (!m) return null;
  return { slideId: m[1], componentType: m[2], componentIndex: parseInt(m[3], 10) - 1 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [projectDir] = process.argv.slice(2);
  if (!projectDir) throw new Error('Usage: node apply_feedback.mjs <deck-dir>');
  const root = path.resolve(projectDir);
  const deckPath = path.join(root, 'deck.json');
  const feedbackPath = path.join(root, 'feedback.json');
  const deck = readJson(deckPath);
  const feedback = readJson(feedbackPath);
  const remaining = [];
  const processed = [];
  const errored = [];

  for (const item of feedback.items || []) {
    try {
      if (item.type === 'theme_change') {
        deck.theme = deck.theme || {};
        deck.theme.palette = item.palette;
        processed.push(item);

      } else if (item.type === 'slide_reorder') {
        const proposed = item.new_order || [];
        const known = new Set(deck.slides);
        if (proposed.length !== deck.slides.length || proposed.some(id => !known.has(id)))
          throw new Error('new_order must contain exactly the existing slide ids');
        deck.slides = proposed;
        processed.push(item);

      } else if (item.type === 'slide_delete') {
        deck.slides = deck.slides.filter(id => id !== item.slide_id);
        for (const ext of ['json', 'html']) {
          const p = path.join(root, 'slides', `${item.slide_id}.${ext}`);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }
        processed.push(item);

      } else if (item.type === 'component_prop_patch') {
        // Patch props on a specific component instance.
        // item.element_id: "slide-03--stat-tile-2"
        // item.props: { "value": "£15.2bn" }
        const parsed = parseElementId(item.element_id);
        if (!parsed) throw new Error(`Cannot parse element_id: ${item.element_id}`);
        const slidePath = path.join(root, 'slides', `${parsed.slideId}.json`);
        const slide = readJson(slidePath);
        const comp = slide.components?.[parsed.componentIndex];
        if (!comp) throw new Error(`Component index ${parsed.componentIndex} not found in ${parsed.slideId}`);
        comp.props = { ...(comp.props || {}), ...(item.props || {}) };
        writeJson(slidePath, slide);
        processed.push(item);

      } else if (item.type === 'component_box_patch') {
        // Reposition / resize a component instance.
        // item.element_id: "slide-03--title-block-1"
        // item.box: { "x": 0.5, "y": 0.6 }
        const parsed = parseElementId(item.element_id);
        if (!parsed) throw new Error(`Cannot parse element_id: ${item.element_id}`);
        const slidePath = path.join(root, 'slides', `${parsed.slideId}.json`);
        const slide = readJson(slidePath);
        const comp = slide.components?.[parsed.componentIndex];
        if (!comp) throw new Error(`Component index ${parsed.componentIndex} not found in ${parsed.slideId}`);
        comp.box = { ...(comp.box || {}), ...(item.box || {}) };
        writeJson(slidePath, slide);
        processed.push(item);

      } else if (item.type === 'viz_override') {
        const slidePath = path.join(root, 'slides', `${item.slide_id}.json`);
        const slide = readJson(slidePath);
        const chart = slide.components?.find(c => c.type === 'inline-chart');
        if (!chart) throw new Error(`No inline-chart component found in ${item.slide_id}`);
        chart.props = { ...(chart.props || {}), type: item.new_viz };
        writeJson(slidePath, slide);
        processed.push(item);

      } else if (item.type === 'comment') {
        const parsed = parseElementId(item.element_id);
        item.error = `requires Claude rewrite for component: ${parsed ? `${parsed.componentType}[${parsed.componentIndex}] on ${parsed.slideId}` : item.element_id}`;
        remaining.push(item);

      } else if (item.type === 'slide_add') {
        item.error = 'requires Claude to author slide JSON with components array from prompt';
        remaining.push(item);

      } else {
        item.error = `unknown feedback type: ${item.type}`;
        remaining.push(item);
      }
    } catch (error) {
      item.error = error.message;
      remaining.push(item);
      errored.push(item);
    }
  }

  deck.last_applied_at = new Date().toISOString();
  writeJson(deckPath, deck);
  feedback.items = remaining;
  writeJson(feedbackPath, feedback);

  const rebuilt = buildDeck(root);
  const report = [
    '# Apply report', '',
    `- Processed: ${processed.length}`,
    `- Remaining: ${remaining.length}`,
    `- Errored: ${errored.length}`,
    `- Slides rebuilt: ${rebuilt}`, '',
    '## Processed items', ...processed.map(i => `- ${i.id}: ${i.type}`), '',
    '## Remaining items', ...remaining.map(i => `- ${i.id}: ${i.type}${i.error ? ` — ${i.error}` : ''}`), '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'apply-report.md'), report);
  console.log(`Processed ${processed.length}; remaining ${remaining.length}; rebuilt ${rebuilt}`);
}
