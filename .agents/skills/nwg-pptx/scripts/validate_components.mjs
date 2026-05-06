#!/usr/bin/env node
/**
 * validate_components.mjs
 * Verifies:
 *  1. All 17 component modules export `type`, `renderHtml`, `renderPptx`.
 *  2. All 12 preset JSON files exist and have required fields.
 *  3. Component index registry maps every component to the right type.
 * Usage: node scripts/validate_components.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const skillRoot  = path.resolve(__dirname, '..');
const compDir    = path.join(skillRoot, 'components');
const presetsDir = path.join(skillRoot, 'templates', 'presets');

let errors = 0;
function fail(msg) { console.error('FAIL:', msg); errors++; }
function ok(msg)   { console.log('  ok:', msg); }

const REQUIRED_COMPONENTS = [
  'arc-accent', 'bullet-list', 'bullet-row', 'callout-card', 'data-table',
  'divider-bar', 'hero-band', 'icon-pill', 'image-frame', 'inline-chart',
  'kicker-label', 'metric-delta', 'quote-block', 'section-number',
  'stat-row', 'stat-tile', 'title-block',
];

const REQUIRED_PRESETS = [
  's-cover', 's-section', 's-agenda', 's-stack', 's-3col', 's-matrix',
  's-stats', 's-chart', 's-hub', 's-process', 's-tree', 's-close',
];

console.log('\n=== Component modules ===');
const { registry } = await import('../components/index.mjs');

for (const name of REQUIRED_COMPONENTS) {
  const mod = registry[name];
  if (!mod) { fail(`${name}: not in registry`); continue; }
  if (mod.type !== name) fail(`${name}: type export is "${mod.type}", expected "${name}"`);
  if (typeof mod.renderHtml !== 'function') fail(`${name}: missing renderHtml`);
  if (typeof mod.renderPptx !== 'function') fail(`${name}: missing renderPptx`);
  ok(`${name}`);
}

console.log('\n=== Preset files ===');
for (const id of REQUIRED_PRESETS) {
  const p = path.join(presetsDir, `${id}.json`);
  if (!fs.existsSync(p)) { fail(`Missing preset: ${id}.json`); continue; }
  let preset;
  try { preset = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(`${id}.json: invalid JSON — ${e.message}`); continue; }
  if (!preset.preset_id) fail(`${id}.json: missing "preset_id"`);
  if (!Array.isArray(preset.components) || !preset.components.length) fail(`${id}.json: missing or empty "components"`);
  for (const c of preset.components) {
    if (!c.type) fail(`${id}.json: component missing "type"`);
    if (!c.box || c.box.x == null || c.box.y == null) fail(`${id}.json: component "${c.type}" missing box x/y`);
  }
  ok(`${id} (${preset.components.length} components)`);
}

console.log('');
if (errors) {
  console.error(`\n${errors} error(s) found.`);
  process.exit(1);
}
console.log(`All checks passed: ${REQUIRED_COMPONENTS.length} components, ${REQUIRED_PRESETS.length} presets.`);
