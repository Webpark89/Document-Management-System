from __future__ import annotations

from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"D:/Document Management")
SOURCE = Path(r"C:/Users/LeP52ExPower/Desktop/รายงานสหกิจศึกษา_Document_Management_System_ธนภัทร.docx")
OUTPUT = ROOT / "output/documents/รายงานสหกิจศึกษา_DMS_ธนภัทร_แก้_ER_22_ตาราง.docx"
PNG = ROOT / "output/diagrams/08_er_prisma_22_tables.png"
THAI = r"C:/Windows/Fonts/LeelawUI.ttf"
THAI_BOLD = r"C:/Windows/Fonts/LeelaUIb.ttf"
LATIN = r"C:/Windows/Fonts/arial.ttf"
LATIN_BOLD = r"C:/Windows/Fonts/arialbd.ttf"

groups = [
    ("ข้อมูลหลัก ผู้ใช้ และสิทธิ์", [
        ("departments", "PK id  |  name", "← users, pr_forms, folders"),
        ("positions", "PK id  |  name", "← users"),
        ("roles", "PK id  |  name", "← users, approval_matrix"),
        ("permissions", "PK id  |  module, action", "← role_permissions"),
        ("role_permissions", "PK role_id + permission_id", "FK → roles, permissions"),
        ("users", "PK id  |  username, email", "FK → departments, positions, roles"),
        ("document_types", "PK id  |  type_name, prefix", "← documents, approval_matrix"),
    ]),
    ("เอกสารและแบบฟอร์ม", [
        ("documents", "PK id  |  doc_number, status", "FK → document_types, users, folders"),
        ("document_versions", "PK id  |  version_number", "FK → documents, users"),
        ("pr_forms", "PK id  |  document_id (UQ)", "FK → documents, users, departments"),
        ("pr_form_items", "PK id  |  item_name, quantity", "FK → pr_forms"),
        ("po_forms", "PK id  |  document_id (UQ)", "FK → documents"),
        ("po_form_items", "PK id  |  item_name, quantity", "FK → po_forms"),
        ("bk_forms", "PK id  |  document_id (UQ)", "FK → documents, departments"),
    ]),
    ("การอนุมัติและข้อมูลประกอบ", [
        ("approval_matrix", "PK id  |  step_order", "FK → document_types, roles"),
        ("workflows", "PK id  |  document_id (UQ)", "FK → documents"),
        ("workflow_steps", "PK id  |  step_order, status", "FK → workflows, users"),
        ("folders", "PK id  |  name, parent_id", "FK → folders, users, departments"),
        ("folder_permissions", "PK id  |  can_view, can_edit", "FK → folders, users, departments"),
        ("notifications", "PK id  |  message, is_read", "FK → users, documents"),
        ("running_numbers", "PK id  |  current_number", "FK → document_types"),
        ("audit_logs", "PK id  |  action", "FK → users"),
    ]),
]

def font(path: str, size: int):
    return ImageFont.truetype(path, size)

def make_image() -> bytes:
    w, h = 2760, 1800
    im = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(im)
    black = "#222222"
    faint = "#777777"
    d.text((w//2, 44), "ER Diagram ระบบ DMS", font=font(THAI_BOLD, 68), fill=black, anchor="mt")
    d.text((w//2, 118), "22 ตารางจาก Prisma Schema ปัจจุบัน  |  PK = Primary Key, FK = Foreign Key, UQ = Unique", font=font(THAI, 32), fill=black, anchor="mt")
    margin, gap = 56, 30
    col_w = (w - 2*margin - 2*gap)//3
    y_top, y_bottom = 204, 1742
    for i, (heading, cards) in enumerate(groups):
        x0 = margin + i*(col_w+gap)
        x1 = x0 + col_w
        d.rectangle((x0, y_top, x1, y_bottom), outline=black, width=3)
        d.rectangle((x0, y_top, x1, y_top+83), fill="#f1f1f1", outline=black, width=3)
        d.text(((x0+x1)//2, y_top+40), heading, font=font(THAI_BOLD, 39), fill=black, anchor="mm")
        available = y_bottom - (y_top+105) - 22
        gap_y = 17
        card_h = (available - gap_y*(len(cards)-1)) // len(cards)
        for j, (name, fields, relation) in enumerate(cards):
            y0 = y_top + 105 + j*(card_h+gap_y)
            y1 = y0 + card_h
            cx0, cx1 = x0+26, x1-26
            d.rectangle((cx0, y0, cx1, y1), outline=black, width=2)
            header_h = min(57, int(card_h*.39))
            d.rectangle((cx0, y0, cx1, y0+header_h), fill="#e9e9e9", outline=black, width=2)
            d.text((cx0+18, y0+header_h//2), name, font=font(LATIN_BOLD, 39), fill=black, anchor="lm")
            text_size = 30 if len(fields) < 35 else 27
            rel_size = 29 if len(relation) < 36 else 26
            d.text((cx0+18, y0+header_h+18), fields, font=font(LATIN, text_size), fill=black, anchor="lt")
            d.text((cx0+18, y1-17), relation, font=font(LATIN, rel_size), fill=faint, anchor="lb")
    PNG.parent.mkdir(parents=True, exist_ok=True)
    im.save(PNG, dpi=(300,300), optimize=True)
    data = PNG.read_bytes()
    assert Image.open(BytesIO(data)).size == (2760,1800)
    return data

def replace_image(png: bytes) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(SOURCE, "r") as zin, ZipFile(OUTPUT, "w") as zout:
        target = "word/media/image9.png"
        assert target in zin.namelist()
        for item in zin.infolist():
            data = png if item.filename == target else zin.read(item.filename)
            zout.writestr(item, data)
    with ZipFile(SOURCE) as src, ZipFile(OUTPUT) as dst:
        assert src.namelist() == dst.namelist()
        changed = [n for n in src.namelist() if src.read(n) != dst.read(n)]
        assert changed == ["word/media/image9.png"], changed
    print(OUTPUT)
    print(PNG)

if __name__ == "__main__":
    replace_image(make_image())
