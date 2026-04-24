"""
Generate a brand-safe 4:3 placeholder for an Insights card image.

Used when an AI-generated image has third-party brand contamination and
needs a deterministic, hallucination-free replacement.

Output is a 1200x900 PNG matching the site's brand palette and sysbar
aesthetic. Pure typography + geometry, no AI imagery, no fake names.

Run:
    python tools/build_insight_placeholder.py 3 "Business Development" "事業開発" 3_business_dev.png
"""
import pathlib
import sys
from PIL import Image, ImageDraw, ImageFont

# Brand palette
NAVY = (10, 22, 94)
WHITE = (255, 255, 255)
DIM_WHITE = (255, 255, 255, 150)
ACCENT = (110, 145, 230)

W, H = 1200, 900

WIN_FONTS = pathlib.Path("C:/Windows/Fonts")


def font(*names, size):
    for name in names:
        p = WIN_FONTS / name
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


JP_FONT = font("YuGothB.ttc", "meiryob.ttc", "msgothic.ttc", size=88)
EN_FONT = font("segoeuib.ttf", "arialbd.ttf", size=64)
MONO_FONT = font("consola.ttf", "cour.ttf", size=22)
SMALL_MONO = font("consola.ttf", "cour.ttf", size=18)


def build(num, en_label, jp_label, dst):
    canvas = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(canvas, mode="RGBA")

    # Subtle grid
    grid = (255, 255, 255, 12)
    for x in range(0, W, 50):
        draw.line([(x, 0), (x, H)], fill=grid, width=1)
    for y in range(0, H, 50):
        draw.line([(0, y), (W, y)], fill=grid, width=1)

    # Top edge label
    draw.text((48, 44), f"[ INSIGHT / {int(num):02d} ]", font=MONO_FONT, fill=DIM_WHITE)

    # Top-right meta
    draw.text((W - 280, 44), "GLOVERSAL  /  2026", font=MONO_FONT, fill=DIM_WHITE)

    # Geometric accent: a long horizontal line under the top label, with two dots
    draw.line([(48, 92), (260, 92)], fill=ACCENT + (200,), width=2)
    draw.ellipse([(48, 86), (60, 98)], fill=ACCENT + (220,))

    # Center: Japanese label (large)
    jp_bbox = draw.textbbox((0, 0), jp_label, font=JP_FONT)
    jp_w = jp_bbox[2] - jp_bbox[0]
    jp_h = jp_bbox[3] - jp_bbox[1]
    jp_x = (W - jp_w) // 2
    jp_y = (H - jp_h) // 2 - 60
    draw.text((jp_x, jp_y), jp_label, font=JP_FONT, fill=WHITE)

    # English label below (smaller, dimmer)
    en_bbox = draw.textbbox((0, 0), en_label.upper(), font=EN_FONT)
    en_w = en_bbox[2] - en_bbox[0]
    draw.text(
        ((W - en_w) // 2, jp_y + jp_h + 30),
        en_label.upper(),
        font=EN_FONT,
        fill=(220, 226, 245, 230),
    )

    # Divider under English label
    div_y = jp_y + jp_h + 130
    draw.rectangle([(W // 2 - 60, div_y), (W // 2 + 60, div_y + 2)], fill=ACCENT + (220,))

    # Bottom-left: schematic pattern (dotted abstract strategy diagram)
    base_y = H - 130
    nodes = [(80, base_y), (180, base_y - 30), (280, base_y + 10), (380, base_y - 20), (480, base_y + 25)]
    for (x, y) in nodes:
        draw.ellipse([(x - 6, y - 6), (x + 6, y + 6)], fill=ACCENT + (200,))
    for i in range(len(nodes) - 1):
        draw.line([nodes[i], nodes[i + 1]], fill=ACCENT + (140,), width=2)

    # Bottom-right edge label
    draw.text(
        (W - 350, H - 60),
        "STRATEGIC ADVISORY  /  EST. 2004",
        font=SMALL_MONO,
        fill=DIM_WHITE,
    )

    # Right vertical accent line
    draw.rectangle([(W - 4, 60), (W - 1, H - 60)], fill=ACCENT + (160,))

    canvas.convert("RGB").save(dst, format="PNG", optimize=True)
    print(f"  Wrote {dst}  ({W}x{H}, PNG)")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python tools/build_insight_placeholder.py <num> <en_label> <jp_label> <out_filename>")
        sys.exit(1)
    num = sys.argv[1]
    en = sys.argv[2]
    jp = sys.argv[3]
    out = pathlib.Path("site/assets/images/insights") / sys.argv[4]
    build(num, en, jp, out)
