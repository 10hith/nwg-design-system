import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSlide } from './build_slide.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');

function ensureFeedback(projectDir) {
  const feedback = path.join(projectDir, 'feedback.json');
  if (!fs.existsSync(feedback)) fs.writeFileSync(feedback, JSON.stringify({version:1, session_started_at:new Date().toISOString(), items:[]}, null, 2));
}

function copyAssets(projectDir) {
  fs.mkdirSync(path.join(projectDir, 'assets'), {recursive:true});
  fs.copyFileSync(path.join(skillRoot, 'assets/nwg-tokens.css'), path.join(projectDir, 'assets/nwg-tokens.css'));
  fs.copyFileSync(path.join(skillRoot, 'assets/review-playground.template.html'), path.join(projectDir, 'review-playground.html'));
}

function writeIndex(projectDir, deck) {
  const slides = deck.slides.map(id => `<iframe src="../slides/${id}.html" title="${id}"></iframe>`).join('\n');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${deck.title || 'NWG Deck'}</title><style>body{margin:0;background:#f3f1f7;font-family:system-ui}.wrap{display:grid;gap:32px;padding:32px}iframe{width:1280px;height:720px;border:0;box-shadow:0 12px 32px #2b0a4a22;background:white;transform-origin:top left}@media(max-width:1340px){iframe{transform:scale(.75);margin-bottom:-180px}}</style></head><body><div class="wrap">${slides}</div><script>addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowRight')scrollBy({top:760,behavior:'smooth'});if(e.key==='ArrowUp'||e.key==='ArrowLeft')scrollBy({top:-760,behavior:'smooth'});});</script></body></html>`;
  fs.writeFileSync(path.join(projectDir, 'assets/deck_index.html'), html);
}

export function buildDeck(projectDir) {
  projectDir = path.resolve(projectDir);
  const deckPath = path.join(projectDir, 'deck.json');
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  fs.mkdirSync(path.join(projectDir, 'slides'), {recursive:true});
  copyAssets(projectDir);
  deck.slides.forEach((slideId, idx) => buildSlide(projectDir, slideId, idx + 1));
  writeIndex(projectDir, deck);
  ensureFeedback(projectDir);
  return deck.slides.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [projectDir] = process.argv.slice(2);
  if (!projectDir) throw new Error('Usage: node build_deck.mjs <deck-dir>');
  const count = buildDeck(projectDir);
  console.log(`Built ${count} slides`);
}
