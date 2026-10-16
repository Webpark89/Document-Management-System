from pathlib import Path

from PIL import Image, ImageDraw

from make_diagrams import arrow, label


OUT = Path(r"D:/Document Management/output/diagrams/03_architecture_dms.png")
W, H = 2800, 1700
im = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(im)


def panel(x1, x2, title, technology, items):
    y1, y2 = 315, 1430
    d.rectangle((x1, y1, x2, y2), outline="#222222", width=4)
    d.rectangle((x1, y1, x2, 435), outline="#222222", width=4, fill="#efefef")
    label(d, ((x1 + x2) / 2, 358), title, 41, bold=True)
    label(d, ((x1 + x2) / 2, 404), technology, 29)
    top = 485
    gap = 195 if len(items) == 4 else 160
    height = 125
    for n, (heading, detail) in enumerate(items):
        cy = top + n * gap + height / 2
        d.rectangle((x1 + 42, cy - height / 2, x2 - 42, cy + height / 2), outline="#333333", width=3)
        label(d, ((x1 + x2) / 2, cy - 20), heading, 34, bold=True)
        label(d, ((x1 + x2) / 2, cy + 28), detail, 27)


d.rectangle((65, 60, W - 65, H - 65), outline="#222222", width=4)
d.line((65, 225, W - 65, 225), fill="#222222", width=4)
label(d, (W / 2, 140), "สถาปัตยกรรมระบบจัดการเอกสาร DMS", 54, bold=True)

panel(160, 825, "เว็บส่วนหน้า (Frontend)", "Next.js 16 · React 19 · TypeScript", [
    ("เข้าสู่ระบบและแดชบอร์ด", "แสดงข้อมูลตามบทบาท"),
    ("สร้างและค้นหาเอกสาร", "PR / PO / BK / PDF"),
    ("รายการอนุมัติ", "พิจารณาและติดตามสถานะ"),
    ("หน้าจัดการระบบ", "ผู้ใช้ ประเภท และลำดับอนุมัติ"),
])
panel(985, 1835, "บริการ API (Backend)", "NestJS 11 · REST API · JWT", [
    ("Auth และ Users", "ยืนยันตัวตนและตรวจสิทธิ์"),
    ("Documents", "ออกเลข บันทึกร่าง และเวอร์ชัน"),
    ("Workflows", "Approval Matrix และขั้นอนุมัติ"),
    ("PDF และ Notifications", "ลงลายเซ็นและแจ้งเตือน"),
    ("Prisma Client", "อ่านและเขียนข้อมูลธุรกรรม"),
])
panel(1995, 2640, "ฐานข้อมูล (Database)", "PostgreSQL · Prisma Schema", [
    ("ข้อมูลผู้ใช้", "Users / Roles / Permissions"),
    ("ข้อมูลเอกสาร", "Documents / Versions"),
    ("กระบวนการอนุมัติ", "Workflows / Steps / Matrix"),
    ("ข้อมูลประกอบ", "Notifications / Audit Logs"),
])

arrow(d, [(825, 870), (985, 870)], width=4, head=20)
label(d, (905, 822), "HTTPS / JSON", 24)
arrow(d, [(985, 1070), (825, 1070)], width=3, head=18, dash=True)
label(d, (905, 1115), "ผลตอบกลับ", 25)
arrow(d, [(1835, 1250), (1995, 1250)], width=4, head=20)
label(d, (1915, 1202), "Prisma", 25)
arrow(d, [(1995, 1360), (1835, 1360)], width=3, head=18, dash=True)
label(d, (1915, 1397), "ข้อมูล", 25)

d.line((65, 1515, W - 65, 1515), fill="#555555", width=2)
label(d, (W / 2, 1575), "ผู้ใช้ส่งคำขอจากเว็บ โดย API ประมวลผลและ Prisma บันทึกข้อมูลใน PostgreSQL", 31)
im.save(OUT, dpi=(300, 300))
print(OUT)
