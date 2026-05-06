export const type = 'quote-block';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  return `<div class="nwg-quote-block" style="border-left:4px solid var(--gold);padding:14px 20px;background:var(--p050);border-radius:0 10px 10px 0;height:100%;box-sizing:border-box">
    <p style="font-family:var(--display);font-size:${props.size ?? 18}px;font-style:italic;color:var(--p800);margin:0 0 10px;line-height:1.5">&ldquo;${esc(props.quote ?? '')}&rdquo;</p>
    ${props.attribution ? `<p style="font-size:12px;font-weight:800;color:var(--p700);margin:0;text-transform:uppercase;letter-spacing:.08em">— ${esc(props.attribution)}</p>` : ''}
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: box.x, y: box.y, w: 0.04, h: box.h,
    fill: { color: t.gold }, line: { color: t.gold },
  });
  slide.addShape(ctx.pptx.ShapeType.roundRect, {
    x: box.x + 0.04, y: box.y, w: box.w - 0.04, h: box.h,
    rectRadius: 0.06, fill: { color: t.p050 }, line: { color: t.p100, width: 0.5 },
  });
  const quoteH = props.attribution ? box.h * 0.75 : box.h - 0.2;
  slide.addText(`\u201C${String(props.quote ?? '')}\u201D`, {
    x: box.x + 0.22, y: box.y + 0.14, w: box.w - 0.36, h: quoteH,
    fontFace: 'Arial', fontSize: props.size ? Math.round(props.size * 0.6) : 11,
    italic: true, color: t.p800, fit: 'shrink', margin: 0,
  });
  if (props.attribution) {
    slide.addText(`\u2014 ${String(props.attribution).toUpperCase()}`, {
      x: box.x + 0.22, y: box.y + quoteH + 0.1, w: box.w - 0.36, h: box.h - quoteH - 0.18,
      fontFace: 'Arial', fontSize: 7.5, bold: true, color: t.p700, charSpacing: 1, margin: 0,
    });
  }
}
