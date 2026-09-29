"""Slice ChatGPT contact sheets into individual images for the prototype.

Usage: python3 scripts/slice_sheets.py
Reads design/sheets/<sheet>.(png|jpg|jpeg|webp), writes public/images/<folder>/<name>.jpg.

Each sheet is an equal grid with thin light gutters. Gutters are detected from bright rows and columns;
if detection fails the sheet is split evenly and every cell is trimmed slightly to lose any gutter.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public" / "images"

# Cells are listed row by row, left to right.
SHEETS = {
    # First delivery: all twelve opportunity covers in one 3 x 4 sheet.
    "covers": (4, 3, "covers", ["neela", "quiet-hours", "faultlines", "morning-ritual", "neon-monsoon", "backwaters",
                                "paper-boats", "journalist", "salt-water", "home-loan", "coastline", "salt-2"]),
    "people-1": (3, 3, "people", ["kiran", "tara", "meera", "arjun", "rhea", "vikram", "devika", "sameer", "kabir"]),
    "people-2": (3, 3, "people", ["nikhil", "priya", "omar", "lakshmi", "ishaan", "nandini", "sana", "raghu", "zoya"]),
    "covers-1": (2, 2, "covers", ["neela", "quiet-hours", "faultlines", "morning-ritual"]),
    "covers-2": (2, 2, "covers", ["neon-monsoon", "backwaters", "paper-boats", "journalist"]),
    "covers-3": (2, 2, "covers", ["salt-water", "home-loan", "coastline", "salt-2"]),
    "posters": (2, 2, "posters", ["kaaval", "monsoon-letters", "fault-lines", "neeli-raat"]),
    "stills-1": (2, 2, "stills", ["reel-kiran", "kiran-neeli-raat", "kiran-monsoon-letters", "kiran-fault-lines"]),
    "stills-2": (2, 2, "stills", ["kiran-salt", "kiran-kaaval-desert", "reel-tara", "tara-stage"]),
    "stills-3": (2, 2, "stills", ["nandini-kaaval", "sameer-charminar", "devika-rushikonda", "ishaan-set-1"]),
}


def bands(profile: np.ndarray, count: int) -> list[tuple[int, int]]:
    """Split a 1D brightness profile into `count` content bands separated by bright gutters."""
    bright = profile > 235
    spans, start = [], None
    for i, b in enumerate(bright):
        if not b and start is None:
            start = i
        if b and start is not None:
            spans.append((start, i))
            start = None
    if start is not None:
        spans.append((start, len(profile)))
    spans = [s for s in spans if s[1] - s[0] > len(profile) / (count * 3)]
    if len(spans) == count:
        return spans
    step = len(profile) / count
    return [(int(i * step), int((i + 1) * step)) for i in range(count)]


def slice_sheet(path: Path, rows: int, cols: int, folder: str, names: list[str]) -> None:
    img = Image.open(path).convert("RGB")
    grey = np.asarray(img.convert("L"), dtype=np.float32)
    row_bands = bands(grey.mean(axis=1), rows)
    col_bands = bands(grey.mean(axis=0), cols)
    out_dir = ROOT / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    for idx, name in enumerate(names):
        (y0, y1), (x0, x1) = row_bands[idx // cols], col_bands[idx % cols]
        inset = 4  # lose any anti-aliased gutter edge
        cell = img.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset))
        cell.save(out_dir / f"{name}.jpg", quality=88)
        print(f"  {folder}/{name}.jpg  {cell.size[0]}x{cell.size[1]}")


def main() -> None:
    sheet_dir = ROOT.parent.parent / "design" / "sheets"
    for sheet, (rows, cols, folder, names) in SHEETS.items():
        found = next((p for ext in ("png", "jpg", "jpeg", "webp") if (p := sheet_dir / f"{sheet}.{ext}").exists()), None)
        if not found:
            print(f"missing: sheets/{sheet}")
            continue
        print(f"{sheet}:")
        slice_sheet(found, rows, cols, folder, names)


if __name__ == "__main__":
    main()
