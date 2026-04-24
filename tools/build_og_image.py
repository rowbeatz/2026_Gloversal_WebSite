"""
Build a brand-safe 1200x630 OG image for Gloversal, Inc.

No AI image generation — fully deterministic typography on a navy canvas
matching the site's brand palette. Avoids the hallucinated-third-party-brand
risk of generative imagery.

Output: site/assets/images/gloversal-og.png

Run: python tools/build_og_image.py
"""
import pathlib
from PIL import Image, ImageDraw, ImageFont

DST = pathlib.Path("site/assets/images/gloversal-og.png")
W, H = 1200, 630

# Brand palette (matches css/tokens.css)
NAVY = (10, 22, 94)          # #0A165E
WHITE = (255, 255, 255)
DIM_WHITE = (255, 255, 255, 140)
ACCENT = (110, 145, 230)     # subtle electric-blue accent

# ---------------------------------------------------------------------------
# Font discovery (Windows fallbacks; degrades gracefully if anything missing).
# ---------------------------------------------------------------------------
WIN_FONTS = pathlib.Path("C:/Windows/Fonts")


def font(*names, size):
    for name in names:
        p = WIN_FONTS / name
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


WORDMARK_FONT = font("segoeuib.ttf", "arialbd.ttf", size=148)
TAGLINE_FONT = font("segoeui.ttf", "arial.ttf", size=32)
MONO_FONT = font("consola.ttf", "cour.ttf", size=18)
URL_FONT = font("segoeui.ttf", "arial.ttf", size=22)

# ---------------------------------------------------------------------------
# Canvas
# ---------------------------------------------------------------------------
canvas = Image.new("RGB", (W, H), NAVY)
draw = ImageDraw.Draw(canvas, mode="RGBA")

# Subtle grid (matches site's page-hero__grid-bg aesthetic)
grid_color = (255, 255, 255, 14)  # ~5% white
grid_step = 40
for x in range(0, W, grid_step):
    draw.line([(x, 0), (x, H)], fill=grid_color, width=1)
for y in range(0, H, grid_step):
    draw.line([(0, y), (W, y)], fill=grid_color, width=1)

# Vertical accent line on the right
draw.rectangle([(W - 4, 60), (W - 1, H - 60)], fill=ACCENT + (180,))

# Top-left edge label
draw.text((48, 48), "[ GLV_CORE / 2026 ]", font=MONO_FONT, fill=DIM_WHITE)

# Top-right "● LIVE" indicator
draw.ellipse([(W - 190, 54), (W - 178, 66)], fill=(0, 220, 130, 230))
draw.text((W - 170, 48), "TOKYO / GLOBAL", font=MONO_FONT, fill=DIM_WHITE)

# Centerpiece: Wordmark
wm_text = "Gloversal"
bbox = draw.textbbox((0, 0), wm_text, font=WORDMARK_FONT)
wm_w = bbox[2] - bbox[0]
wm_h = bbox[3] - bbox[1]
wm_x = (W - wm_w) // 2
wm_y = (H - wm_h) // 2 - 60
draw.text((wm_x, wm_y), wm_text, font=WORDMARK_FONT, fill=WHITE)

# Trademark-style superscript
sup_y = wm_y + 10
sup_x = wm_x + wm_w + 6
sup_font = font("segoeui.ttf", size=42)
draw.text((sup_x, sup_y), "™", font=sup_font, fill=(255, 255, 255, 200))

# Tagline
tag = "Healthcare Strategy  ·  Medical Technology  ·  Execution"
tb = draw.textbbox((0, 0), tag, font=TAGLINE_FONT)
tag_w = tb[2] - tb[0]
draw.text(
    ((W - tag_w) // 2, wm_y + wm_h + 40),
    tag,
    font=TAGLINE_FONT,
    fill=(220, 226, 245, 255),
)

# Thin horizontal divider under tagline
div_y = wm_y + wm_h + 105
draw.rectangle([(W // 2 - 80, div_y), (W // 2 + 80, div_y + 2)], fill=ACCENT + (220,))

# Bottom row: URL + descriptor
draw.text((48, H - 64), "gloversal.com", font=URL_FONT, fill=WHITE)
draw.text(
    (W - 380, H - 60),
    "STRATEGIC ADVISORY  /  EST. 2004",
    font=MONO_FONT,
    fill=DIM_WHITE,
)

# Save (PIL needs RGB for clean PNG output)
canvas.convert("RGB").save(DST, format="PNG", optimize=True)
print(f"  Wrote {DST} ({W}x{H}, PNG)")
