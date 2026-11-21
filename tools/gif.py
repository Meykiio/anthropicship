"""Turns tools/gif.ts frames into the README GIF, drawn like the terminal draws
the room: square pixels, text cells two pixels tall.

    python tools/gif.py out/frames.json media/demo.gif
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

SCALE = 8  # screen pixels per room pixel
src, dst = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding="utf-8"))
font_path = "C:/Windows/Fonts/consola.ttf"
font = ImageFont.truetype(font_path, int(SCALE * 1.75))


def rgb(hex_color):
    return tuple(int(hex_color[i : i + 2], 16) for i in (1, 3, 5))


images = []
for frame in data["frames"]:
    grid = frame["grid"]
    h, w = len(grid), len(grid[0])
    im = Image.new("RGB", (w * SCALE, h * SCALE), rgb(data["wall"]))
    d = ImageDraw.Draw(im)
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c:
                d.rectangle([x * SCALE, y * SCALE, (x + 1) * SCALE - 1, (y + 1) * SCALE - 1], fill=rgb(c))
    for m in frame["marks"]:
        row = m.get("row", 0)
        d.text((m["column"] * SCALE, row * 2 * SCALE), m["char"], font=font, fill=rgb(m["color"]))
    for o in frame["overlays"]:
        x, y = o["col"] * SCALE, o["row"] * 2 * SCALE
        n = len(o["text"])
        if o["text"] == "\u2580":
            d.rectangle([x, y, x + SCALE - 1, y + SCALE - 1], fill=rgb(o["fg"]))
            continue
        d.rectangle([x, y, x + n * SCALE - 1, y + 2 * SCALE - 1], fill=rgb(o["bg"]))
        for i, ch in enumerate(o["text"]):
            d.text((x + i * SCALE, y + 1), ch, font=font, fill=rgb(o["fg"]))
    images.append(im.convert("P", palette=Image.ADAPTIVE, colors=64))

ms = int(1000 / data["fps"])
images[0].save(dst, save_all=True, append_images=images[1:], duration=ms, loop=0, optimize=True)
print(f"wrote {dst}: {len(images)} frames")
