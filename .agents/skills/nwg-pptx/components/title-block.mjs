export const type = 'title-block';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const titleColor = props.light ? '#fff' : 'var(--p800)';
  const subColor   = props.light ? 'rgba(255,255,255,.85)' : 'var(--n700)';
  const size       = props.size ?? 44;
  return `<div class="nwg-title-block">
    <h1 style="font-family:var(--display);font-size:${size}px;font-weight:800;color:${titleColor};margin:0 0 10px;line-height:1.1">${esc(props.title ?? '')}</h1>
    ${props.subtitle ? `<p style="font-size:${Math.round(size * 0.38)}px;color:${subColor};margin:0;line-height:1.4">${esc(props.subtitle)}</p>` : ''}
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  const light = props.light ?? false;
  const titleColor = light ? t.white : t.p800;
  const subColor   = light ? t.p200  : t.muted;
  const titleSize  = props.size ?? 28;
  const subSize    = Math.round(titleSize * 0.38);
  const titleH     = box.h * (props.subtitle ? 0.6 : 1.0);
  slide.addText(String(props.title ?? ''), {
    x: box.x, y: box.y, w: box.w, h: titleH,
    fontFace: 'Arial', fontSize: titleSize, bold: true, color: titleColor,
    breakLine: false, fit: 'shrink', margin: 0.02,
  });
  if (props.subtitle) {
    slide.addText(String(props.subtitle), {
      x: box.x, y: box.y + titleH, w: box.w, h: box.h - titleH,
      fontFace: 'Arial', fontSize: subSize, color: subColor, fit: 'shrink', margin: 0.02,
    });
  }
}
