export const type = 'bullet-list';

import { renderHtml as rowHtml, renderPptx as rowPptx } from './bullet-row.mjs';

export function renderHtml(props) {
  const items = props.items ?? [];
  const gap   = props.gap ?? 12;
  const rows  = items.map(item => {
    const p = typeof item === 'string' ? { text: item } : item;
    return `<div style="margin-bottom:${gap}px">${rowHtml({ ...p, light: props.light, size: props.size, dot_color: props.dot_color })}</div>`;
  }).join('');
  return `<div class="nwg-bullet-list">${rows}</div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const items   = props.items ?? [];
  const n       = items.length || 1;
  const gapIn   = (props.gap ?? 12) / 96;
  const rowH    = (box.h - gapIn * (n - 1)) / n;
  items.forEach((item, i) => {
    const p = typeof item === 'string' ? { text: item } : item;
    rowPptx(slide, { ...p, light: props.light, size: props.size, dot_token: props.dot_token },
      { x: box.x, y: box.y + i * (rowH + gapIn), w: box.w, h: rowH }, ctx);
  });
}
