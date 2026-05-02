# nwg-pptx · Requirements

> **Status:** Draft v1.1 · 2026-05-02
> **Owner:** lohith.uvce@gmail.com
> **Goal:** A self-contained, GitHub-installable skill that takes raw input data, picks NWG layouts, lets the user review and tweak the deck in an interactive HTML playground, and exports a final `.pptx`.

---

## 1. Overview

`nwg-pptx` is a **self-contained, GitHub-installable skill** following the same distribution pattern as `playground` and `pptx`. It bundles all templates, design tokens, scripts, and reference docs so it can be installed into any project without requiring the NWG design system repo locally.

It draws patterns from three existing skills:

| Source | Role in nwg-pptx |
|---|---|
| `pptx` (Anthropic) | `pptxgenjs.md` and `editing.md` bundled into `references/`. Export via pptxgenjs Node API (no Python). |
| `playground` (Anthropic) | Structural model: lean YAML-fronted SKILL.md + templates directory. Review playground UI pattern. |
| `huashu-design` | Multi-file slide grammar; deck index aggregator with keyboard nav. |

The skill is packaged and validated using the `skill-creator` skill (`anthropics/skills`). It adds a **review playground** stage between generation and export.

---

## 2. Goals & non-goals

### In scope (v1)

- Self contained skill with all dependencies bundled
- Generate a deck from input data using NWG layouts and the data→layout decision tree.
- Produce an interactive HTML review playground that mirrors the deck slide-for-slide.
- Allow per-element feedback via clickable IDs that open a free-text popover.
- Allow live tweaks: theme/palette swap, slide reorder/jump/delete/add, per-slide template/variant swap, viz type override.
- Persist all feedback + tweaks to `feedback.json` on disk (single source of truth for the regeneration pass).
- Round-trip back to Claude: Claude reads `feedback.json`, applies changes, regenerates affected slides, then exports `.pptx`.
- Restructure NWG layouts to support 2–3 sanctioned visual variants per layout (creativity space within the design system).

### Out of scope (v1)

- Real-time AI calls from inside the playground (no `window.claude.complete`; playground is fully offline).
- Direct PPTX export from the playground (export only happens after Claude regenerates).
- Multi-user collaborative review.
- Direct in-place text editing in the playground (popover is comment-only — Claude does the writing).
- Inline image swap.
- Cross-origin / cloud-hosted deployment of the playground.

---

## 3. End-to-end user journey

```
[User input: data + intent]
        │
        ▼
  Step 1 · Generate                       (Claude command: "make a deck from <data>")
   • Read design-system/nwg-data-to-layout.html (decision tree)
   • Pick a layout + variant per slide
   • Write deck.json + slides/slide-NN.json (content)
   • Run build script: template + slot fill + ID stamp → slides/slide-NN.html
   • Auto-start scripts/serve.py and open browser
        │
        ▼
  Step 2 · Review                         (no Claude command — user works in browser)
   • Click any tagged element → free-text popover → save
   • Tweak theme / reorder / delete / add / template-swap / viz-swap
   • Every change POSTs to /save-feedback → feedback.json updated on disk
        │
        ▼
  Step 3 · Apply                          (Claude command: "apply feedback")
   • Read feedback.json items[]
   • For each item, mutate the right JSON file (deck.json or slide-NN.json)
   • Rebuild affected slides (template + slot fill + ID stamp)
   • Successful items removed from feedback.json
   • Failed items keep error field for triage
   • Emit apply-report.md
        │
        ▼
  Step 4 · Export                         (Claude command: "export deck")
   • Run scripts/export_deck_pptx.mjs (from bundled pptx skill)
   • Output: deck.pptx (editable text + native PPT charts)
```

Steps 2 and 3 may iterate. The server runs throughout; refresh the playground tab to see post-apply updates.

---

## 4. Architectural decisions (the 12 locked decisions)

| # | Decision | Rationale |
|---|---|---|
| 1 | **Multi-file deck.** One HTML per slide in `slides/slide-NN.html`. | Matches pptx exporter's per-file iteration; trivial reorder via manifest; clean iframe isolation in playground. |
| 2 | **IDs only on meaningful content elements.** Allowlist of selectors (titles, paragraphs, list items, images, chart containers, stat tiles, table cells, footers). Layout wrappers, decorative SVGs, scripts get no ID. | Layout-level concerns are handled via template-swap, not per-element comment. ~80% fewer hover targets, much cleaner UX. |
| 3 | **Deterministic position-based IDs.** Schema: `slide-<NN>--<role>[-<index>]` (e.g., `slide-07--stat-1-value`). Survive text rewrites and theme changes; break only on structural change. Apply-feedback emits an **orphaning report** when comments lose their target. | 100% deterministic — same layout + slot population produces same IDs. No Claude-side memory of names needed. |
| 4 | **Sanctioned variants per layout.** Each of 12 layouts gets 2–3 variants in `templates/s-<layout>/vN-<name>.html`. All variants share NWG tokens; differ in composition. Creativity = variant selection, not CSS authorship. | Solves the "all decks look the same" concern without breaking design system or PPTX export. AI freeform CSS = AI slop; sanctioned variants = combinatorial design space. |
| 5 | **Same-origin DOM access; parent injects bridge on iframe load.** Slides are pure presentation HTML. Playground attaches click/hover/theme listeners by reaching into `iframe.contentDocument` after `onload`. | Cleaner slide artifacts (no inline `<script>` blocks); safer for PPTX export pipeline; theme switch is direct DOM call. Local http server satisfies same-origin. |
| 6 | **JSON content + template + build step (Path B).** Each slide is a JSON content blob that gets compiled to HTML via mustache-style slot substitution + ID stamping. HTML files are *build artifacts*. | Bulletproof regen — Claude only edits JSON slots; CSS can never drift. IDs deterministically reproducible. Templates stay clean for designers. |
| 7 | **Three-way file split.** `deck.json` (manifest: order, theme, brand) + `slides/slide-NN.json` (per-slide content) + `feedback.json` (user-session queue). HTML files are build artifacts. | Clean ownership: Claude owns deck/slide JSONs; user (via playground) owns feedback.json. Apply-feedback consumes feedback.json's queue and produces JSON edits. |
| 8 | **Python stdlib server with POST handler** (`scripts/serve.py`). `feedback.json` lands on disk so coding agent can read it. **`feedback.json` is a pending-only to-do queue** — Claude trims items as it completes them. | User explicitly requires file-system persistence. Pure stdlib, no Node dependency. To-do semantics match user's mental model. |
| 9 | **Free-text comment popover.** Single textarea: *"What would you like Claude to change?"* `Cmd+Enter` saves; `Esc` cancels. No structured action types. | Matches user's stated intent ("leave feedback"). LLM is better at action-classification than user is. Tags can come in v2. |
| 10 | **Native PPT charts via pptxgenjs.** `slots.chart_data` holds the data; HTML renders SVG for review; exporter calls `pptxgenjs` chart API at export time. | Editable charts is the headline of the pptx skill. Falling back to images on chart slides defeats the whole bundle. Cost: data-driven rendering shim shared by HTML + pptxgenjs. |
| 11 | **Live iframe thumbnails in the left panel.** Each slide rendered at scale ~0.07 (~140px wide). | Theme/reorder/content edits update thumbs in real time. Pre-rendered PNGs would require a server-side rebuild on every tweak. 8–12 hidden iframes is fine. |
| 12 | **Four user-facing commands** — Generate / (Review) / Apply / Export. Generate auto-starts the server and opens the browser. | Each phase has a clean trigger; review needs no Claude command (user works in browser); apply doesn't restart server (user refreshes tab). |

---

## 5. Project layout

```
<project-root>/                              ← user's CWD when invoking skill
├── decks/
│   └── q3-results-2026/                     ← <slug> from prompt, or user-provided
│       ├── deck.json                        ← Claude-owned manifest
│       ├── slides/
│       │   ├── slide-01.json                ← Claude-owned content
│       │   ├── slide-01.html                ← BUILD ARTIFACT — do not edit
│       │   ├── slide-02.json
│       │   ├── slide-02.html
│       │   └── ...
│       ├── assets/
│       │   ├── nwg-tokens.css               ← shared CSS variables, linked by every slide
│       │   ├── deck_index.html              ← keyboard-nav aggregator (huashu-design pattern)
│       │   ├── thumbs/                      ← optional: cached PNGs (not used in v1; iframes live)
│       │   └── logo.svg                     ← optional brand asset
│       ├── review-playground.html           ← the new piece — left controls / center preview / right comments
│       ├── feedback.json                    ← playground-owned to-do queue
│       ├── feedback.history/                ← optional: archived completed sessions
│       │   └── 2026-05-01T14-32-00.json
│       └── apply-report.md                  ← emitted by apply-feedback
└── deck.pptx                                ← final export, written next to project dir
```

---

## 6. NWG layout restructure (the variant plan)

### 6.1 Current state

`design-system/nwg-layouts.html` is a single gallery file with 12 `<section class="slide s-*">` blocks: `s-cover`, `s-section`, `s-agenda`, `s-stack`, `s-3col`, `s-matrix`, `s-stats`, `s-chart`, `s-hub`, `s-process`, `s-tree`, `s-close`. Each section uses tokens from a shared `:root`.

The gallery serves as a *readable showcase* — it's the human-facing reference. It is **not** the runtime template source.

### 6.2 Target state

A new `templates/` directory at the skill root, organized per layout, with 2–3 variants each:

```
templates/
├── _shared/
│   ├── nwg-tokens.css            ← extracted :root and base typography
│   └── slide-shell.html          ← <!doctype>/head wrapper used by every variant
├── s-cover/
│   ├── v1-default.html           ← extracted from current nwg-layouts.html
│   ├── v1-default.id-map.json    ← element role → ID mapping for stamping
│   ├── v2-image-hero.html        ← NEW · cover with full-bleed brand image
│   └── v2-image-hero.id-map.json
├── s-section/
│   ├── v1-default.html           ← extracted
│   └── v2-numeric.html           ← NEW · large section number + label
├── s-agenda/
│   └── v1-default.html           ← extracted (agenda is canonical, single variant OK)
├── s-stack/
│   ├── v1-default.html           ← extracted
│   ├── v2-numbered.html          ← NEW · 1./2./3. lead-in instead of check-rings
│   └── v3-quote.html             ← NEW · pull-quote treatment
├── s-3col/
│   ├── v1-icon-bullets.html      ← extracted (current nwg-layouts.html version)
│   ├── v2-image-prose.html       ← NEW · image header per column + paragraph body
│   └── v3-stat-caption.html      ← NEW · big stat per column + short caption
├── s-matrix/
│   ├── v1-default.html           ← extracted
│   └── v2-compact.html           ← NEW · denser version for ≥6 rows
├── s-stats/
│   ├── v1-grid.html              ← extracted (3×2 stat grid)
│   ├── v2-hero.html              ← NEW · one big stat + 3 supporting
│   └── v3-callout.html           ← NEW · stats with embedded sparklines
├── s-chart/
│   ├── v1-narrative.html         ← extracted (chart left, narrative right)
│   └── v2-callouts.html          ← NEW · chart with annotation callouts
├── s-hub/
│   ├── v1-donut.html             ← extracted
│   └── v2-stacked.html           ← NEW · stacked bar alternative for part-to-whole
├── s-process/
│   ├── v1-horizontal.html        ← extracted
│   ├── v2-vertical.html          ← NEW · vertical timeline variant
│   └── v3-numbered-cards.html    ← NEW · numbered card stack
├── s-tree/
│   ├── v1-default.html           ← extracted
│   └── v2-radial.html            ← NEW · radial hierarchy
└── s-close/
    ├── v1-thanks.html            ← extracted
    └── v2-cta.html               ← NEW · call-to-action close
```

### 6.3 Variant authoring rules

- All variants must use only NWG tokens from `_shared/nwg-tokens.css` (no hand-coded colors or fonts).
- All variants must satisfy the 4 hard PPTX-export constraints from `pptx/editing.md` (block layout grammar that `html2pptx.js` can translate into editable text frames).
- Variants differ in **composition** (which slots, how the grid divides, which elements present), not in token system or typography.
- Each variant ships with a sibling `*.id-map.json` declaring its role-class → ID mapping, generated once when the variant is authored.

### 6.4 Refresh from `nwg-layouts.html`

`scripts/refresh_templates.mjs` (one-off command, not run on every gen):
- Reads `design-system/nwg-layouts.html`.
- For each `<section class="slide s-*">`, extracts content and CSS.
- Writes / updates only the `v1-*.html` files (canonical extracts).
- Leaves `v2-*` and `v3-*` files alone (those are net-new authored work).

This keeps the gallery file as the readable reference and decouples it from the production templates.

### 6.5 v1 ship scope (open question)

Two options for what `nwg-pptx` v1 ships with:
- Ship the skill with all dependencies bundled
- **v1-only ship**: 12 templates extracted from gallery, each with one variant. Variants come incrementally as design work progresses. Creativity in v1 comes from layout selection + content + theme.
- **Full ship**: ~30 templates (12 layouts × 2–3 variants). All variants authored before v1 release. Larger upfront design effort.

**Recommendation: ship v1-only first, add variants incrementally**. Skill is functional from day one; variants land as design work completes. Document each new variant in a changelog so Claude knows what's available.

---

## 7. ID schema specification

### 7.1 Naming grammar

```
slide-<NN>--<role>[-<index>][-<sub-role>]
```

- `<NN>` — zero-padded slide order (01, 02, …).
- `<role>` — semantic role from a fixed vocabulary per layout (e.g., `title`, `kicker`, `bullet`, `stat`, `chart`, `pillar`, `col`, `footer`).
- `<index>` — 1-based when role repeats (e.g., 3 stats → `stat-1`, `stat-2`, `stat-3`).
- `<sub-role>` — only for compound elements (e.g., `stat-1-value`, `stat-1-label`).

### 7.2 Examples by layout

```
s-cover
  slide-01--kicker
  slide-01--title
  slide-01--subtitle
  slide-01--presenter
  slide-01--date

s-stats (v1-grid, 3 stats)
  slide-07--kicker
  slide-07--title
  slide-07--stat-1-value
  slide-07--stat-1-label
  slide-07--stat-2-value
  slide-07--stat-2-label
  slide-07--stat-3-value
  slide-07--stat-3-label
  slide-07--footer

s-3col (v1-icon-bullets, 3 columns)
  slide-05--title
  slide-05--col-1-icon
  slide-05--col-1-heading
  slide-05--col-1-bullet-1
  slide-05--col-1-bullet-2
  slide-05--col-1-bullet-3
  slide-05--col-2-icon
  ...
  slide-05--footer
```

### 7.3 Stamping rules (`scripts/stamp_ids.mjs`)

- Input: a fresh HTML file produced by template + slot fill (no IDs yet).
- Process: walk DOM in document order; match elements against the variant's `id-map.json` (role-class selectors); assign IDs.
- Also adds `data-feedback="true"` to every stamped element.
- Output: HTML with IDs and feedback markers ready for the playground.

### 7.4 Orphaning at apply-feedback

When a regen pass changes a slide's structure (template/variant swap, new variant chosen by Claude), some IDs vanish.

Apply-feedback flow:
1. Snapshot `Set<element_id>` before regen.
2. Regen the slide.
3. Diff: `removed = before - after`.
4. Mark any feedback item targeting `removed` IDs as `error: "orphaned: element no longer exists"` and leave it in `feedback.json` for user triage.
5. Surface in `apply-report.md`: *"3 comments orphaned because slide 5 changed variant. Re-anchor or delete in the playground."*

---

## 8. Data shapes

### 8.1 `deck.json`

```json
{
  "version": 1,
  "deck_id": "q3-results-2026",
  "title": "Q3 2026 Results",
  "subtitle": "Investor briefing",
  "theme": {
    "palette": "nwg-purple-default",
    "overrides": {}
  },
  "aspect": "16:9",
  "brand": {
    "logo": "assets/logo.svg",
    "deck_footer": "NatWest Group · Confidential"
  },
  "slides": [
    "slide-01",
    "slide-02",
    "slide-03",
    "slide-04",
    "slide-05"
  ],
  "generated_at": "2026-05-01T14:00:00Z",
  "last_applied_at": "2026-05-01T15:12:00Z"
}
```

### 8.2 `slides/slide-NN.json`

```json
{
  "id": "slide-03",
  "template": "s-stats/v1-grid",
  "slots": {
    "kicker": "Q3 2026",
    "title": "£74bn of loans — diversified across sectors",
    "stat-1-value": "£74bn",
    "stat-1-label": "Total commercial loan book",
    "stat-2-value": "12",
    "stat-2-label": "Sectors covered",
    "stat-3-value": "+8.2%",
    "stat-3-label": "YoY growth",
    "footer": "Source: Q3 2026 results"
  },
  "chart_data": null
}
```

For `s-chart` slides, `chart_data` carries the typed data the renderer (HTML SVG path + pptxgenjs path) consumes:

```json
{
  "id": "slide-08",
  "template": "s-chart/v1-narrative",
  "slots": { "title": "...", "narrative": "..." },
  "chart_data": {
    "type": "line",
    "x_axis": ["2022", "2023", "2024", "2025", "2026"],
    "series": [
      { "name": "Revenue", "values": [12.1, 13.4, 15.8, 18.2, 21.5] },
      { "name": "Costs", "values": [8.5, 9.1, 10.2, 11.0, 11.8] }
    ],
    "y_axis_label": "£bn"
  }
}
```

### 8.3 `feedback.json`

```json
{
  "version": 1,
  "session_started_at": "2026-05-01T14:32:00Z",
  "items": [
    {
      "id": "fb-001",
      "type": "comment",
      "slide_id": "slide-03",
      "element_id": "slide-03--title",
      "comment": "Rephrase to focus on YoY growth",
      "created_at": "2026-05-01T14:35:12Z"
    },
    {
      "id": "fb-002",
      "type": "theme_change",
      "palette": "nwg-cool-blue",
      "created_at": "2026-05-01T14:36:00Z"
    },
    {
      "id": "fb-003",
      "type": "slide_reorder",
      "new_order": ["slide-01", "slide-03", "slide-02", "slide-04"],
      "created_at": "2026-05-01T14:37:00Z"
    },
    {
      "id": "fb-004",
      "type": "slide_delete",
      "slide_id": "slide-04",
      "created_at": "2026-05-01T14:38:00Z"
    },
    {
      "id": "fb-005",
      "type": "slide_add",
      "after_slide_id": "slide-02",
      "prompt": "Add a slide showing customer growth by region",
      "created_at": "2026-05-01T14:39:00Z"
    },
    {
      "id": "fb-006",
      "type": "template_swap",
      "slide_id": "slide-05",
      "new_template": "s-3col/v3-stat-caption",
      "created_at": "2026-05-01T14:40:00Z"
    },
    {
      "id": "fb-007",
      "type": "viz_override",
      "slide_id": "slide-08",
      "new_viz": "line",
      "created_at": "2026-05-01T14:41:00Z"
    }
  ]
}
```

**Item types and routing at apply-feedback:**

| `type` | Routes to | Effect |
|---|---|---|
| `comment` | `slide-NN.json` (slot lookup via `id-map.json`) | Edit slot value per Claude's interpretation of `comment` |
| `theme_change` | `deck.json` `theme` | Update palette; rebuild all slides |
| `slide_reorder` | `deck.json` `slides[]` | Rewrite order array |
| `slide_delete` | `deck.json` `slides[]` + delete files | Remove from manifest, delete `slide-NN.{json,html}` |
| `slide_add` | New `slide-NN.json` + insert in `deck.json` | Claude picks layout + variant + content from `prompt` |
| `template_swap` | `slide-NN.json` `template` | Swap variant; keep slots that match new variant's slot names; flag orphans for missing slots |
| `viz_override` | `slide-NN.json` `chart_data.type` | Swap chart type; keep series data |

### 8.4 Per-variant `*.id-map.json`

```json
{
  "template": "s-stats/v1-grid",
  "elements": [
    { "selector": ".kicker", "role": "kicker" },
    { "selector": "h1.title", "role": "title" },
    { "selector": ".stat", "role": "stat", "indexed": true,
      "children": [
        { "selector": ".value", "sub_role": "value" },
        { "selector": ".label", "sub_role": "label" }
      ]
    },
    { "selector": ".footer", "role": "footer" }
  ]
}
```

The stamper uses this mapping to assign IDs deterministically.

---

## 9. The review playground

### 9.1 Layout

```
┌────────────────────┬──────────────────────────────────────┬────────────────┐
│  LEFT PANEL        │  CENTER · LIVE SLIDE PREVIEW        │  RIGHT PANEL   │
│  (controls)        │                                      │  (comments)    │
│                    │  ┌────────────────────────────────┐  │                │
│  ▸ Theme           │  │                                │  │  Slide 3 ▾     │
│    [Palette A▾]    │  │   <iframe src="slides/        │  │  ──────        │
│                    │  │    slide-03.html">             │  │  • #title      │
│  ▸ Slides          │  │                                │  │    "rephrase"  │
│    [01] Title  ⋮   │  │   (parent injects bridge       │  │  • #chart      │
│    [02] Intro  ⋮   │  │    on iframe.onload via        │  │    "use line"  │
│    [03] Data ●⋮   │  │    contentDocument)            │  │                │
│    [04] Chart ⋮   │  │                                │  │  [Filter ▾]   │
│    + Add slide    │  └────────────────────────────────┘  │                │
│                    │                                      │                │
│  ▸ This slide     │   ◀  3 / 8  ▶                       │                │
│    Layout: [▾]    │                                      │                │
│    Viz:    [▾]    │                                      │                │
└────────────────────┴──────────────────────────────────────┴────────────────┘
```

The dot (●) on slide 03 indicates unresolved feedback exists.

### 9.2 Left-panel controls

| Control | Behavior | Item type written to feedback.json |
|---|---|---|
| Theme switcher | Dropdown of NWG palettes; updates CSS variables across all iframes live via `iframe.contentDocument.documentElement.style.setProperty` | `theme_change` |
| Slide navigator | Live iframe thumbnails (~140px); click to jump; drag to reorder; ⋮ menu per slide for delete | `slide_reorder` / `slide_delete` |
| `+ Add slide` | Opens inline prompt input ("What should this slide cover?"); on submit, adds a placeholder slide to navigator | `slide_add` |
| Per-slide template swap | Active when a slide is selected; dropdown of variants for that layout | `template_swap` |
| Viz type override | Active when current slide is a chart slide; choice of `line / bar / pie / area / scatter` | `viz_override` |

### 9.3 Element-level feedback

**Bridge injection** (parent code, runs on every `iframe.onload`):

```javascript
function injectBridge(iframe, slideId, comments) {
  const doc = iframe.contentDocument;
  const root = doc.documentElement;

  // Hover outline
  doc.querySelectorAll('[data-feedback="true"]').forEach(el => {
    el.addEventListener('mouseenter', () => el.classList.add('feedback-hover'));
    el.addEventListener('mouseleave', () => el.classList.remove('feedback-hover'));
    el.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const r = el.getBoundingClientRect();
      const iframeRect = iframe.getBoundingClientRect();
      openPopover({
        slideId,
        elementId: el.id,
        x: iframeRect.left + r.left + r.width / 2,
        y: iframeRect.top + r.top
      });
    });
  });

  // Apply current theme
  Object.entries(currentPaletteTokens()).forEach(([k, v]) => {
    root.style.setProperty(k, v);
  });

  // Render existing comment markers
  renderMarkers(doc, comments.filter(c => c.slide_id === slideId));

  // Inject styles for hover/marker (one-time)
  if (!doc.getElementById('feedback-styles')) {
    const style = doc.createElement('style');
    style.id = 'feedback-styles';
    style.textContent = `
      .feedback-hover { outline: 2px dashed var(--p400, #9D5BD6); outline-offset: 2px; cursor: pointer; }
      .feedback-marker { position: absolute; width: 18px; height: 18px; border-radius: 50%;
        background: var(--gold, #FDAB1F); color: #1F1B2E; font-size: 11px; font-weight: 800;
        display: grid; place-items: center; pointer-events: none; z-index: 1000; }
    `;
    doc.head.appendChild(style);
  }
}
```

**Popover** lives in the parent DOM, absolutely positioned at translated coordinates so it can't be clipped by iframe boundaries. Single textarea, `Cmd+Enter` to save, `Esc` to cancel. On save: append `comment` item to `feedback.json` (POST `/save-feedback`), close popover, render numbered marker on the element.

### 9.4 Right-panel comment queue

- Lists all comments grouped by slide.
- Click a comment → scroll center panel to that slide and highlight the element via temporary `.feedback-highlight` class.
- Each comment has Edit / Delete actions (writes to feedback.json).
- Filter tabs: All / Pending. (Items with `error` field show a triage badge.)

### 9.5 Header / footer

- Top: project name, "Slide X of N", connection indicator (green dot when server reachable).
- Bottom: status — `N items in queue. Run "apply feedback" in your coding agent to process.`

---

## 10. Server (`scripts/serve.py`)

Pure Python stdlib, ~30 lines:

```python
import http.server, socketserver
from pathlib import Path

PORT = 4567
ROOT = Path.cwd()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save-feedback':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            (ROOT / 'feedback.json').write_bytes(body)
            self.send_response(204)
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'http://localhost:{PORT}/review-playground.html')
        httpd.serve_forever()
```

Auto-started at `Generate` time (background process); user can stop with Ctrl+C or by closing the terminal.

Port collisions: default 4567; if taken, increment by 1 up to 4577 then fail with a helpful message.

---

## 11. Build pipeline

### 11.1 Per-slide build

`scripts/build_slide.mjs` (Node, since pptx skill scripts are already Node):

```
build_slide(slideId, projectDir):
  1. Read decks/<dir>/slides/<slideId>.json
  2. Read templates/<template-path>.html and .id-map.json
  3. Mustache-substitute slots (handle missing slots: leave placeholder visible with warning class)
  4. Stamp IDs using id-map.json against the rendered HTML
  5. Add `data-feedback="true"` to stamped elements
  6. Write decks/<dir>/slides/<slideId>.html
```

### 11.2 Full deck build

`scripts/build_deck.mjs`:
- Read `deck.json`.
- For each slide in `slides[]`, run `build_slide`.
- Write `assets/deck_index.html` (huashu-design pattern) listing all slides for keyboard nav.

### 11.3 Incremental build (post-apply)

`scripts/rebuild_dirty.mjs`:
- Compare each slide's `slide-NN.json` mtime against `slide-NN.html` mtime.
- Rebuild only those where JSON is newer.
- If `deck.json` `theme.palette` changed, rebuild all (palette is in CSS variables that propagate via `_shared/nwg-tokens.css`, but we rebuild defensively for v1).

---

## 12. Apply-feedback flow

`scripts/apply_feedback.mjs` (called by Claude when user says "apply feedback"):

```
1. Read deck.json and feedback.json.
2. For each item in feedback.json.items[] (in order of creation):
   a. Try to apply (route per the table in §8.3).
   b. On success: remove from items[].
   c. On failure: leave with `error: "<reason>"` field; continue.
3. For comment-type items, before mutating the slot:
   a. Map element_id → slot key via the slide's variant id-map.json.
   b. If element_id not in id-map (orphaned): mark error.
   c. Otherwise, ask Claude to interpret the comment in context of the current slot value, write new slot value.
4. Rebuild any slide whose JSON or template changed.
5. If theme changed: rebuild all slides.
6. Snapshot before/after element_id sets per modified slide; flag any feedback items targeting removed IDs as orphaned.
7. Write updated feedback.json (only unprocessed + orphaned + errored items remain).
8. Optionally archive successful items to feedback.history/<timestamp>.json.
9. Write apply-report.md summarizing:
   - Items processed (count and brief)
   - Items orphaned with reason
   - Items errored with reason
   - Slides rebuilt
10. Print summary to stdout.
```

**Claude's role at step 2.c:** This is the only step requiring LLM judgment. Claude reads the comment, the current slot value, the slide context, and writes a new slot value. Other item types (theme, reorder, delete, etc.) are pure data mutations and don't need LLM.

---

## 13. PPTX export

`scripts/export_deck_pptx.mjs` — pure pptxgenjs (Node only, no Python, no LibreOffice):

```
1. Check pptxgenjs is installed globally (npm list -g pptxgenjs); fail with clear message if not.
2. Read deck.json.
3. Create a new pptxgenjs Presentation object with 16:9 aspect, brand metadata.
4. For each slide in slides[]:
   a. Read slide-NN.json.
   b. Map each slot to a pptxgenjs text frame using the variant's id-map.json for position hints.
   c. If template is s-chart or s-hub: use chart_data to call pptxgenjs chart API (bar/line/pie/area).
   d. Place NWG logo and footer on every slide.
5. Write deck.pptx in the deck directory.
```

**Constraints (from `references/editing.md`):** Every template variant must follow the 4 hard layout constraints so slots map cleanly to pptxgenjs text frames. `validate_templates.mjs` enforces this at authoring time.

**Runtime requirement:** `npm install -g pptxgenjs` (one-time per machine). The skill has zero other npm dependencies.

---

## 14. Skill structure (filesystem layout for the skill itself)

### 14.1 SKILL.md frontmatter (required)

Every distributable skill must open with YAML frontmatter. nwg-pptx must follow this exactly:

```yaml
---
name: nwg-pptx
description: "Use this skill whenever the user wants to create a NatWest Group (NWG)
  styled presentation, deck, slides, investor update, board pack, or quarterly results.
  Generates a multi-slide HTML deck from raw data using NWG design tokens and layouts,
  opens an interactive review playground for per-element feedback, applies feedback from
  feedback.json, and exports an editable .pptx via pptxgenjs. Trigger on: deck, slides,
  presentation, NWG, NatWest, investor, board pack, quarterly results — even if the user
  doesn't say 'skill' or 'nwg-pptx' explicitly."
license: "Proprietary — NatWest Group internal use"
---
```

Rules (enforced by `skill-creator`'s `quick_validate.py`):
- Name: kebab-case, max 64 characters
- Description: max 1024 characters, no angle brackets (`<` `>`)
- `license` field is optional but recommended for proprietary skills

### 14.2 Filesystem layout

```
.agents/skills/nwg-pptx/
├── SKILL.md                             ← YAML frontmatter (§14.1) + command grammar
├── README.md                            ← quick-start for human readers
├── templates/                           ← variant library (§6)
│   ├── _shared/
│   │   ├── nwg-tokens.css
│   │   └── slide-shell.html
│   └── s-*/                             ← 12 layout dirs, each with v1-*.html + .id-map.json
├── scripts/                             ← Node (stdlib only) + Python (stdlib only)
│   ├── serve.py                         ← Python stdlib server (§10)
│   ├── build_slide.mjs                  ← per-slide build (§11.1)
│   ├── build_deck.mjs                   ← full deck build (§11.2)
│   ├── rebuild_dirty.mjs                ← incremental build (§11.3)
│   ├── stamp_ids.mjs                    ← ID stamper (§7.3)
│   ├── apply_feedback.mjs               ← apply-feedback orchestrator (§12)
│   ├── validate_templates.mjs           ← export-compat check (§13)
│   └── export_deck_pptx.mjs             ← pptxgenjs export (§13)
├── assets/
│   ├── review-playground.template.html  ← review UI (§9)
│   └── nwg-tokens.css                   ← canonical token sheet (copied to deck on build)
├── references/
│   ├── slot-reference.md                ← required/optional slots per template
│   ├── id-schema.md                     ← §7 in standalone form
│   ├── variant-authoring-guide.md       ← rules from §6.3
│   ├── data-to-layout.md                ← decision tree summary
│   ├── editing.md                       ← bundled from pptx skill (export constraints)
│   ├── pptxgenjs.md                     ← bundled from pptx skill (API reference)
│   └── design-system/                   ← bundled copies (NOT pointers to project files)
│       ├── nwg-layouts.html             ← 12 slide gallery
│       ├── nwg-data-to-layout.html      ← data→layout decision tree
│       └── nwg-design-system.html       ← full token/component reference
└── evals/                               ← skill-creator eval prompts (populated over time)
```

**What is NOT in the skill directory:**
- `scripts/pptx/` Python scripts (dropped — export is pptxgenjs only)
- `references/nwg-design-system.md` (pointer) → replaced by `references/design-system/` bundle
- `references/editable-pptx.md` → content absorbed into `references/editing.md`

### 14.3 Self-containment rules

- All script paths in SKILL.md must be relative to the project root via `.agents/skills/nwg-pptx/scripts/…`
- All design-system references must point to `references/design-system/` inside the skill
- **Zero external npm dependencies** — all Node scripts use `node:fs`, `node:path`, `node:url` only
- **Zero Python package dependencies** — `serve.py` uses stdlib only
- **One runtime requirement:** `pptxgenjs` globally installed (`npm install -g pptxgenjs`) — only needed for export step, documented in README

---

## 15. Implementation roadmap (suggested sequencing)

**Step 0 (packaging foundation):** Add YAML frontmatter to SKILL.md; run `skill-creator`'s `quick_validate.py` to confirm it passes. This is a gate before any other step — a skill that fails validation is not distributable.

A working v1 in roughly this order:

1. **Skill scaffold** — directory structure, SKILL.md with YAML frontmatter (§14.1) + command grammar. ✅ *done*
2. **Template extraction** — `refresh_templates.mjs` + 12 v1 templates from gallery + `_shared/nwg-tokens.css`. ✅ *done*
3. **Build pipeline** — `build_slide.mjs`, `stamp_ids.mjs`, `build_deck.mjs`. Walk through one full slide manually to verify. ✅ *done*
4. **End-to-end generate (no playground)** — Claude command that produces `deck.json` + slide JSONs + built HTMLs + opens `assets/deck_index.html` to verify visually. ✅ *done*
5. **Server** — `serve.py`, auto-start on generate. ✅ *done*
6. **Review playground v0** — left-panel slide navigator only (no theme, no comments). ✅ *done*
7. **Comment popover** — full element-level feedback flow including marker rendering and queue panel. ✅ *done*
8. **Theme switcher** — palette dropdown + live update. ✅ *done*
9. **Reorder / delete / add** — left panel completion. ✅ *done*
10. **Template swap + viz override** — per-slide controls. ✅ *done*
11. **Apply-feedback orchestrator** — `apply_feedback.mjs` covering every item type. ✅ *done*
12. **PPTX export** — real pptxgenjs implementation in `export_deck_pptx.mjs`; `validate_templates.mjs` enforces export-safe variants. ← *next*
13. **Charts** — `chart_data` schema + pptxgenjs chart API rendering path.
14. **v2 variants** — author 2–3 variants per layout incrementally.
15. **Distribution packaging** —
    - Remove `scripts/pptx/` Python directory
    - Move `pptxgenjs.md` → `references/pptxgenjs.md`
    - Bundle `references/design-system/` (copy 3 HTML files from `design-system/`)
    - Run `skill-creator`'s `quick_validate.py` to confirm packaging passes
    - Package with `skill-creator`'s `package_skill.py` to produce `nwg-pptx.skill` (ZIP)
    - Register in `skills-lock.json` + create `.windsurf/skills/nwg-pptx` symlink

---

## 16. Skill distribution

### 16.1 Packaging

The `skill-creator` skill (`anthropics/skills`) provides the tooling to package and validate nwg-pptx for distribution.

**Validate before packaging:**
```bash
python .agents/skills/skill-creator/scripts/quick_validate.py .agents/skills/nwg-pptx
```
Enforces: YAML frontmatter present, name is kebab-case, description ≤ 1024 chars, no angle brackets.

**Create distributable archive:**
```bash
python .agents/skills/skill-creator/scripts/package_skill.py .agents/skills/nwg-pptx
```
Produces `nwg-pptx.skill` (ZIP). Automatically excludes `evals/`, `__pycache__`, `*.pyc`, `.DS_Store`, `node_modules`.

### 16.2 Installation in a new project

```bash
# 1. Copy the skill
cp -r nwg-pptx.skill/.agents/skills/nwg-pptx <project>/.agents/skills/nwg-pptx

# 2. Register in skills-lock.json
# Add entry with source, sourceType, skillPath, computedHash

# 3. Create Windsurf symlink
ln -s ../../.agents/skills/nwg-pptx <project>/.windsurf/skills/nwg-pptx

# 4. Install the one runtime dependency (export only)
npm install -g pptxgenjs
```

**skills-lock.json entry format:**
```json
"nwg-pptx": {
  "source": "<org>/<repo>",
  "sourceType": "github",
  "skillPath": "SKILL.md",
  "computedHash": "<sha256 of SKILL.md>"
}
```

### 16.3 What makes this skill fully self-contained

| Requirement | How satisfied |
|---|---|
| No project-relative design system paths | `references/design-system/` bundles the 3 HTML files |
| No external npm packages at runtime | All Node scripts use stdlib (`node:fs`, `node:path`, `node:url`) |
| No Python packages | `serve.py` uses stdlib only |
| No sibling skill dependencies at runtime | `pptxgenjs.md` + `editing.md` bundled in `references/` |
| One declared runtime dep | `pptxgenjs` global (export step only), documented in README |
| Passes skill-creator validation | YAML frontmatter, kebab-case name, description ≤ 1024 chars |

---

## 17. Open questions for v2 (post-v1)


- **Direct-edit mode** — popover gains a second tab where user types replacement text; bypasses Claude regen for trivial fixes. Requires playground to know slot grammar of every variant.
- **Inline image swap** — drag-and-drop image onto an `<img>`; updates slot to a base64 or asset path.
- **Wildcard freeform slide** — escape-hatch slide type that allows arbitrary HTML; exports as image only (not editable text).
- **Multi-user collaborative review** — server tracks multiple feedback streams, merges at apply.
- **Speaker notes** — `slot_notes: "..."` per slide, exported via pptxgenjs notes API.
- **Versioning / undo** — snapshots of `deck.json` and slide JSONs per apply, with restore command.
- **Template marketplace** — community-contributed variants tested against the 4 hard PPTX constraints.
- **Real-time AI in playground** — `Cmd+K`-style "ask Claude to draft a comment" inside the popover, hitting Claude API.

---

## 18. Success criteria for v1

- User runs one command and gets a deck draft in `decks/<slug>/` with NWG styling and the playground auto-opens in a browser.
- User clicks any tagged element and types a comment; comment lands in `feedback.json` on disk.
- User switches theme / reorders slides / swaps a variant / overrides chart type, and the playground reflects each change live.
- User returns to the coding agent with "apply feedback"; Claude processes the queue, mutates JSONs, rebuilds HTMLs, removes completed items from `feedback.json`, and emits `apply-report.md`.
- Orphaned comments are reported clearly and remain in `feedback.json` for triage.
- User runs "export deck" and gets `deck.pptx` with editable text and editable native charts.
- All 12 NWG layouts represented at least at v1 fidelity; variants land incrementally without breaking existing decks.
