import { getComponent } from '../components/index.mjs';
import { inToPx } from './tokens.mjs';

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/**
 * Render a slide's component list to an HTML string.
 * The slide is a 1280×720 px absolute-positioned canvas.
 *
 * @param {object} slide  - parsed slide JSON (must have `components: []`)
 * @param {string} slideId
 * @param {number} [page]
 * @returns {string}  full HTML body (goes inside slide-shell {{content}})
 */
export function renderSlideHtml(slide, slideId, page) {
  const components = slide.components ?? [];
  const counters = {};

  const items = components.map((comp, _ci) => {
    const { type, box = {}, props = {} } = comp;
    let fragment;
    try {
      const mod = getComponent(type);
      fragment = mod.renderHtml(props);
    } catch (e) {
      fragment = `<div style="color:red;font-size:12px;padding:4px">${esc(String(e.message))}</div>`;
    }

    counters[type] = (counters[type] || 0) + 1;
    const idx = counters[type];
    const elemId = `${slideId}--${type}-${idx}`;

    const x = inToPx(box.x ?? 0);
    const y = inToPx(box.y ?? 0);
    const w = box.w ? inToPx(box.w) : undefined;
    const h = box.h ? inToPx(box.h) : undefined;

    const styleW = w !== undefined ? `width:${w}px;` : '';
    const styleH = h !== undefined ? `height:${h}px;` : '';

    return `<div id="${esc(elemId)}" data-feedback="true" data-component="${esc(type)}" style="position:absolute;left:${x}px;top:${y}px;${styleW}${styleH}">${fragment}</div>`;
  });

  const pageNum = page ?? (String(slideId).replace(/^slide-0*/, '') || '1');

  return `<div class="slide" style="width:1280px;height:720px;position:relative;overflow:hidden;background:#fff;font-family:var(--body)">
${items.join('\n')}
<span class="pgnum" style="position:absolute;right:24px;bottom:18px;font-size:13px;color:var(--n500)">${esc(String(pageNum))}</span>
</div>`;
}
