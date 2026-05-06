export const type = 'arc-accent';

export function renderHtml(props) {
  const r1 = props.r1 ?? 180;
  const r2 = props.r2 ?? 110;
  const color1 = props.color1 ?? 'rgba(253,171,31,.15)';
  const color2 = props.color2 ?? 'rgba(123,44,191,.12)';
  const w = (r1 + 20) * 2;
  const h = (r1 + 20) * 2;
  return `<div class="nwg-arc-accent" style="pointer-events:none;overflow:hidden;width:100%;height:100%">
    <svg viewBox="0 0 ${w} ${h}" fill="none" width="${w}" height="${h}" style="position:absolute;inset:0;width:100%;height:100%">
      <circle cx="${w / 2}" cy="${h / 2}" r="${r1}" stroke="${color1}" stroke-width="2"/>
      <circle cx="${w / 2}" cy="${h / 2}" r="${r2}" stroke="${color2}" stroke-width="1.5"/>
    </svg>
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  const size = Math.min(box.w, box.h);
  slide.addShape(ctx.pptx.ShapeType.ellipse, {
    x: box.x, y: box.y, w: size, h: size,
    fill: { color: 'FFFFFF', transparency: 100 },
    line: { color: 'FEE9B0', width: 1.5 },
  });
  const inner = size * 0.65;
  const off = (size - inner) / 2;
  slide.addShape(ctx.pptx.ShapeType.ellipse, {
    x: box.x + off, y: box.y + off, w: inner, h: inner,
    fill: { color: 'FFFFFF', transparency: 100 },
    line: { color: 'D9BDF0', width: 1 },
  });
}
