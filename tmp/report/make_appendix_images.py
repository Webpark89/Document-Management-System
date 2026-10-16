from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT = Path(r"D:/Document Management/output/diagrams")
OUT.mkdir(parents=True, exist_ok=True)
THAI = r"C:/Windows/Fonts/LeelawUI.ttf"
THAI_BOLD = r"C:/Windows/Fonts/LeelaUIb.ttf"
MONO = r"C:/Windows/Fonts/consola.ttf"


def f(size, *, bold=False, mono=False):
    return ImageFont.truetype(MONO if mono else THAI_BOLD if bold else THAI, size)


def tx(draw, xy, value, size=33, fill="#222222", bold=False, mono=False):
    draw.text(xy, value, font=f(size, bold=bold, mono=mono), fill=fill)


def window(draw, width, height, title):
    draw.rounded_rectangle((45, 45, width - 45, height - 45), radius=17, fill="white", outline="#444444", width=3)
    draw.rounded_rectangle((45, 45, width - 45, 135), radius=17, fill="#f0f0f0", outline="#444444", width=3)
    draw.rectangle((45, 105, width - 45, 135), fill="#f0f0f0")
    for x, color in [(95, "#c7c7c7"), (135, "#c7c7c7"), (175, "#c7c7c7")]:
        draw.ellipse((x - 11, 81, x + 11, 103), fill=color, outline="#9a9a9a", width=1)
    tx(draw, (220, 69), title, 33, bold=True)


def structure():
    W, H = 2600, 1580
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    window(d, W, H, "DMS Project — โครงสร้างโฟลเดอร์")
    d.rectangle((90, 165, W - 90, 240), fill="#f8f8f8", outline="#bbbbbb", width=2)
    tx(d, (123, 183), r"D:\Document Management\dms", 37, mono=True)
    d.line((1300, 280, 1300, H - 110), fill="#bbbbbb", width=2)
    tx(d, (180, 285), "client/", 43, bold=True, mono=True)
    tx(d, (1380, 285), "server/", 43, bold=True, mono=True)
    client = [
        "src/",
        "  app/",
        "    (auth)/  login, forgot-password",
        "    (main)/",
        "      dashboard/",
        "      documents/  [id], versions",
        "      submissions/  create, history",
        "      approvals/  [id], history",
        "      admin/  master-data, config",
        "      notifications/",
        "  controllers/",
        "    services/  auth, documents, workflows",
        "    hooks/  useDocuments, useApprovals",
        "  views/",
        "    components/  forms, workflow",
        "    features/  auth, workflow",
        "    layouts/  Sidebar, Topbar",
        "  lib/  api-client, document-status",
        "package.json",
    ]
    server = [
        "src/",
        "  auth/  controller, service, guards",
        "  documents/  controller, service, dto",
        "  workflows/  controller, service, dto",
        "  users/",
        "  admin/",
        "  folders/",
        "  notifications/",
        "  dashboard/",
        "  prisma/  prisma.service.ts",
        "  common/  policy, filters, encryption",
        "  app.module.ts",
        "  main.ts",
        "prisma/",
        "  schema.prisma",
        "  seed.ts",
        "package.json",
    ]
    for lines, x in ((client, 180), (server, 1380)):
        for n, line in enumerate(lines):
            tx(d, (x, 353 + n * 56), line, 32, mono=True)
    im.save(OUT / "appendix_a1_project_structure.png", dpi=(300, 300))


def database():
    W, H = 2600, 1580
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    window(d, W, H, "schema.prisma — การตั้งค่า PostgreSQL / Prisma")
    d.rectangle((95, 175, 1940, 1160), fill="#fcfcfc", outline="#bbbbbb", width=2)
    d.rectangle((1970, 175, 2505, 1160), fill="#f8f8f8", outline="#bbbbbb", width=2)
    tx(d, (135, 205), "dms/server/prisma/schema.prisma", 34, mono=True)
    d.line((120, 260, 1910, 260), fill="#d2d2d2", width=2)
    code = [
        ("1", "generator client {"),
        ("2", '  provider = "prisma-client-js"'),
        ("3", "}"),
        ("4", ""),
        ("5", "datasource db {"),
        ("6", '  provider = "postgresql"'),
        ("7", '  url      = env("DATABASE_URL")'),
        ("8", "}"),
        ("...", ""),
        ("101", "model User { ... }"),
        ("152", "model Document { ... }"),
        ("298", "model DocumentVersion { ... }"),
        ("325", "model ApprovalMatrix { ... }"),
        ("347", "model Workflow { ... }"),
        ("364", "model WorkflowStep { ... }"),
    ]
    for n, (number, line) in enumerate(code):
        y = 285 + n * 54
        tx(d, (130, y), f"{number:>3}", 31, fill="#888888", mono=True)
        tx(d, (255, y), line, 35, fill="#252525", mono=True)
    tx(d, (2020, 215), "ข้อมูลเชื่อมต่อ", 35, bold=True)
    tx(d, (2020, 295), "server/.env", 30, mono=True)
    d.rectangle((2010, 355, 2465, 525), fill="white", outline="#999999", width=2)
    tx(d, (2030, 390), "DATABASE_URL", 31, mono=True)
    tx(d, (2030, 445), "[ปิดข้อมูลลับ]", 31)
    tx(d, (2020, 605), "ตารางหลัก", 35, bold=True)
    for n, line in enumerate(["users", "documents", "document_versions", "workflows", "workflow_steps", "approval_matrix"]):
        tx(d, (2025, 670 + n * 67), line, 29, mono=True)
    d.rectangle((95, 1200, W - 95, H - 95), fill="#f7f7f7", outline="#bbbbbb", width=2)
    tx(d, (130, 1227), "Terminal  >  npx prisma validate", 32, mono=True)
    tx(d, (130, 1295), "Prisma schema loaded from prisma\\schema.prisma", 30, mono=True)
    tx(d, (130, 1360), "The schema at prisma\\schema.prisma is valid", 32, mono=True)
    im.save(OUT / "appendix_a2_prisma_database_redacted.png", dpi=(300, 300))


def terminal_panel(draw, box, title, rows):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=12, fill="#fdfdfd", outline="#777777", width=3)
    draw.rounded_rectangle((x1, y1, x2, y1 + 90), radius=12, fill="#ededed", outline="#777777", width=3)
    draw.rectangle((x1, y1 + 68, x2, y1 + 90), fill="#ededed")
    tx(draw, (x1 + 40, y1 + 22), title, 35, bold=True)
    for n, (line, color) in enumerate(rows):
        tx(draw, (x1 + 47, y1 + 145 + n * 70), line, 33, fill=color, mono=True)


def startup_example():
    W, H = 2600, 1550
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    window(d, W, H, "ตัวอย่างคำสั่งเริ่ม Frontend และ Backend")
    tx(d, (103, 176), "ภาพตัวอย่างรูปแบบผลลัพธ์เมื่อเตรียมฐานข้อมูลและไฟล์ตั้งค่าเรียบร้อย", 35)
    terminal_panel(d, (85, 280, 1260, 1215), "Backend — NestJS", [
        (r"D:\dms> npm run dev:server", "#222222"),
        ("Starting compilation in watch mode...", "#444444"),
        ("Found 0 errors.", "#226b3b"),
        ("Nest application successfully started", "#226b3b"),
        ("Local: http://localhost:4000/api", "#222222"),
        ("Swagger: http://localhost:4000/api/docs", "#222222"),
    ])
    terminal_panel(d, (1340, 280, 2515, 1215), "Frontend — Next.js", [
        (r"D:\dms> npm run dev:client", "#222222"),
        ("Next.js 16 (Turbopack)", "#444444"),
        ("Local: http://localhost:3000", "#222222"),
        ("Ready", "#226b3b"),
        ("Open browser at localhost:3000", "#222222"),
    ])
    d.rectangle((85, 1285, W - 85, H - 100), fill="#f7f7f7", outline="#b5b5b5", width=2)
    tx(d, (120, 1327), "ตัวอย่างภาพประกอบคำสั่งเริ่มระบบ — ไม่ใช่ภาพบันทึกผลการรันจริง", 35)
    im.save(OUT / "appendix_a3_startup_example.png", dpi=(300, 300))


if __name__ == "__main__":
    structure()
    database()
    startup_example()
    for name in ["appendix_a1_project_structure.png", "appendix_a2_prisma_database_redacted.png", "appendix_a3_startup_example.png"]:
        path = OUT / name
        print(path, path.stat().st_size)
