# nwg-pptx

`nwg-pptx` is a self-contained skill for generating NatWest Group styled decks, reviewing them in a local HTML playground, applying feedback from disk, and exporting editable PowerPoint files.

## Runtime requirements

- Node.js for build/apply/export scripts
- Python 3 stdlib for the local review server
- `pptxgenjs` globally installed for export only:

```bash
npm install -g pptxgenjs
```

## Generate

Create `decks/<slug>/deck.json` and per-slide JSON files in `decks/<slug>/slides/`, then run:

```bash
node .agents/skills/nwg-pptx/scripts/build_deck.mjs decks/<slug>
python3 .agents/skills/nwg-pptx/scripts/serve.py decks/<slug>
```

Open the printed `review-playground.html` URL.

## Apply feedback

```bash
node .agents/skills/nwg-pptx/scripts/apply_feedback.mjs decks/<slug>
```

The script mutates deck/slide JSON, rebuilds HTML, removes processed queue items, and writes `apply-report.md`.

## Export PPTX

```bash
node .agents/skills/nwg-pptx/scripts/export_deck_pptx.mjs decks/<slug>
```

This writes `deck.pptx` with editable text/shapes and native pptxgenjs charts, plus `pptx-export-manifest.json`.

## Validate templates and packaging

```bash
node .agents/skills/nwg-pptx/scripts/validate_templates.mjs
python .agents/skills/skill-creator/scripts/quick_validate.py .agents/skills/nwg-pptx
```
