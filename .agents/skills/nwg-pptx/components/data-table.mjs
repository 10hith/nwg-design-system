export const type = 'data-table';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const headers = props.headers ?? [];
  const rows    = props.rows    ?? [];
  const thCells = headers.map(h => `<th style="background:var(--p700);color:#fff;padding:10px 14px;font-size:13px;font-weight:800;text-align:left">${esc(h)}</th>`).join('');
  const trRows  = rows.map((row, ri) => {
    const bg = ri % 2 === 0 ? 'var(--p050)' : '#fff';
    const cells = row.map(c => `<td style="padding:9px 14px;font-size:13px;border-bottom:1px solid var(--p100)">${esc(c)}</td>`).join('');
    return `<tr style="background:${bg}">${cells}</tr>`;
  }).join('');
  return `<div class="nwg-data-table" style="width:100%;overflow:hidden;border-radius:10px;border:1px solid var(--p200)">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>${thCells}</tr></thead>
      <tbody>${trRows}</tbody>
    </table>
  </div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t       = ctx.tokens;
  const headers = props.headers ?? [];
  const rows    = props.rows    ?? [];
  if (!headers.length && !rows.length) return;

  const allRows = [
    headers.map(h => ({
      text: String(h), options: {
        bold: true, color: t.white, fill: t.p700, fontSize: 10, fontFace: 'Arial',
        valign: 'middle', align: 'left', margin: [4, 8, 4, 8],
      },
    })),
    ...rows.map((row, ri) => row.map(cell => ({
      text: String(cell ?? ''), options: {
        color: t.ink, fill: ri % 2 === 0 ? t.p050 : t.white,
        fontSize: 9.5, fontFace: 'Arial', valign: 'middle', align: 'left',
        margin: [3, 8, 3, 8], border: { type: 'solid', color: t.p100, pt: 0.5 },
      },
    }))),
  ];

  const rowH   = Math.round(box.h / (allRows.length) * 100) / 100;
  slide.addTable(allRows, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rowH, border: { type: 'solid', color: t.p200, pt: 0.7 },
    autoPage: false,
  });
}
