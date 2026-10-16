from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

d = Path(r"D:/Document Management/tmp/report")
files = sorted(d.glob("page-*.png"))
for j in range(0, len(files), 6):
    sheet = Image.new("RGB", (1860, 1800), "#dddddd")
    draw = ImageDraw.Draw(sheet)
    for i, path in enumerate(files[j:j+6]):
        x, y = (i % 3) * 620, (i // 3) * 900
        im = ImageOps.contain(Image.open(path), (620, 870))
        sheet.paste(im, (x, y + 25))
        draw.text((x + 5, y + 3), path.stem, fill="black")
    sheet.save(d / f"contact-{j//6+1}.png")
