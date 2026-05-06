import { getComponent } from '../components/index.mjs';
import { getTokens } from './tokens.mjs';

export function renderSlidePptx(pptx, pptxSlide, slideJson) {
  const palette   = slideJson.theme?.palette ?? 'nwg-purple-default';
  const tokens    = getTokens(palette);
  const ctx       = { pptx, tokens };
  const components = slideJson.components ?? [];

  for (const comp of components) {
    const { type, box = {}, props = {} } = comp;
    try {
      const mod = getComponent(type);
      mod.renderPptx(pptxSlide, props, box, ctx);
    } catch (e) {
      pptxSlide.addText(`⚠ ${String(e.message)}`, {
        x: box.x ?? 0, y: box.y ?? 0, w: box.w ?? 4, h: box.h ?? 0.4,
        fontFace: 'Arial', fontSize: 9, color: 'E43E6E', margin: 0,
      });
    }
  }

}
