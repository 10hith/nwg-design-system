export const type = 'icon-pill';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const tone = props.tone ?? 'purple';
  const bg = tone === 'gold' ? 'rgba(253,171,31,.18)' :
    tone === 'neutral' ? 'var(--n100)' : 'var(--p050)';
  const bc = tone === 'gold' ? 'rgba(253,171,31,.4)' :
    tone === 'neutral' ? 'var(--n300)' : 'var(--p200)';
  const tc = tone === 'gold' ? '#B47A10' :
    tone === 'neutral' ? 'var(--n700)' : 'var(--p700)';
  return `<div class="nwg-icon-pill" style="display:inline-flex;align-items:center;gap:8px;background:${bg};border:1px solid ${bc};border-radius:${props.round ? '999px' : '8px'};padding:6px 14px">
    ${props.icon ? `<span style="font-size:${props.icon_size ?? 16}px">${props.icon}</span>` : ''}
    <span style="font-size:${props.size ?? 13}px;font-weight:800;color:${tc}">${esc(props.text ?? '')}</span>
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  const tone = props.tone ?? 'purple';
  const fill = tone === 'gold' ? 'FEF3D0' : tone === 'neutral' ? t.n100 : t.p050;
  const line = tone === 'gold' ? t.gold : tone === 'neutral' ? t.n300 : t.p200;
  const tc = tone === 'gold' ? t.gold : t.p700;

  slide.addShape(ctx.pptx.ShapeType.roundRect, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: props.round ? box.h / 2 : 0.07,
    fill: { color: fill }, line: { color: line, width: 0.7 },
  });
  const label = `${props.icon ? props.icon + ' ' : ''}${String(props.text ?? '')}`;
  slide.addText(label, {
    x: box.x + 0.1, y: box.y, w: box.w - 0.2, h: box.h,
    fontFace: 'Arial', fontSize: props.size ? Math.round(props.size * 0.72) : 9.5,
    bold: true, color: tc, align: 'center', fit: 'shrink', margin: 0,
  });
}
