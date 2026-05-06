export const type = 'metric-delta';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const dir   = props.direction ?? 'up';
  const up    = dir === 'up';
  const color = up ? 'var(--ok)' : 'var(--danger)';
  const arrow = up ? '▲' : '▼';
  return `<div class="nwg-metric-delta" style="display:flex;align-items:baseline;gap:10px">
    <span style="font-family:var(--display);font-size:${props.value_size ?? 36}px;font-weight:800;color:var(--p800)">${esc(props.value ?? '')}</span>
    <span style="font-size:${props.delta_size ?? 15}px;font-weight:800;color:${color}">${arrow} ${esc(props.delta ?? '')}</span>
    ${props.label ? `<span style="font-size:13px;color:var(--n700)">${esc(props.label)}</span>` : ''}
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t   = ctx.tokens;
  const up  = (props.direction ?? 'up') === 'up';
  const deltaColor = up ? t.ok : t.danger;
  const arrow      = up ? '▲' : '▼';
  const valSize    = props.value_size ? Math.round(props.value_size * 0.5) : 20;

  slide.addText(String(props.value ?? ''), {
    x: box.x, y: box.y, w: box.w * 0.55, h: box.h,
    fontFace: 'Arial', fontSize: valSize, bold: true, color: t.p800, fit: 'shrink', margin: 0,
  });
  slide.addText(`${arrow} ${String(props.delta ?? '')}`, {
    x: box.x + box.w * 0.55, y: box.y, w: box.w * 0.25, h: box.h,
    fontFace: 'Arial', fontSize: Math.round(valSize * 0.6), bold: true,
    color: deltaColor, fit: 'shrink', margin: 0,
  });
  if (props.label) {
    slide.addText(String(props.label), {
      x: box.x + box.w * 0.8, y: box.y, w: box.w * 0.2, h: box.h,
      fontFace: 'Arial', fontSize: 8, color: t.muted, fit: 'shrink', margin: 0,
    });
  }
}
