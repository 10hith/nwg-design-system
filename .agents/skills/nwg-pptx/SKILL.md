---
name: nwg-pptx
description: "Use this skill whenever the user wants to create a NatWest Group (NWG) styled presentation, deck, slides, investor update, board pack, or quarterly results. Generates a multi-slide HTML deck from raw data using NWG design tokens and layouts, opens an interactive review playground for per-element feedback, applies feedback from feedback.json, and exports an editable .pptx via pptxgenjs. Trigger on: deck, slides, presentation, NWG, NatWest, investor, board pack, quarterly results — even if the user doesn't say 'skill' or 'nwg-pptx' explicitly."
license: "Proprietary — NatWest Group internal use"
---
# nwg-pptx

Use this skill to create NatWest Group styled presentation decks from raw input, review them in a local HTML playground, apply feedback from `feedback.json`, and export editable `.pptx` files.

## Key references (read before generating)

- **`.agents/skills/nwg-pptx/references/design-system/nwg-components.html`** — component library gallery (READ THIS FIRST before generating any slide)
- `.agents/skills/nwg-pptx/references/slot-reference.md` — slide modes, component rules, and optional template preset slots
- `.agents/skills/nwg-pptx/references/design-system/nwg-data-to-layout.html` — decision tree for when to use template presets
- `.agents/skills/nwg-pptx/references/design-system/nwg-layouts.html` — gallery of 12 template presets as composition references
- `.agents/skills/nwg-pptx/references/id-schema.md` — element ID grammar

## Commands

### Generate deck

When the user asks to make a deck, present, or slides:

1. **Read the component gallery first**: `.agents/skills/nwg-pptx/references/design-system/nwg-components.html`
2. **For each slide, choose a mode:**
   - **Mode A — Component-composed (default, preferred)**: Set `"template": "composed"` and write creative `html_body` HTML assembled from components. Use this for most slides to achieve editorial and data-dense visual quality.
   - **Mode B — Template preset (opt-in shortcut)**: Use a canonical template (e.g. `"s-cover/v1-default"`) with slot fields — only when the preset genuinely fits with zero creative compromise.
3. **Mode A composition rules:**
   - Assemble slides from components in `nwg-components.html` — any layout, any grid, any asymmetric arrangement
   - Editorial scale for hero/section moments: hero-band, large title-block, full-bleed dark panels, section-number
   - Data-dense patterns for metrics: stat-row, data-table, inline-chart, metric-delta
   - All CSS must use `var(--token)` variables from `nwg-tokens.css` — never raw hex values
   - Wrap all `html_body` content in `<div class="slide">…</div>` (provides 1280×720 dimensions)
4. Create `decks/<slug>/deck.json` (manifest) and `decks/<slug>/slides/slide-NN.json` (one per slide).
5. Build and start the server:

```bash
node .agents/skills/nwg-pptx/scripts/build_deck.mjs decks/<slug>
python3 .agents/skills/nwg-pptx/scripts/serve.py decks/<slug> &
```

6. **After starting the server, output the review URL as a clickable link:**

```
Deck built ✓ — open the review playground: [http://localhost:4567/review-playground.html](http://localhost:4567/review-playground.html)
```

**deck.json shape** (unchanged):
```json
{
  "version": 1,
  "deck_id": "<slug>",
  "title": "...",
  "subtitle": "...",
  "theme": { "palette": "nwg-purple-default", "overrides": {} },
  "aspect": "16:9",
  "brand": { "logo": "assets/logo.svg", "deck_footer": "NatWest Group · Confidential" },
  "slides": ["slide-01", "slide-02"],
  "generated_at": "<ISO timestamp>"
}
```

**Mode A slide JSON shape:**
```json
{
  "id": "slide-NN",
  "template": "composed",
  "slots": { "title": "Used for PPTX manifest only" },
  "html_body": "<div class=\"slide\"><style>/* component CSS using var(--token) */</style><!-- component HTML --></div>"
}
```

**Mode B slide JSON shape** (template preset, opt-in):
```json
{
  "id": "slide-NN",
  "template": "s-cover/v1-default",
  "slots": { "kicker": "...", "title": "..." },
  "chart_data": null
}
```

### Applying feedback on composed slides

For Mode A slides (`template: "composed"`), feedback comments are design direction — update `html_body` in `slide-NN.json` accordingly. The `element_id` in the feedback item maps to `data-slot` attributes in the component HTML. Rebuild after updating:

```bash
node .agents/skills/nwg-pptx/scripts/rebuild_dirty.mjs decks/<slug>
```

After rebuild, output the review URL again: [http://localhost:4567/review-playground.html](http://localhost:4567/review-playground.html)

### Apply feedback

When the user asks to "apply feedback" or "process the queue":

1. Read `decks/<slug>/feedback.json`. Items with `error` fields are pre-failed; review before re-processing.
2. Run `node .agents/skills/nwg-pptx/scripts/apply_feedback.mjs decks/<slug>` to handle structural mutations.
3. For remaining `comment` or `slide_add` items, interpret the user request, update the relevant slide JSON, remove completed items from `feedback.json`, then rebuild.
4. Rebuild if needed: `node .agents/skills/nwg-pptx/scripts/build_deck.mjs decks/<slug>`.
5. Confirm `decks/<slug>/apply-report.md` summarizes processed, remaining, errored, and orphaned items.

**feedback.json item types:**

| type | key fields | effect |
|---|---|---|
| `comment` | `slide_id`, `element_id`, `comment` | Slot rewrite (needs LLM interpretation) |
| `theme_change` | `palette` | Updates `deck.json` theme |
| `slide_reorder` | `new_order` | Rewrites `deck.json` slides[] |
| `slide_delete` | `slide_id` | Removes slide from manifest + files |
| `slide_add` | `after_slide_id`, `prompt` | Creates a new slide JSON from the prompt |
| `template_swap` | `slide_id`, `new_template` | Swaps template on slide |
| `viz_override` | `slide_id`, `new_viz` | Changes `chart_data.type` |

### Export deck

When the user asks to export:

```bash
node .agents/skills/nwg-pptx/scripts/export_deck_pptx.mjs decks/<slug>
```

The exporter writes `decks/<slug>/deck.pptx` and `decks/<slug>/pptx-export-manifest.json`.

- **Mode B slides** (template presets) export as editable pptxgenjs shapes and native charts — text is editable in PowerPoint.
- **Mode A slides** (`composed`) are screenshotted via Puppeteer at 1280×720 and embedded as pixel-perfect images — not editable in PowerPoint, which is expected since all editing happens in the review server.

Export runtime requirements:
```bash
npm install -g pptxgenjs   # for Mode B slides
npm install -g puppeteer   # for Mode A composed slides
```

## File ownership

| Owned by | Files |
|---|---|
| Claude | `deck.json`, `slides/slide-NN.json` |
| Build artifacts (do not edit) | `slides/slide-NN.html`, `assets/deck_index.html` |
| User / playground | `feedback.json` |
| Export artifact | `deck.pptx`, `pptx-export-manifest.json` |

## Incremental rebuild

After editing JSON without running full apply_feedback:

```bash
node .agents/skills/nwg-pptx/scripts/rebuild_dirty.mjs decks/<slug>
```

Rebuilds only slides whose `.json` is newer than their `.html`.
