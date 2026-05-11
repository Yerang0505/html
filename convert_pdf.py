import fitz
from PIL import Image
import os

doc = fitz.open("정량펌프 유지관리지침서.pdf")
images = []

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    pix = page.get_pixmap()
    img_path = f"page_{page_num + 1}.png"
    pix.save(img_path)
    images.append(Image.open(img_path))

if images:
    widths, heights = zip(*(i.size for i in images))
    total_height = sum(heights)
    max_width = max(widths)
    new_im = Image.new('RGB', (max_width, total_height))
    y_offset = 0
    for im in images:
        new_im.paste(im, (0, y_offset))
        y_offset += im.height
    new_im.save('maintenance_manual.png')
    # Clean up individual pages
    for i in range(len(images)):
        os.remove(f"page_{i+1}.png")

print("Conversion complete")