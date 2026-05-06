export const type = 'callout-card';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const tone = props.tone ?? 'purple';
  const bg = tone === 'gold' ? 'rgba(253,171,31,.12)' :
    tone === 'neutral' ? 'var(--n100)' : 'var(--p050)';
  const bc = tone === 'gold' ? 'rgba(253,171,31,.35)' :
    tone === 'neutral' ? 'var(--n300)' : 'var(--p100)';
  const hc = 'var(--p800)';
  return `<div class="nwg-callout-card" style="background:${bg};border:1px solid ${bc};border-radius:12px;padding:16px 18px;height:100%;box-sizing:border-box">
    <h4 style="font-family:var(--display);margin:0 0 6px;font-size:18px;color:${hc}">${esc(props.title ?? '')}</h4>
    <p style="margin:0;font-size:14px;color:var(--n700);line-height:1.5">${esc(props.body ?? '')}</p>
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t = ctx.tokens;
  const tone = props.tone ?? 'purple';
  const fill = tone === 'gold' ? 'FEF3D0' : tone === 'neutral' ? t.n100 : t.p050;
  const line = tone === 'gold' ? t.gold : tone === 'neutral' ? t.n300 : t.p100;
  slide.addShape(ctx.pptx.ShapeType.roundRect, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: 0.08, fill: { color: fill }, line: { color: line, width: 0.7 },
  });
  const titleH = Math.min(0.45, box.h * 0.38);
  slide.addText(String(props.title ?? ''), {
    x: box.x + 0.18, y: box.y + 0.14, w: box.w - 0.36, h: titleH,
    fontFace: 'Arial', fontSize: 13, bold: true, color: t.p800, fit: 'shrink', margin: 0,
  });
  if (props.body) {
    slide.addText(String(props.body), {
      x: box.x + 0.18, y: box.y + 0.14 + titleH + 0.05, w: box.w - 0.36, h: box.h - titleH - 0.38,
      fontFace: 'Arial', fontSize: 10.5, color: t.muted, fit: 'shrink', margin: 0,
    });
  }
}
