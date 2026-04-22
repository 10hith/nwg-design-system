# Extraction Checklist

Use this when analyzing a PDF page or image the user has provided. The goal is to separate what's *already in the system* (don't re-add it) from what's *genuinely new* (catalogue it).

Work through the list in order. Skip a section if clearly irrelevant (e.g., "Typography" on a chart-only slide) but be honest — most NWG slides quietly use 4-5 components and you'll miss half of them on a fast pass.

## 0 · Orient

- Pixel dimensions of the slide? If it's 16:9 (native NWG ratio is 1280×720 or multiples thereof), great. If not, flag it — a 4:3 slide might be from an older template and its patterns may not belong in the current system.
- Deck name and date if visible. Writes into the `note` for context.
- Is this a **canonical** NWG layout (appears multiple times, used by different authors, present in a template) or a **one-off** (a single analyst making a single slide)? One-offs get catalogued tentatively; canonical patterns get canonised.

## 1 · Color sampling

For each distinct color region bigger than ~5% of the slide:

- Sample the hex value (eye-dropper, or — if you extracted a raster — run `python -c "from PIL import Image; im=Image.open('p7.png'); print(im.getpixel((x,y)))"`).
- Compare against `#nwg-tokens → color.brand.*`. If within ~ΔE 6 of an existing token, reuse it (don't invent near-duplicates).
- Flag only genuinely new hues: different hue family, clearly intentional, not a JPEG compression artefact.

Typical NWG hues you'll re-encounter: `#2B0A4A` `#3D0F66` `#4F1783` `#7B2CBF` `#BD91E5` `#ECDCF7` `#F7EFFC` `#FDAB1F`. If you're seeing any of these, they're already tokens.

## 2 · Typography

- Display face? (NWG current: a chunky slab serif — Zilla Slab / Roboto Slab family.)
- Body face? (NWG current: Nunito Sans / Mulish.)
- Any web font reference visible in the PDF metadata? (`pdffonts file.pdf` prints them.)
- Are there any font sizes / weights not already in `type.scale`? If so, note size in pt and the use (e.g., "caption-micro 9pt for legal footer").

## 3 · Layout structure

Draw a mental wireframe. Answer:

- **Regions**: how many major regions (cover panel, nav, content, footer)? Their rough grid proportions?
- **Column count** in the content area?
- **Alignment grid**: does it look like the 12-col 24pt gutter grid already defined, or something else?
- **Whitespace feel**: dense (many items, tight) vs airy (few items, generous padding)?

Then classify — does this match one of the 12 existing archetypes?

| Existing id | When it matches |
|---|---|
| 01_cover | Title-dominated opener with image panel |
| 02_section | Chapter divider, half-bleed image + title panel |
| 03_agenda | Numbered list, often with presenter thumbnails |
| 04_statement | 3-5 italicized declarative sentences stacked |
| 05_pillars | 3-4 equal columns with icon + heading + body |
| 06_matrix | Header row of attributes × rows of entities |
| 07_stats | Grid of standalone big-number cards |
| 08_chart_narr | One chart + bullet or numbered takeaways |
| 09_hub_spoke | Donut / radial with surrounding labels |
| 10_process | 3-4 step arrow sequence |
| 11_hierarchy | Org-chart / tree style branching |
| 12_disclaimer | End-of-deck prose block, small type |

If it matches, you probably don't need a new archetype — you just need to make sure the existing archetype's `note` already covers this case. If it doesn't match, it's a candidate for a new archetype.

## 4 · Component inventory

Walk the slide and list every repeated visual atom. NWG's signature components to watch for:

- **Arrow-tail label** (pentagon pointing right)
- **Check-ring row** (italic phrase in a rounded-pill bar with a circle-check on the left)
- **KPI pill** (large number + tiny label in a rounded tint card)
- **Tinted icon square** (36×36 rounded, light-purple bg, purple line icon)
- **Lab/val pair** (dark purple label on left, tint-filled value on right)
- **Gold underline** (4px gold bar under a heading — brand-coded)

For each new atom, note the smallest structural facts: shape, size, stroke, border radius, fill, text treatment. These go into `update-patterns.md → adding a component`.

## 5 · Data shape

Independently of how the slide *looks*, ask: what *kind of data* is this slide showing? This is what the classification doc maps on. Pick one (add new only if none fit):

- `none` — opening / transition
- `ordered_list` — agenda, steps known in advance
- `parallel_assertions` — multiple standalone claims of equal weight
- `equal_peers` — ≤5 siblings that need to be compared but aren't ranked
- `multi_attr_entities` — N things × M attributes (a table, essentially)
- `independent_kpis` — 3-8 unrelated numbers
- `trend_with_context` — a chart plus why-it-matters points
- `part_to_whole` — shares that sum to 100%
- `sequence` — before → during → after
- `tree` — parent with named children
- `prose` — paragraph of text

## 6 · Usage rule (most important)

Answer in one sentence: **"Use this pattern when the user needs to communicate _______."** That sentence is what an agent will use to decide when to pick it.

Also record the *inverse*: when *not* to use it. ("Don't use this for more than 4 items — it stops being legible.")

If the user didn't volunteer a usage rule during intake, write your best guess and bring it back to them for confirmation before committing.

## 7 · Output

Collect findings into a plan. The plan should be the diff preview you show the user in step 3 of the main workflow. Nothing ever goes into the HTML files until they approve it.
