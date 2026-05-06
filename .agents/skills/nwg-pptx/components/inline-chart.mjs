export const type = 'inline-chart';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderHtml(props) {
  const values = props.series?.[0]?.values ?? [40, 60, 80, 95];
  const labels = props.x_axis ?? values.map((_, i) => `S${i + 1}`);
  const max    = Math.max(...values, 1);
  const bars   = values.map((v, i) => {
    const h = Math.max(8, Math.round(v / max * 88));
    const hi = i >= values.length - 2;
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
      <span style="font-size:11px;font-weight:800;color:var(--p800)">${esc(v)}</span>
      <div style="width:100%;height:${h}%;background:${hi ? 'var(--p700)' : 'var(--p300)'};border-radius:4px 4px 0 0"></div>
      <span style="font-size:11px;color:var(--n700)">${esc(labels[i] ?? '')}</span>
    </div>`;
  }).join('');
  return `<div class="nwg-inline-chart" style="display:flex;align-items:flex-end;gap:6px;width:100%;height:100%;padding:0 4px;box-sizing:border-box">${bars}</div>`;
}

export function renderPptx(slide, props, box, ctx) {
  const t      = ctx.tokens;
  const type   = String(props.type ?? 'bar').toLowerCase();
  const values = props.series?.[0]?.values ?? [40, 60, 80, 95];
  const labels = props.x_axis ?? values.map((_, i) => `S${i + 1}`);

  const chartType = (type === 'line' || type === 'area') ? ctx.pptx.charts.LINE
    : (type === 'pie') ? ctx.pptx.charts.PIE
    : (type === 'donut' || type === 'doughnut') ? (ctx.pptx.charts.DOUGHNUT || ctx.pptx.charts.PIE)
    : ctx.pptx.charts.BAR;

  const series = (props.series ?? [{ name: 'Value', values }]).map((s, i) => ({
    name: String(s.name ?? `Series ${i + 1}`),
    labels: labels.map(String),
    values: (s.values ?? []).map(Number),
  }));

  const barColors = [t.p800, t.p600, t.p500, t.p400, t.p300, t.p200];
  slide.addChart(chartType, series, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    chartColors: barColors.slice(0, Math.max(series.length, values.length)),
    showLegend: (series.length > 1), legendPos: 'b',
    showTitle: false, showValue: (type === 'bar'),
    valAxisHidden: true, catAxisHidden: false,
    chartBorder: { pt: 0, color: 'FFFFFF' },
    plotAreaBorder: { pt: 0 },
    dataLabelFontSize: 9, dataLabelFontBold: true, dataLabelColor: t.white,
  });
}
