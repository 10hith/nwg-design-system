# Update Patterns

Exact snippets to copy when editing the three design-system HTML files. Patterns are grouped by what you're adding. Read only the relevant section — no need to load the whole file.

Each pattern tells you *which file* to touch, *where* in the file, and *what* to write. If you follow them, the validator in `scripts/validate_design_system.py` will pass.

---

## Adding a new color token

Touches `nwg-design-system.html` in two places: the JSON block and the CSS `:root` block.

**1. JSON block (`#nwg-tokens` → `color.<family>`)**

Find the appropriate family (`brand`, `accent`, `neutral`, `status`, `chart`, `semantic`) and insert the token keeping alphanumeric-ish order:

```json
"accent.teal": "#2EB3A3",
"accent.teal.soft": "#A6E1D9"
```

**2. CSS `:root` block (lines ~119-132)**

Add a variable. Naming convention: short abbreviation for brand colors (`--p700`), semantic name for accents/status (`--teal`, `--teal-soft`):

```css
--teal:#2EB3A3; --teal-soft:#A6E1D9;
```

**3. (Optional) Visible swatch in the "Colour" section**

Find the existing swatch grid for the family and copy a swatch block, swapping the color and name.

**Do not add** the same color to more than one family. If it's simultaneously a brand color and a chart color, add it once (e.g., under `brand`) and reference it by hex in `chart` rather than duplicating.

---

## Adding a new layout archetype

Touches `nwg-layouts.html` (rendered mockup) *and* `nwg-data-to-layout.html` (JSON classification). Both must be updated in the same session or the validator fails.

**1. `nwg-layouts.html` — append a slot**

Insert the new slot just before the `</div>` that closes the `<div class="gallery">` container (around line 570). The slot skeleton:

```html
<!-- 13 TIMELINE -->
<div class="slot">
  <div class="slot-hd">
    <span class="num">13</span><span class="name">KPI Timeline</span>
    <span class="tag">argument</span>
    <span class="note">Best for: showing 5-8 KPIs along a time axis (quarters, years). Horizontal rail with pill markers; current period highlighted in purple.700, prior periods in purple.300.</span>
  </div>
  <div class="slide s-timeline">
    <!-- rendered mockup — use existing tokens / CSS vars only -->
  </div>
</div>
```

Rules for the mockup markup:

- Wrapper class `slide` is required (it sets `aspect-ratio:16/9` and base padding).
- Add a unique modifier class (`s-timeline`) and put its specific CSS in a `<style>` block co-located with the slot, not at the top of the file — keeps archetypes self-contained.
- Use CSS variables (`var(--p700)`, `var(--gold)`, etc.) — never hard-coded hex.
- Fill the content with plausible placeholder data from NWG decks (e.g., "FY24", "+6.1%"). Don't use Lorem Ipsum.

**2. `nwg-data-to-layout.html` — register in JSON + decision tree**

In the `#nwg-classification` block:

```json
"13_timeline": { "purpose": "argument", "data_shape": "time_ordered_kpis", "count": "5-8" }
```

Add the corresponding decision rule near the bottom of the `decision` array (more specific rules first, fallbacks last):

```json
{ "if": "data_shape == 'time_ordered_kpis' && count >= 5", "use": "13_timeline" }
```

If you added a new `data_shape`, also add a data-shape card in Section 2 of the same file (below the existing H/J/K cards) so humans can see the new shape explained.

Add an entry to `constraints.max_items_per_layout`:

```json
"13_timeline": 8
```

Bump `"version"` in the JSON block (minor rev: `1.0.0` → `1.1.0`).

---

## Adding a new component

Touches `nwg-design-system.html` only.

**1. CSS**

Add styles to the `<style>` block, keeping the component prefix consistent (e.g., `.badge-alert`, not `.alertBadge`).

```css
.badge-alert{display:inline-flex;gap:8px;padding:6px 12px;border-radius:var(--r-pill);
  background:var(--p050);color:var(--p800);border:1px solid var(--p300);font-weight:700;font-size:12px}
.badge-alert.solid{background:var(--warn);color:#1F1B2E;border-color:transparent}
```

**2. Showcase**

Add a showcase block inside the relevant `<section>` (most likely "Components"). Template:

```html
<div class="card">
  <h3>Alert badge</h3>
  <p class="sub">Compact status marker, used in the top-right of KPI cards when a metric crosses a threshold.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <span class="badge-alert">Watch</span>
    <span class="badge-alert solid">Breach</span>
  </div>
</div>
```

**3. JSON (optional but preferred)**

If the component is a repeatable visual atom that an agent should know about, add a stub in `#nwg-tokens → components` (create the key if it doesn't exist yet):

```json
"components": {
  "badge.alert": {
    "use": "compact status marker on KPI cards",
    "variants": ["default", "solid"],
    "tokens": ["p050","p800","p300","warn"]
  }
}
```

---

## Adding a typography token

**1. JSON (`type.scale`)**

```json
"caption.micro": { "size": 9, "line": 1.30, "weight": 400, "family": "body" }
```

**2. CSS specimen**

Add a `.spec` block in the "Typography" section with a matching sizing class, and a short label describing the use.

**Do not silently repurpose existing scale entries** (e.g., widening `caption` from 11 to 12). If the size changed, add a new entry; deprecate the old one in a comment if needed, but don't remove it — downstream consumers may reference it.

---

## Adding a decision rule without a new archetype

If an existing archetype covers a previously-uncatalogued data shape (e.g., "part-to-whole" can also accept "weighted_shares"), you just need to extend the decision tree in `nwg-data-to-layout.html`:

```json
{ "if": "data_shape == 'weighted_shares'", "use": "09_hub_spoke" }
```

Order matters — more specific rules must come before more general ones. The first matching `if` wins.

Patch-bump the classification `version` (`1.1.0` → `1.1.1`).

---

## Deprecating (don't delete)

If the user asks to remove an archetype or token, *don't actually delete it* — mark it deprecated. Downstream agents may have cached the ID.

For an archetype:

```json
"09_hub_spoke": { "purpose": "argument", "data_shape": "part_to_whole", "count": "4-6 slices", "deprecated": true, "replaced_by": "09b_radial" }
```

Add a `⚠ deprecated` tag to its slot header in `nwg-layouts.html`. Remove any decision rules that point to it. Major-version bump (`1.1.0` → `2.0.0`) only if the replacement isn't a drop-in.

---

## Common mistakes

- Forgetting to update *both* the JSON block and the CSS `:root` when adding a color. The validator catches this.
- Using hard-coded hex in a new layout's mockup instead of `var(--pN)` tokens — the slide looks right today but won't follow if the palette shifts.
- Putting component-specific CSS at the top of `nwg-layouts.html` instead of co-located with the archetype slot — makes future archetype removal painful.
- Writing a `note` without a "best for" opening phrase. The existing archetypes all start with "Best for: …" — keep the shape consistent so an agent scanning the file has a predictable landmark.
