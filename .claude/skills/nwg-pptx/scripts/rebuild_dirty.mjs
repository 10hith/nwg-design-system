import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSlide } from './build_slide.mjs';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [projectDir] = process.argv.slice(2);
  if (!projectDir) throw new Error('Usage: node rebuild_dirty.mjs <deck-dir>');
  const root = path.resolve(projectDir);
  const deck = JSON.parse(fs.readFileSync(path.join(root, 'deck.json'), 'utf8'));
  let rebuilt = 0;
  deck.slides.forEach((slideId, idx) => {
    const json = path.join(root, 'slides', `${slideId}.json`);
    const html = path.join(root, 'slides', `${slideId}.html`);
    if (!fs.existsSync(html) || fs.statSync(json).mtimeMs > fs.statSync(html).mtimeMs) {
      buildSlide(root, slideId, idx + 1);
      rebuilt += 1;
    }
  });
  console.log(`Rebuilt ${rebuilt} dirty slides`);
}
