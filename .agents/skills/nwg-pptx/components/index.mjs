import * as arcAccent   from './arc-accent.mjs';
import * as bulletList  from './bullet-list.mjs';
import * as bulletRow   from './bullet-row.mjs';
import * as calloutCard from './callout-card.mjs';
import * as dataTable   from './data-table.mjs';
import * as dividerBar  from './divider-bar.mjs';
import * as heroBand    from './hero-band.mjs';
import * as iconPill    from './icon-pill.mjs';
import * as imageFrame  from './image-frame.mjs';
import * as inlineChart from './inline-chart.mjs';
import * as kickerLabel from './kicker-label.mjs';
import * as metricDelta from './metric-delta.mjs';
import * as quoteBlock  from './quote-block.mjs';
import * as sectionNumber from './section-number.mjs';
import * as statRow     from './stat-row.mjs';
import * as statTile    from './stat-tile.mjs';
import * as titleBlock  from './title-block.mjs';

const all = [
  arcAccent, bulletList, bulletRow, calloutCard, dataTable, dividerBar,
  heroBand, iconPill, imageFrame, inlineChart, kickerLabel, metricDelta,
  quoteBlock, sectionNumber, statRow, statTile, titleBlock,
];

/** Map of type-string → component module */
export const registry = Object.fromEntries(all.map(m => [m.type, m]));

/** Get component module by type, throws if not found */
export function getComponent(type) {
  const m = registry[type];
  if (!m) throw new Error(`Unknown component type: "${type}". Available: ${Object.keys(registry).join(', ')}`);
  return m;
}
