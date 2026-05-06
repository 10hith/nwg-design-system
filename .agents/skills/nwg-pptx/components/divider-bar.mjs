export const type = 'divider-bar';

export function renderHtml(props) {
  const color  = props.color_token ? `var(--${props.color_token})` : (props.light ? 'rgba(255,255,255,.2)' : 'var(--p300)');
  const height = props.thickness ?? 1;
  const label  = props.label;
  if (label) {
    return `<div class="nwg-divider-bar" style="display:flex;align-items:center;gap:14px;color:${color}">
      <span style="flex:1;height:${height}px;background:${color};border-radius:${height}px"></span>
      <span style="font-size:12px;font-weight:800;white-space:nowrap">${label}</span>
      <span style="flex:1;height:${height}px;background:${color};border-radius:${height}px"></span>
    </div>`;
  }
  return `<div class="nwg-divider-bar" style="width:100%;height:${height}px;background:${color};border-radius:${height}px"></div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t     = ctx.tokens;
  const color = props.color_token ? t[props.color_token] : (props.light ? t.p300 : t.line);
  const lineH = box.h || 0;
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: box.x, y: box.y + lineH / 2, w: box.w, h: Math.max(0.01, (props.thickness ?? 1) / 96),
    fill: { color }, line: { color },
  });
  if (props.label) {
    slide.addText(String(props.label), {
      x: box.x + box.w / 2 - 0.7, y: box.y, w: 1.4, h: box.h || 0.22,
      fontFace: 'Arial', fontSize: 8, bold: true, color, align: 'center', margin: 0,
    });
  }
}
