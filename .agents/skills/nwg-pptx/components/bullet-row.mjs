export const type = 'bullet-row';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const dotColor  = props.dot_color ?? 'var(--gold)';
  const textColor = props.light ? '#fff' : 'var(--n900)';
  const bold      = props.bold ? 'font-weight:700;' : '';
  const sub       = props.sublabel;
  return `<div class="nwg-bullet-row" style="display:flex;align-items:${sub ? 'flex-start' : 'center'};gap:12px">
    <span style="width:10px;height:10px;border-radius:50%;background:${dotColor};flex-shrink:0;margin-top:${sub ? '4px' : '0'}"></span>
    <div>
      <p style="margin:0;font-size:${props.size ?? 14}px;${bold}color:${textColor};line-height:1.4">${esc(props.text ?? '')}</p>
      ${sub ? `<p style="margin:2px 0 0;font-size:${(props.size ?? 14) - 2}px;color:var(--n700)">${esc(sub)}</p>` : ''}
    </div>
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t         = ctx.tokens;
  const dotColor  = props.dot_token ? t[props.dot_token] : t.gold;
  const textColor = props.light ? t.white : t.ink;
  const dotSize   = 0.11;
  const dotY      = box.y + box.h / 2 - dotSize / 2;
  slide.addShape(ctx.pptx.ShapeType.ellipse, {
    x: box.x, y: dotY, w: dotSize, h: dotSize,
    fill: { color: dotColor }, line: { color: dotColor },
  });
  slide.addText(String(props.text ?? ''), {
    x: box.x + dotSize + 0.1, y: box.y, w: box.w - dotSize - 0.1, h: box.h,
    fontFace: 'Arial', fontSize: props.size ? Math.round(props.size * 0.72) : 10.5,
    bold: props.bold ?? false, color: textColor, fit: 'shrink', margin: 0,
  });
}
