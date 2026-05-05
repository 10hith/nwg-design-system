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
