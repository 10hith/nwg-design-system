export const type = 'stat-row';

import { renderHtml as statTileHtml, renderPptx as statTilePptx } from './stat-tile.mjs';

export function renderHtml(props) {
  const items = props.items ?? [];
  const cols  = items.length || 1;
  const cells = items.map(item =>
    `<div style="flex:1">${statTileHtml(item)}</div>`
  ).join('');
  return `<div class="nwg-stat-row" style="display:flex;gap:${props.gap ?? 14}px;width:100%;height:100%">${cells}</div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const items = props.items ?? [];
  const n     = items.length || 1;
  const gap   = (props.gap ?? 14) / 96;
  const tileW = (box.w - gap * (n - 1)) / n;
  items.forEach((item, i) => {
    statTilePptx(slide, item, { x: box.x + i * (tileW + gap), y: box.y, w: tileW, h: box.h }, ctx);
  });
}
