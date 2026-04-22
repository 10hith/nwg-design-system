#!/usr/bin/env python3
"""
NWG Design System validator.

Run after any edit to the three design-system HTML files. Zero external deps.

Checks:
  1. The two embedded JSON blocks (#nwg-tokens, #nwg-classification) parse.
  2. Every archetype slot in nwg-layouts.html has a matching key in the
     classification JSON's `archetypes` map.
  3. Every `use:` target in the decision array exists in `archetypes`.
  4. Every key in `constraints.max_items_per_layout` exists in `archetypes`.
  5. Every token path referenced in constraints (e.g.
     color.brand.purple.700) resolves in #nwg-tokens.
  6. Version fields are present and look like semver.

Usage:
    python validate_design_system.py <path-to-design-system-folder>

Exits 0 on success, 1 on any failure. Prints a human-readable summary.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")


def extract_json_block(html: str, block_id: str) -> dict[str, Any]:
    """Pull the JSON out of <script type="application/json" id="...">."""
    pattern = re.compile(
        rf'<script type="application/json" id="{re.escape(block_id)}">\s*(.*?)\s*</script>',
        re.DOTALL,
    )
    m = pattern.search(html)
    if not m:
        raise ValueError(f"could not find <script id=\"{block_id}\"> in file")
    raw = m.group(1)
    return json.loads(raw)


def extract_archetype_ids_from_layouts(html: str) -> list[tuple[str, str]]:
    """
    Read nwg-layouts.html and return a list of (numeric_id, name) tuples,
    e.g. [("01", "Cover / Title Slide"), ("02", "Section Divider"), ...]
    """
    pattern = re.compile(
        r'<span class="num">(\d+)</span>\s*<span class="name">([^<]+)</span>',
        re.DOTALL,
    )
    return [(m.group(1), m.group(2).strip()) for m in pattern.finditer(html)]


def resolve_token_path(tokens: dict, path: str) -> bool:
    """
    A token path like `color.brand.purple.700` maps to
    tokens["color"]["brand"]["purple.700"]. Return True if resolvable.

    The tokens JSON uses dotted keys at leaf level (e.g. "purple.700"),
    so we walk until the remaining segments form an existing leaf key.
    """
    segments = path.split(".")
    for split in range(1, len(segments)):
        head, tail = segments[:split], ".".join(segments[split:])
        cursor: Any = tokens
        ok = True
        for seg in head:
            if isinstance(cursor, dict) and seg in cursor:
                cursor = cursor[seg]
            else:
                ok = False
                break
        if ok and isinstance(cursor, dict) and tail in cursor:
            return True
    # Fallback: pure nested path.
    cursor = tokens
    for seg in segments:
        if isinstance(cursor, dict) and seg in cursor:
            cursor = cursor[seg]
        else:
            return False
    return True


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.ok: list[str] = []

    def err(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    def good(self, msg: str) -> None:
        self.ok.append(msg)

    def print(self) -> int:
        for m in self.ok:
            print(f"  ok    {m}")
        for m in self.warnings:
            print(f"  warn  {m}")
        for m in self.errors:
            print(f"  FAIL  {m}")
        print()
        if self.errors:
            print(f"{len(self.errors)} check(s) failed, {len(self.warnings)} warning(s).")
            return 1
        print(f"All checks passed ({len(self.ok)} ok, {len(self.warnings)} warning(s)).")
        return 0


def validate(folder: Path) -> int:
    r = Report()

    ds_path = folder / "nwg-design-system.html"
    lo_path = folder / "nwg-layouts.html"
    cl_path = folder / "nwg-data-to-layout.html"

    for p in (ds_path, lo_path, cl_path):
        if not p.exists():
            r.err(f"missing file: {p}")
    if r.errors:
        return r.print()

    ds_html = ds_path.read_text(encoding="utf-8")
    lo_html = lo_path.read_text(encoding="utf-8")
    cl_html = cl_path.read_text(encoding="utf-8")

    # 1. JSON blocks parse
    try:
        tokens = extract_json_block(ds_html, "nwg-tokens")
        r.good("#nwg-tokens JSON parses")
    except Exception as e:
        r.err(f"#nwg-tokens could not be parsed: {e}")
        return r.print()

    try:
        cls = extract_json_block(cl_html, "nwg-classification")
        r.good("#nwg-classification JSON parses")
    except Exception as e:
        r.err(f"#nwg-classification could not be parsed: {e}")
        return r.print()

    # 2. Every archetype slot in layouts has a matching key
    layouts_slots = extract_archetype_ids_from_layouts(lo_html)
    if not layouts_slots:
        r.err("no archetype slots found in nwg-layouts.html (check the <span class=\"num\"> markers)")
    else:
        r.good(f"found {len(layouts_slots)} archetype slots in nwg-layouts.html")

    archetypes = cls.get("archetypes", {})
    if not archetypes:
        r.err("#nwg-classification has no `archetypes` map")

    for num, name in layouts_slots:
        # keys look like "01_cover", "13_timeline" — numeric prefix matches `num`
        prefix = num.zfill(2) + "_"
        match = [k for k in archetypes if k.startswith(prefix)]
        if not match:
            r.err(f"layout slot #{num} '{name}' has no matching archetype key starting with '{prefix}' in classification JSON")
        else:
            r.good(f"slot #{num} '{name}' → archetype '{match[0]}'")

    # 3. Every `use:` in decision array exists in archetypes
    decision = cls.get("decision", [])
    for i, rule in enumerate(decision):
        use = rule.get("use")
        if not use:
            r.err(f"decision rule #{i} missing `use` target")
            continue
        if use not in archetypes:
            r.err(f"decision rule #{i} points to archetype '{use}' which isn't defined")
        else:
            r.good(f"decision rule #{i} → '{use}' ok")

    # 4. max_items_per_layout keys exist
    max_items = cls.get("constraints", {}).get("max_items_per_layout", {})
    for k in max_items:
        if k not in archetypes:
            r.err(f"constraints.max_items_per_layout references unknown archetype '{k}'")

    # 5. Token paths in constraints resolve
    for constraint_key, val in cls.get("constraints", {}).items():
        if isinstance(val, str) and val.startswith("color."):
            # e.g. "color.brand.purple.700"
            if not resolve_token_path(tokens, val):
                r.err(f"constraints.{constraint_key} references unknown token path '{val}'")
            else:
                r.good(f"constraints.{constraint_key} → '{val}' resolves")

    # 6. Version fields present + semver
    tok_ver = tokens.get("meta", {}).get("version", "")
    cls_ver = cls.get("version", "")
    if not SEMVER_RE.match(tok_ver):
        r.err(f"#nwg-tokens meta.version is not semver: '{tok_ver}'")
    else:
        r.good(f"#nwg-tokens version = {tok_ver}")
    if not SEMVER_RE.match(cls_ver):
        r.err(f"#nwg-classification version is not semver: '{cls_ver}'")
    else:
        r.good(f"#nwg-classification version = {cls_ver}")

    return r.print()


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_design_system.py <path-to-design-system-folder>")
        return 2
    folder = Path(sys.argv[1]).expanduser().resolve()
    if not folder.is_dir():
        print(f"not a directory: {folder}")
        return 2
    print(f"Validating {folder} ...\n")
    return validate(folder)


if __name__ == "__main__":
    sys.exit(main())
