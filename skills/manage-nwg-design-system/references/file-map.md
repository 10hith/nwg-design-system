# File Map

Where to find things across the three design-system HTML files. Line numbers are approximate — they drift as edits land. Use them as a starting point, then `grep` for the landmark string to get to the exact line.

## nwg-design-system.html

| What | Where | Landmark to grep |
|---|---|---|
| JSON tokens block | ~line 10-115 | `id="nwg-tokens"` |
| CSS `:root` variables | ~line 119-132 | `:root{` |
| Colour swatches section | ~line 250-320 | `<section id="colour"` |
| Typography specimens | ~line 330-400 | `<section id="type"` |
| Components showcase (pills, stats, etc.) | ~line 410-620 | `<section id="components"` |
| Iconography rules | ~line 630-680 | `<section id="icons"` |
| Chart styles | ~line 690-740 | `<section id="chart"` |
| Voice & tone | ~line 750-790 | `<section id="voice"` |
| Do/don't callouts | ~line 800-850 | `<section id="dos-donts"` |

## nwg-layouts.html

| What | Where | Landmark to grep |
|---|---|---|
| Global page CSS (slide sizing, slot header) | ~line 10-110 | `.slot{` |
| Archetype-specific CSS blocks | co-located with each slot | `/* --- NN STYLE --- */` |
| Gallery container opens | ~line 208 | `<div class="gallery">` |
| Gallery container closes (insertion point for new archetype) | ~line 570 | `</div>\n</body>` — the last gallery `</div>` |
| Archetype 01 Cover | ~line 210-230 | `<!-- 01 COVER -->` |
| Archetype 12 Disclaimer | ~line 550-570 | `<!-- 12 DISCLAIMER -->` |

New archetype slots always go **before** the gallery's closing `</div>`, in numerical order.

## nwg-data-to-layout.html

| What | Where | Landmark to grep |
|---|---|---|
| Hero banner | top | `<h1` |
| Section 1 · Decision tree (3 ordered questions) | ~line 80-170 | `1 · Decision tree` |
| Section 2 · Data-shape cards (A-H + X) | ~line 180-260 | `2 · Data shapes` |
| Section 3 · Quick lookup table | ~line 270-300 | `3 · Quick lookup` |
| Section 4 · JSON classification | ~line 305-350 | `id="nwg-classification"` |
| `archetypes` object | inside JSON | `"archetypes": {` |
| `decision` array | inside JSON | `"decision": [` |
| `constraints` object | inside JSON | `"constraints": {` |

## Cross-file invariants

These must hold after every edit — the validator checks each one:

1. Every archetype id in `nwg-layouts.html` (`<span class="num">13</span>` + name) has a matching key in `nwg-data-to-layout.html → archetypes` (e.g., `"13_timeline"`).
2. Every `use:` target in the `decision` array exists as a key in `archetypes`.
3. Every key in `constraints.max_items_per_layout` exists in `archetypes`.
4. Every token string referenced in `constraints` (e.g., `"color.brand.purple.700"`) resolves to an existing path in `#nwg-tokens`.
5. Every CSS custom property used in `nwg-layouts.html` (e.g., `var(--p700)`) has a declaration in `nwg-design-system.html`'s `:root` block. (This one is advisory — the layouts file is standalone, so in practice mirror the variables it needs into its own `:root` block when introducing new ones.)

## Version fields

Two independent versions to keep honest:

- `#nwg-tokens → meta.version` — bumps on token / component changes
- `#nwg-classification → version` — bumps on archetype / decision / constraint changes

Semver rules:

- **Patch** (`1.0.0 → 1.0.1`): typo, note wording, re-ordering without semantic change.
- **Minor** (`1.0.0 → 1.1.0`): new token, new archetype, new decision rule, new component.
- **Major** (`1.0.0 → 2.0.0`): renamed or removed existing key (try hard to avoid this — prefer deprecation).
