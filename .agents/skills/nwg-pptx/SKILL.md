---
name: nwg-pptx
description: "Use this skill whenever the user wants to create a NatWest Group (NWG) styled presentation, deck, slides, investor update, board pack, or quarterly results. Generates a multi-slide HTML deck from raw data using NWG design tokens and layouts, opens an interactive review playground for per-element feedback, applies feedback from feedback.json, and exports an editable .pptx via pptxgenjs. Trigger on: deck, slides, presentation, NWG, NatWest, investor, board pack, quarterly results — even if the user doesn't say 'skill' or 'nwg-pptx' explicitly."
license: "Proprietary — NatWest Group internal use"
---
# nwg-pptx

Use this skill to create NatWest Group styled presentation decks from raw input, review them in a local HTML playground, apply feedback from `feedback.json`, and export editable `.pptx` files.

## Key references (read before generating)

- **`.agents/skills/nwg-pptx/components/index.mjs`** — registry of all 17 NWG components (READ THIS FIRST)
- `.agents/skills/nwg-pptx/references/design-system/nwg-components.html` — visual gallery of every component
- `.agents/skills/nwg-pptx/references/design-system/nwg-layouts.html` — 12 preset layout reference gallery
- `.agents/skills/nwg-pptx/templates/presets/` — JSON presets (s-cover, s-section, … s-close) as starting points
- `.agents/skills/nwg-pptx/lib/tokens.mjs` — hex color tokens and slide-dimension constants

## Slide authoring

Every slide is a **free composition of positioned components**. There are no modes, no templates, no `html_body`. The same `components[]` array drives both the HTML preview and the editable PPTX.

### Generate deck

When the user asks to make a deck, present, or slides:

1. **Read the component gallery** in `references/design-system/nwg-components.html`.
2. **Browse available presets** in `templates/presets/*.json` — apply one as a starting point if it fits, or compose freely.
3. **Author each slide** as a `components` array. Positions use **inches** (`x, y, w, h`). Canvas is 13.333 × 7.5 in.
4. Create `decks/<slug>/deck.json` and `decks/<slug>/slides/slide-NN.json`.
5. Build and start the server:

```bash
node .agents/skills/nwg-pptx/scripts/build_deck.mjs decks/<slug>
python3 .agents/skills/nwg-pptx/scripts/serve.py decks/<slug> &
```

6. **Output the review URL as a clickable link:**

```
Deck built ✓ — open the review playground: [http://localhost:4567/review-playground.html](http://localhost:4567/review-playground.html)
```

**deck.json shape:**
```json
{
  "deck_id": "<slug>",
  "title": "...",
  "subtitle": "...",
  "theme": { "palette": "nwg-purple-default" },
  "brand": { "deck_footer": "NatWest Group · Confidential" },
  "slides": ["slide-01", "slide-02"]
}
```

**Slide JSON shape:**
```json
{
  "id": "slide-NN",
  "title": "Slide title (used in HTML <title>)",
  "theme": { "palette": "nwg-purple-default" },
  "components": [
    {
      "type": "kicker-label",
      "box": { "x": 0.46, "y": 0.32, "w": 5.0, "h": 0.22 },
      "props": { "text": "Section Kicker" }
    },
    {
      "type": "title-block",
      "box": { "x": 0.46, "y": 0.58, "w": 9.0, "h": 0.75 },
      "props": { "title": "Slide Title", "size": 28 }
    }
  ]
}
```

### Available components

| type | key props |
|---|---|
| `arc-accent` | `r1`, `r2`, `color1`, `color2` |
| `bullet-list` | `items[]`, `light`, `size`, `gap` |
| `bullet-row` | `text`, `sublabel`, `bold`, `light`, `size` |
| `callout-card` | `title`, `body`, `tone` (purple/gold/neutral) |
| `data-table` | `headers[]`, `rows[][]` |
| `divider-bar` | `thickness`, `label`, `light`, `color_token` |
| `hero-band` | `title`, `subtitle`, `eyebrow`, `date`, `gradient`, `title_size` |
| `icon-pill` | `text`, `icon`, `tone`, `round`, `size` |
| `image-frame` | `src`, `path`, `label`, `radius` |
| `inline-chart` | `type` (bar/line/pie/donut), `x_axis[]`, `series[{name,values}]` |
| `kicker-label` | `text`, `color` |
| `metric-delta` | `value`, `delta`, `label`, `direction` (up/down) |
| `quote-block` | `quote`, `attribution`, `size` |
| `section-number` | `number`, `label`, `light`, `num_size` |
| `stat-row` | `items[{value,label,sublabel}]`, `gap` |
| `stat-tile` | `value`, `label`, `sublabel`, `value_size` |
| `title-block` | `title`, `subtitle`, `size`, `light` |

### Layout quick-reference

**Canvas**: 13.333 × 7.5 in | 1280 × 720 px | 1 in = 96 px (convert: `px / 96 = in`)

**Standard safe-zone margins**: `x: 0.9 in`, `y: 0.6 in`

**Common layout recipes (copy-paste coordinates):**

| Pattern | Key boxes |
|---|---|
| Full-bleed background | `{x:0, y:0, w:13.333, h:7.5}` |
| Left panel + right content | Left panel `{x:0, y:0, w:3.8, h:7.5}` · Right content starts at `x:4.3` |
| 2-column equal split | Col1 `{x:0.9, w:5.5}` · Col2 `{x:6.8, w:5.6}` |
| 3-column card grid | Cards `w:3.6` at `x: 0.9 / 4.87 / 8.84` (0.9 in margins, 0.37 in gaps) |
| Standard vertical rhythm | Kicker `y:0.6 h:0.3` → Title `y:1.0 h:0.9–1.2` → Divider `y:2.2 h:0.25` → Content `y:2.6–6.8` |

**Component-specific behaviour (read source before assuming):**

- **`hero-band`** renders `width:100%; height:100%` of its box — use it as a full background panel. Set `gradient:true` for dark purple gradient. Place it **first** in the array so it renders below other components.
- **`arc-accent`** SVG circles are centered in their box. To get the classic NWG corner arc, place the box center off-slide: e.g. top-right corner → `{x:10.0, y:-2.0, w:6.0, h:6.0}`. The slide's `overflow:hidden` clips it cleanly.
- **`bullet-list` / `bullet-row`** `size` and `gap` props are in **px**, not inches. A `size:16 gap:14` list of 4 items fits in ~3.5 in of height.
- **`section-number`** with `light:true` renders the number in gold and label in white — use inside dark panels.
- **`kicker-label`** `color` prop accepts raw CSS values (e.g. `rgba(255,255,255,.6)`) for white-on-dark variants.
- **`callout-card`** `tone` options: `"purple"` (default), `"gold"`, `"neutral"`.
- **Component z-order**: components render in array order — later items sit on top. Always list background panels first.

**Font size → box height guide (HTML px):**

| Font size | Approx box height for 1 line | Notes |
|---|---|---|
| `size:11` (kicker) | `h:0.25` | kicker-label fixed height |
| `size:28` (title-block small) | `h:0.6` | 1 line |
| `size:38–42` (title-block large) | `h:1.0–1.2` | 1–2 lines |
| `size:14–16` (bullet-list) | `h:0.4` per item + gap | add `gap*(n-1)/96` for total |
| `size:18` (quote-block) | `h:1.2–1.7` | includes attribution |

### Apply a preset as starting point (optional)

```bash
node .agents/skills/nwg-pptx/scripts/apply_preset.mjs s-cover decks/<slug>/slides/slide-01.json
```

Then fill in the actual props values. Presets are skeletons — always customise them.

### Apply feedback

When the user asks to "apply feedback" or "process the queue":

1. Read `decks/<slug>/feedback.json`.
2. Run `node .agents/skills/nwg-pptx/scripts/apply_feedback.mjs decks/<slug>`.
3. For remaining `comment` or `slide_add` items, update the relevant `slide-NN.json` component props directly, then rebuild.
4. Rebuild: `node .agents/skills/nwg-pptx/scripts/rebuild_dirty.mjs decks/<slug>`.
5. Confirm `decks/<slug>/apply-report.md`.

**feedback.json item types:**

| type | key fields | effect |
|---|---|---|
| `comment` | `element_id`, `comment` | LLM interprets and edits component props |
| `component_prop_patch` | `element_id`, `props` | Auto-patches props on the named component instance |
| `component_box_patch` | `element_id`, `box` | Auto-repositions/resizes the named component instance |
| `theme_change` | `palette` | Updates `deck.json` theme |
| `slide_reorder` | `new_order` | Rewrites `deck.json` slides[] |
| `slide_delete` | `slide_id` | Removes slide from manifest + files |
| `slide_add` | `after_slide_id`, `prompt` | LLM creates new slide JSON with components[] |
| `viz_override` | `slide_id`, `new_viz` | Changes inline-chart type on slide |

Element IDs use the format **`slide-NN--component-type-N`** (e.g. `slide-03--stat-tile-2`).

### Export deck

```bash
node .agents/skills/nwg-pptx/scripts/export_deck_pptx.mjs decks/<slug>
```

Writes `decks/<slug>/deck.pptx`. All text and shapes are **fully editable** in PowerPoint. No Puppeteer required.

```bash
npm install -g pptxgenjs   # one-time install
```

### Validate components and presets

```bash
node .agents/skills/nwg-pptx/scripts/validate_components.mjs
```

## File ownership

| Owned by | Files |
|---|---|
| Claude | `deck.json`, `slides/slide-NN.json` |
| Build artifacts (do not edit) | `slides/slide-NN.html`, `assets/deck_index.html` |
| User / playground | `feedback.json` |
| Export artifact | `deck.pptx`, `pptx-export-manifest.json` |

## Incremental rebuild

```bash
node .agents/skills/nwg-pptx/scripts/rebuild_dirty.mjs decks/<slug>
```

Rebuilds only slides whose `.json` is newer than their `.html`.
