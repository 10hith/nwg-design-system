# Slot reference — nwg-pptx templates

## Slide modes

### Mode A — Component-composed (default, preferred)
```json
{
  "id": "slide-NN",
  "template": "composed",
  "slots": { "title": "Used for PPTX manifest only" },
  "html_body": "<div class=\"slide\"><style>/* var(--token) CSS only */</style><!-- components --></div>"
}
```
`html_body` is free-form HTML assembled from components in `nwg-components.html`. All styles must use `var(--token)` variables — no raw hex. Exports as a Puppeteer screenshot image in PPTX.

### Mode B — Template preset (opt-in)
Use the slot contracts below when a canonical template genuinely fits with zero creative compromise. Exports as editable pptxgenjs shapes in PPTX.

Every Mode B `slide-NN.json` must have `id`, `template` (e.g. `s-cover/v1-default`), and `slots`.
Slots marked **optional** render empty if absent; unmarked slots show a visible warning if absent.

---

---

## s-cover / v1-default

| Slot | Type | Notes |
|---|---|---|
| `kicker` | string | Small label above title (e.g. "Q3 2026 Results") |
| `title` | string | Main headline — display font, large |
| `subtitle` | string | Deck subtitle line |
| `date` | string | Event date (e.g. "2 October 2026") |

---

## s-section / v1-default

| Slot | Type | Notes |
|---|---|---|
| `kicker` | string | Section label |
| `title` | string | Section name — large display |
| `section_number` | string | **optional** — large numeral (e.g. "01") |
| `role` | string | **optional** — presenter role line |

---

## s-agenda / v1-default

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `presenter_items` | array | Each: `{ name, role }` — shown in left panel |
| `agenda_items` | array | Strings — numbered list on right |

---

## s-stack / v1-default

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `kicker` | string | **optional** |
| `stack_items` | array | Strings — each item shown as a checklist row |
| `footer` | string | **optional** — source / disclaimer line |

---

## s-3col / v1-icon-bullets

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `banner` | string | Dark header that spans all 3 columns (e.g. "Our Three Pillars") |
| `column_items` | array | Each: `{ heading, bullets[] }` — 3 items expected |
| `footer` | string | Footer-banner at bottom (e.g. "Source: …") |

---

## s-matrix / v1-default

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `kicker` | string | **optional** |
| `matrix_data` | object | `{ headers: [{title, subtitle}], rows: [{label, values[]}], highlight_col? }` |

---

## s-stats / v1-grid

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `group_1_title` | string | Section divider label above first stat row |
| `stats_group_1` | array | Each: `{ value, label }` — up to 4 stat tiles |
| `group_2_title` | string | Section divider label above second stat row |
| `stats_group_2` | array | Each: `{ value, label }` — up to 4 stat tiles |

---

## s-chart / v1-narrative

| Slot | Type | Notes |
|---|---|---|
| `kicker` | string | Small label above chart |
| `title` | string | Main headline on right side |
| `narrative_items` | array | Strings — bullet arrows on right |
| *(chart_data)* | object | **Top-level field** (not in `slots`) — see chart schema |

**chart_data schema:**
```json
{
  "type": "bar",
  "x_axis": ["2022","2023","2024","2025","2026F"],
  "series": [{ "name": "Revenue", "values": [11.2, 12.4, 13.1, 14.0, 14.8] }],
  "y_axis_label": "£bn"
}
```

---

## s-hub / v1-donut

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `kicker` | string | **optional** |
| `callout_items` | array | Each: `{ title, body }` — right panel callout cards |
| `legend_items` | array | Strings — legend labels for donut segments |
| *(chart_data)* | object | **Top-level field** — `type: "donut"`, series values summing to 100 |

---

## s-process / v1-horizontal

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `kicker` | string | **optional** |
| `step_items` | array | Each: `{ date, title, body }` — up to 3 steps |
| `action_items` | array | Strings — NWG actions rows at bottom |

---

## s-tree / v1-default

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `parent` | string | Root node label |
| `child_items` | array | Each: `{ label, focus? }` — child nodes (3–5 recommended) |
| `grid_items` | array | **optional** — strings for grid below tree |

---

## s-close / v1-thanks

| Slot | Type | Notes |
|---|---|---|
| `title` | string | Main message (e.g. "Thank you") |
| `subtitle` | string | Sub-line (e.g. "Questions & Answers") |
| `paragraphs` | array | Strings — rendered as `<p>` blocks in two-column body |
