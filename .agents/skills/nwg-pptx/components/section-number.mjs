export const type = 'section-number';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const light = props.light ?? false;
  const numColor  = light ? 'var(--gold)' : 'var(--p800)';
  const textColor = light ? '#fff' : 'var(--p700)';
  return `<div class="nwg-section-number" style="display:flex;flex-direction:column;gap:6px">
    <span style="font-family:var(--display);font-size:${props.num_size ?? 72}px;font-weight:800;color:${numColor};line-height:1">${esc(props.number ?? '')}</span>
    ${props.label ? `<span style="font-size:${props.label_size ?? 20}px;font-weight:700;color:${textColor};line-height:1.2">${esc(props.label)}</span>` : ''}
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  const light = props.light ?? false;
  const numSize = props.num_size ? Math.round(props.num_size * 0.5) : 36;
  const numH    = props.label ? box.h * 0.62 : box.h;
  slide.addText(String(props.number ?? ''), {
    x: box.x, y: box.y, w: box.w, h: numH,
    fontFace: 'Arial', fontSize: numSize, bold: true,
    color: light ? t.gold : t.p800, margin: 0,
  });
  if (props.label) {
    slide.addText(String(props.label), {
      x: box.x, y: box.y + numH, w: box.w, h: box.h - numH,
      fontFace: 'Arial', fontSize: 14, bold: true,
      color: light ? t.white : t.p700, fit: 'shrink', margin: 0,
    });
  }
}
