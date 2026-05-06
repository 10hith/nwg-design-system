import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSlideHtml } from '../lib/render_slide_html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function buildSlide(projectDir, slideId, page = null) {
  const slidePath = path.join(projectDir, 'slides', `${slideId}.json`);
  const slide = JSON.parse(fs.readFileSync(slidePath, 'utf8'));
  const outPath = path.join(projectDir, 'slides', `${slideId}.html`);

  if (!slide.components) {
    throw new Error(`Slide "${slideId}" has no "components" array. The old "composed"/"template" formats are no longer supported. Use the component-based schema instead.`);
  }

  const body = renderSlideHtml(slide, slideId, page);
  const shell = fs.readFileSync(path.join(skillRoot, 'templates/_shared/slide-shell.html'), 'utf8');
  const title = slide.title ?? slideId;
  const full = shell.replace('{{title}}', esc(title)).replace('{{content}}', body);
  fs.writeFileSync(outPath, full);
  return outPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [projectDir, slideId] = process.argv.slice(2);
  if (!projectDir || !slideId) throw new Error('Usage: node build_slide.mjs <deck-dir> <slide-id>');
  console.log(buildSlide(path.resolve(projectDir), slideId));
}
