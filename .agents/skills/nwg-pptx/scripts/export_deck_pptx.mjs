import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderSlidePptx } from '../lib/render_slide_pptx.mjs';
import { getTokens, SLIDE_W as W, SLIDE_H as H } from '../lib/tokens.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const M = 0.46;

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

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
  const tokens = getTokens(deck.theme?.palette);
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'nwg-pptx';
  pptx.company = 'NatWest Group';
  pptx.subject = deck.subtitle || deck.title || 'NWG deck';
  pptx.title = deck.title || deck.deck_id || 'NWG deck';
  pptx.lang = 'en-GB';
  pptx.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial', lang: 'en-GB' };
  pptx.defineSlideMaster({
    title: 'NWG',
    background: { color: tokens.white },
    objects: [
      { line: { x: M, y: H - 0.34, w: W - 2 * M, h: 0, line: { color: tokens.line, width: 0.6 } } },
      { text: { text: deck.brand?.deck_footer || 'NatWest Group · Confidential', options: { x: M, y: H - 0.27, w: 5.7, h: 0.14, fontFace: 'Arial', fontSize: 6.5, color: tokens.muted, margin: 0 } } },
    ],
    slideNumber: { x: W - 0.85, y: H - 0.28, color: tokens.muted, fontFace: 'Arial', fontSize: 6.5 },
  });
}

export async function exportDeck(projectDir) {
  const PptxGenJS = await loadPptxGen();
  const pptx = new PptxGenJS();
  const root = path.resolve(projectDir);
  const deck = readJson(path.join(root, 'deck.json'));
  setup(pptx, deck);

  for (const id of deck.slides) {
    const slideJson = readJson(path.join(root, 'slides', `${id}.json`));
    if (!slideJson.components) {
      console.warn(`⚠ Slide "${id}" has no "components" array — skipping (old format not supported)`);
      continue;
    }
    const pptxSlide = pptx.addSlide('NWG');
    pptxSlide.ShapeType = pptx.ShapeType;
    renderSlidePptx(pptx, pptxSlide, slideJson);
  }

  const out = path.join(root, 'deck.pptx');
  await pptx.writeFile({ fileName: out });

  const manifest = {
    title: deck.title,
    output: out,
    slides: deck.slides.map(id => ({ id, json: path.join(root, 'slides', `${id}.json`), html: path.join(root, 'slides', `${id}.html`) })),
    exported_at: new Date().toISOString(),
    editable_text: true,
    native_charts: true,
  };
  fs.writeFileSync(path.join(root, 'pptx-export-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return out;
}

if (process.argv[1] === __filename) {
  const [projectDir] = process.argv.slice(2);
  if (!projectDir) throw new Error('Usage: node export_deck_pptx.mjs <deck-dir>');
  exportDeck(projectDir).then(out => console.log(`Wrote ${out}`));
}
