import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [galleryPath] = process.argv.slice(2);
  if (!galleryPath) throw new Error('Usage: node refresh_templates.mjs <design-system/nwg-layouts.html>');
  const html = fs.readFileSync(galleryPath, 'utf8');
  const matches = [...html.matchAll(/<div class="slide (s-[^"]+)">([\s\S]*?)\n\s*<\/div>\n<\/div>/g)];
  console.log(`Found ${matches.length} candidate slide blocks. Manual slot conversion is required before replacing production templates.`);
}
