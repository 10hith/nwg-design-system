#!/usr/bin/env node
/**
 * apply_preset.mjs — merge a preset's component list into a slide JSON.
 * Slot interpolation (${key}) is intentionally left to the agent at authoring time.
 * This script simply stamps the preset's component skeleton onto an existing slide.
 *
 * Usage:
 *   node scripts/apply_preset.mjs <preset-id> <slide-json-path>
 *
 * Example:
 *   node scripts/apply_preset.mjs s-cover decks/my-deck/slides/slide-01.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot  = path.resolve(__dirname, '..');
const presetsDir = path.join(skillRoot, 'templates', 'presets');

const [presetId, slidePath] = process.argv.slice(2);
if (!presetId || !slidePath) {
  console.error('Usage: node apply_preset.mjs <preset-id> <slide-json-path>');
  process.exit(1);
}

const presetFile = path.join(presetsDir, `${presetId}.json`);
if (!fs.existsSync(presetFile)) {
  const available = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).join(', ');
  console.error(`Preset "${presetId}" not found. Available: ${available}`);
  process.exit(1);
}

const preset   = JSON.parse(fs.readFileSync(presetFile,  'utf8'));
const slideAbs = path.resolve(slidePath);
const slide    = fs.existsSync(slideAbs) ? JSON.parse(fs.readFileSync(slideAbs, 'utf8')) : { id: path.basename(slideAbs, '.json') };

slide.components = JSON.parse(JSON.stringify(preset.components));

fs.writeFileSync(slideAbs, JSON.stringify(slide, null, 2) + '\n');
console.log(`Applied preset "${presetId}" to ${slideAbs}`);
console.log('Required slots:', (preset.slots ?? []).join(', ') || '(none)');
