export const type = 'kicker-label';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const text = String(props.text ?? '').toUpperCase();
  const color = props.color ?? 'var(--p700)';
  return `<div class="nwg-kicker-label" style="display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${color}"><span style="display:block;width:3px;height:16px;background:var(--gold);border-radius:2px;flex-shrink:0"></span>${esc(text)}</div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  const color = props.color_token ? t[props.color_token] : t.p700;
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: box.x, y: box.y + 0.03, w: 0.03, h: 0.17,
    fill: { color: t.gold }, line: { color: t.gold },
  });
  slide.addText(String(props.text ?? '').toUpperCase(), {
    x: box.x + 0.09, y: box.y, w: box.w - 0.09, h: box.h || 0.22,
    fontFace: 'Arial', fontSize: 8.5, bold: true, color, charSpacing: 1.8, margin: 0,
  });
}
