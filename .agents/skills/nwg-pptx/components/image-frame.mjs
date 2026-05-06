export const type = 'image-frame';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  if (props.src) {
    return `<div class="nwg-image-frame" style="width:100%;height:100%;border-radius:${props.radius ?? 12}px;overflow:hidden">
      <img src="${esc(props.src)}" alt="${esc(props.alt ?? '')}" style="width:100%;height:100%;object-fit:cover">
    </div>`;
  }
  const label = props.label ?? 'Image';
  return `<div class="nwg-image-frame" style="width:100%;height:100%;background:linear-gradient(135deg,var(--p100),var(--p300));border-radius:${props.radius ?? 12}px;display:grid;place-items:center">
    <span style="font-size:13px;font-weight:700;color:var(--p700);opacity:.6">${esc(label)}</span>
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  if (props.src && props.src.startsWith('data:')) {
    slide.addImage({ data: props.src, x: box.x, y: box.y, w: box.w, h: box.h, sizing: { type: 'cover' } });
    return;
  }
  if (props.path) {
    try {
      slide.addImage({ path: props.path, x: box.x, y: box.y, w: box.w, h: box.h, sizing: { type: 'cover' } });
      return;
    } catch {}
  }
  slide.addShape(ctx.pptx.ShapeType.roundRect, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: 0.1,
    fill: { type: 'gradient', stops: [{ position: 0, color: t.p100 }, { position: 100, color: t.p300 }] },
    line: { color: t.p200, width: 0.7 },
  });
  slide.addText(String(props.label ?? 'Image'), {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fontFace: 'Arial', fontSize: 10, color: t.p700, align: 'center', valign: 'middle', margin: 0,
  });
}
