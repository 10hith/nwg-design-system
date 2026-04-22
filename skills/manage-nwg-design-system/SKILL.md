---
name: manage-nwg-design-system
description: "Maintain and extend the NWG (NatWest Group) design system housed in nwg_design_system/design-system/. Use whenever the user wants to add, update, or remove visual patterns, layout archetypes, components, colors, or typography in the NWG design system — typically by uploading a PDF slide or an image and asking 'add this to my design system', 'update the NWG design system', 'here's a new layout I saw', 'classify this slide', or similar. Trigger even when the user says 'NatWest design system', 'NWT design system', 'the design system we built', or just references one of the three HTML files (nwg-design-system.html, nwg-layouts.html, nwg-data-to-layout.html). Also use for routine upkeep — version bumps, consolidating duplicate tokens, renaming archetypes, or auditing the classification decision tree."
---

# Manage NWG Design System

This skill is the single source of maintenance logic for the NatWest Group design system artefacts living at:

- `nwg_design_system/design-system/nwg-design-system.html` — tokens + components (embeds JSON at `#nwg-tokens`)
- `nwg_design_system/design-system/nwg-layouts.html` — the 16:9 layout archetype gallery
- `nwg_design_system/design-system/nwg-data-to-layout.html` — data-shape → layout classification (embeds JSON at `#nwg-classification`)

These three files are the deliverables. Everything this skill does ultimately ends as an edit to one or more of them.

## When to use

The primary trigger is: **the user brings a new visual reference (PDF page or image) and wants to extend the design system with what's in it.** Secondary triggers are housekeeping asks on the same three files — fixing a token, renaming an archetype, pruning the decision tree.

If the user hasn't yet shared a file, the first job is to ask for one. See *Intake* below.

## Core workflow

Follow this loop. Don't skip the intake step even when the user seems to have given you enough — confirming *when* to use a pattern is the single most-useful thing to capture, and it's easy to lose if you guess.

### 1. Intake

Ask the user (via `AskUserQuestion` if available, otherwise inline) for three things:

1. **The reference**: "Please share the PDF page or image showing the pattern you want to add."
2. **What's new about it**: "Is this a new layout archetype, a new component, a new color/type token, or just an example of an existing one?" — options: `layout archetype`, `component`, `token (color/type/spacing)`, `not sure — you tell me`.
3. **When to use it (usage rule)**: "In what circumstances should an agent reach for this pattern? One or two sentences is fine."

The usage rule is what ends up in the `note` attribute on a layout card and in the decision tree. Without it, the pattern is undecidable — an agent will see the shape but won't know when to pick it. If the user says "you tell me," offer your best guess and ask them to confirm or edit before writing it in.

### 2. Analyze

Read the file the user provided.

- **For PDFs**: use the `pdf` skill if available (extracts images from pages), otherwise use `pdftoppm` or `pdfimages` from the shell. Rasterize at ~150 DPI — enough to read color values and measure proportions.
- **For images**: view directly with `Read`.

Work through `references/extraction-checklist.md` and write down what you see. Be explicit about what's *new* vs what's *already in the system* — most new slides reuse 80% of existing tokens and components.

### 3. Propose changes

Before editing, produce a short diff plan and share it with the user for approval. Structure it like this:

```
Planned updates to NWG design system:

nwg-design-system.html
  + color.accent.teal = #2EB3A3  (new token; appears as underline on data tables)
  + new component: "data pill row"  (seen on p.7 of the PDF)

nwg-layouts.html
  + archetype 13: "KPI Timeline"  (7 time-ordered KPI pills along a horizontal rail)

nwg-data-to-layout.html
  + data_shape "time_ordered_kpis" → 13_timeline
  + decision rule: if data_shape == 'time_ordered_kpis' && count >= 5 → 13_timeline
  + constraint: max_items_per_layout.13_timeline = 8
  + classification version bump: 1.0.0 → 1.1.0

Does this look right?
```

Only proceed after the user confirms. If they object to any line, drop it and keep the rest.

### 4. Apply changes

Use the exact code patterns in `references/update-patterns.md` for each kind of change. They're grouped by file and by what you're adding (archetype, token, component, decision rule). The patterns are not cosmetic — they determine whether the JSON still parses and whether the CSS-variable-based theme stays consistent.

**Key rules when editing:**

- The embedded JSON blocks (`#nwg-tokens`, `#nwg-classification`) are the machine-readable source of truth. An agent skill downstream of this one parses them. If you change a CSS token, mirror the change into the JSON block. If you add an archetype to `nwg-layouts.html`, add its entry to the `archetypes` map and the `decision` array in `nwg-data-to-layout.html`.
- Archetype IDs are **stable identifiers** (`13_timeline`, not renamed to `01_timeline`). Never renumber existing archetypes — downstream agents may be caching those IDs. Only append.
- Color tokens follow the pattern `{family}.{name}` where family is one of `brand`, `accent`, `neutral`, `status`, `chart`, `semantic`. Don't invent new families without a reason.
- Every new layout archetype needs a rendered 16:9 mockup in `nwg-layouts.html`, a `note` describing *when to use it*, and a tag (one of: `entry`, `transition`, `orientation`, `argument`, `closing`).
- Bump the `version` field in each JSON block you touched. Semver: patch for tweaks, minor for new tokens/archetypes, major for breaking renames.

### 5. Validate

Run the validator:

```bash
python scripts/validate_design_system.py <path-to-design-system-folder>
```

It checks: JSON blocks parse; archetype IDs referenced in `nwg-data-to-layout.html` all exist in `nwg-layouts.html`; every archetype in the layouts file has a matching entry in the classification JSON; color tokens referenced in `constraints` exist in `#nwg-tokens`. If any check fails, fix and re-run before telling the user you're done.

### 6. Report

Tell the user what you changed using `computer://` links to the three files so they can verify visually. Keep the wrap-up short — one line per file touched, plus any follow-up they should consider (e.g., "the new `teal` accent isn't used anywhere else yet — want me to apply it to the chart series palette too?").

## Reference files

- `references/extraction-checklist.md` — what to look for in a new PDF/image (colors, typography, layout structure, component inventory, when-to-use)
- `references/update-patterns.md` — exact HTML/CSS/JSON snippets to copy for each kind of change
- `references/file-map.md` — where each type of thing lives across the three HTML files, with line-range hints

Read these lazily — don't dump them all into context up front. The checklist is useful every run; the update patterns are useful once you know what kind of change you're making.

## Scripts

- `scripts/validate_design_system.py` — pre-flight and post-edit validator. Zero external deps.

## Anti-patterns (things that have burned us before)

- **Renumbering archetypes.** Breaks downstream agents. Append only.
- **Adding a token to the JSON block but not the CSS `:root`** (or vice versa). Visual + machine views drift apart. Always update both.
- **Skipping the "when to use" question.** The whole point of this design system is to let an agent pick a layout given a data shape. A pattern without a usage rule is noise.
- **Silently accepting a color value from a screenshot.** JPEGs lie. Round to the nearest existing token when within ΔE ~6; only add a new token if the new color is clearly distinct (and ask the user whether it's really a brand addition or just an off-brand one-off).
- **Over-fitting to one slide.** If a pattern appears once in one deck, flag it as tentative in the `note` and ask the user whether they want it canonised or just catalogued. One-off patterns pollute the decision tree.
