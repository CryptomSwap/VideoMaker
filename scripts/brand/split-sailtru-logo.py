"""Split Sailtru lockup into hull (brand blues) + mono mask (sail + wordmark)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "brand" / "sailtru-logo-source.jpg"
OUT_DIR = ROOT / "public" / "brand"


def is_hull(r: int, g: int, b: int) -> bool:
    return b >= 70 and b > r + 12 and b > g + 5


def is_mono(r: int, g: int, b: int) -> bool:
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    return luma >= 175 and not is_hull(r, g, b)


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    hull = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mono = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    src_px = im.load()
    hull_px = hull.load()
    mono_px = mono.load()

    for y in range(h):
        for x in range(w):
            r, g, b, _a = src_px[x, y]
            luma = 0.299 * r + 0.587 * g + 0.114 * b
            if luma < 18:
                continue
            if is_hull(r, g, b):
                hull_px[x, y] = (r, g, b, 255)
            elif is_mono(r, g, b):
                mono_px[x, y] = (255, 255, 255, 255)

    union = hull.getbbox()
    mb = mono.getbbox()
    if not union or not mb:
        raise SystemExit("empty layer")
    union = (
        min(union[0], mb[0]),
        min(union[1], mb[1]),
        max(union[2], mb[2]),
        max(union[3], mb[3]),
    )
    pad = 8
    cw = union[2] - union[0] + pad * 2
    ch = union[3] - union[1] + pad * 2
    ox, oy = union[0] - pad, union[1] - pad

    for name, layer in (
        ("sailtru-logo-hull.png", hull),
        ("sailtru-logo-mono-mask.png", mono),
    ):
        canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        canvas.paste(layer.crop(union), (pad, pad), layer.crop(union))
        out = OUT_DIR / name
        canvas.save(out, optimize=True)
        print("wrote", out, canvas.size)


if __name__ == "__main__":
    main()
