import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const templatesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const requiredLayouts = ['s-cover','s-section','s-agenda','s-stack','s-3col','s-matrix','s-stats','s-chart','s-hub','s-process','s-tree','s-close'];
const forbidden = [/<script\b/i, /<canvas\b/i, /position\s*:\s*fixed/i, /filter\s*:/i, /backdrop-filter\s*:/i, /mix-blend-mode\s*:/i];
let errors = 0;
function fail(message) { console.error(message); errors++; }
for (const layout of requiredLayouts) {
  const dir = path.join(templatesRoot, layout);
  if (!fs.existsSync(dir)) { fail(`Missing required layout directory: ${layout}`); continue; }
  const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
  if (!htmlFiles.length) fail(`Missing variant HTML for ${layout}`);
  for (const file of htmlFiles) {
    const stem = file.replace(/\.html$/, '');
    const htmlPath = path.join(dir, file);
    const mapPath = path.join(dir, `${stem}.id-map.json`);
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!fs.existsSync(mapPath)) fail(`Missing id map: ${path.relative(process.cwd(), mapPath)}`);
    if (!/class=["'][^"']*\bslide\b/.test(html)) fail(`${layout}/${file} has no .slide root`);
    if (!/{{\s*page\s*}}/.test(html)) fail(`${layout}/${file} does not render {{page}}`);
    forbidden.forEach(rule => { if (rule.test(html)) fail(`${layout}/${file} uses export-risky construct ${rule}`); });
    if (fs.existsSync(mapPath)) {
      try {
        const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        if (!Array.isArray(map) && typeof map !== 'object') fail(`${layout}/${stem}.id-map.json must be object or array`);
      } catch (error) { fail(`${layout}/${stem}.id-map.json is invalid JSON: ${error.message}`); }
    }
  }
}
if (errors) process.exit(1);
console.log(`Templates validated: ${requiredLayouts.length} layouts`);
