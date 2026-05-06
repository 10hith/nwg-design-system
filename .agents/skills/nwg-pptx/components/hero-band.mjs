export const type = 'hero-band';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const bg = props.gradient
    ? 'linear-gradient(135deg,rgba(61,15,102,.85),rgba(94,27,156,.55)),linear-gradient(45deg,var(--p800),var(--p500))'
    : 'var(--p700)';
  return `<div class="nwg-hero-band" style="background:${bg};padding:${props.padding ?? '32px 44px'};display:flex;flex-direction:column;justify-content:center;width:100%;height:100%;box-sizing:border-box">
    ${props.eyebrow ? `<p style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:0 0 10px">${esc(props.eyebrow)}</p>` : ''}
    <h1 style="font-family:var(--display);font-size:${props.title_size ?? 52}px;font-weight:800;color:#fff;margin:0 0 12px;line-height:1.08">${esc(props.title ?? '')}</h1>
    ${props.subtitle ? `<p style="font-size:${props.sub_size ?? 22}px;font-weight:700;color:rgba(255,255,255,.88);margin:0">${esc(props.subtitle)}</p>` : ''}
    ${props.date     ? `<p style="font-size:16px;color:rgba(255,255,255,.7);margin:18px 0 0">${esc(props.date)}</p>` : ''}
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fill: { color: t.p800 },
    line: { color: 'none' },
  });
  if (props.eyebrow) {
    slide.addText(String(props.eyebrow).toUpperCase(), {
      x: box.x + 0.35, y: box.y + 0.28, w: box.w - 0.7, h: 0.22,
      fontFace: 'Arial', fontSize: 8, bold: true, color: t.gold, charSpacing: 1.8, margin: 0,
    });
  }
  const titleY = box.y + (props.eyebrow ? 0.52 : 0.3);
  const titleSize = props.title_size ? Math.round(props.title_size * 0.45) : 32;
  slide.addText(String(props.title ?? ''), {
    x: box.x + 0.35, y: titleY, w: box.w - 0.7, h: box.h * 0.5,
    fontFace: 'Arial', fontSize: titleSize, bold: true, color: t.white, fit: 'shrink', margin: 0.02,
  });
  if (props.subtitle) {
    slide.addText(String(props.subtitle), {
      x: box.x + 0.35, y: titleY + box.h * 0.5, w: box.w - 0.7, h: box.h * 0.22,
      fontFace: 'Arial', fontSize: Math.round(titleSize * 0.6), bold: true,
      color: t.p200, fit: 'shrink', margin: 0,
    });
  }
  if (props.date) {
    slide.addText(String(props.date), {
      x: box.x + 0.35, y: box.y + box.h - 0.36, w: box.w - 0.7, h: 0.25,
      fontFace: 'Arial', fontSize: 10, color: t.p300, margin: 0,
    });
  }
}
