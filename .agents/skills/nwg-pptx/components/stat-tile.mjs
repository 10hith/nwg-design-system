export const type = 'stat-tile';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  return `<div class="nwg-stat-tile" style="background:var(--p050);border:1px solid var(--p200);border-radius:14px;padding:18px 20px;height:100%;box-sizing:border-box">
    <p style="font-family:var(--display);font-size:${props.value_size ?? 42}px;font-weight:800;color:var(--p700);margin:0 0 6px;line-height:1">${esc(props.value ?? '')}</p>
    <p style="font-size:${props.label_size ?? 15}px;color:var(--n700);margin:0">${esc(props.label ?? '')}</p>
    ${props.sublabel ? `<p style="font-size:12px;color:var(--n500);margin:4px 0 0">${esc(props.sublabel)}</p>` : ''}
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  slide.addShape(ctx.pptx.ShapeType.roundRect, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: 0.09, fill: { color: t.p050 }, line: { color: t.p200, width: 0.7 },
  });
  const valSize  = props.value_size ? Math.round(props.value_size * 0.55) : 24;
  const valH     = box.h * 0.55;
  slide.addText(String(props.value ?? ''), {
    x: box.x + 0.14, y: box.y + 0.12, w: box.w - 0.28, h: valH,
    fontFace: 'Arial', fontSize: valSize, bold: true, color: t.p700, fit: 'shrink', margin: 0,
  });
  slide.addText(String(props.label ?? ''), {
    x: box.x + 0.14, y: box.y + 0.12 + valH, w: box.w - 0.28, h: box.h - valH - 0.18,
    fontFace: 'Arial', fontSize: 10, color: t.muted, fit: 'shrink', margin: 0,
  });
}
