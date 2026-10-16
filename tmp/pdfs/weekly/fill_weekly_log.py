from __future__ import annotations

import copy
import unicodedata
from datetime import date, timedelta
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(r"D:/Document Management")
SOURCE = Path(r"C:/Users/LeP52ExPower/Desktop/บันทึกการปฏิบัติงาน-รายสัปดาห์.pdf")
OUT = ROOT / "output/pdf/ร่างบันทึกการปฏิบัติงานรายสัปดาห์_ธนภัทร_17_สัปดาห์.pdf"
TEXT = ROOT / "output/pdf/ข้อความบันทึกรายสัปดาห์_ธนภัทร.txt"
FONT = r"C:/Windows/Fonts/LeelawUI.ttf"
SCALE = 4

# Suggested wording follows the four work items and their order in Form 06.
WEEKS = [
    ["ศึกษากระบวนการทำงานของบริษัทและ",
     "ความต้องการระบบจัดการและติดตามลีด",
     "สำหรับฝ่ายขาย กำหนดขอบเขตข้อมูลลูกค้า",
     "สถานะลีด และขั้นตอนการติดตามงาน"],
    ["ออกแบบหน้าจอและโครงสร้างข้อมูลของ",
     "ระบบติดตามลีด พัฒนาส่วนบันทึกและแก้ไข",
     "ข้อมูลลูกค้าและลีด พร้อมหน้ารายการ",
     "และการค้นหาข้อมูล"],
    ["พัฒนาการปรับสถานะและติดตามลีด",
     "บันทึกกิจกรรมการติดต่อและรายละเอียด",
     "ที่เกี่ยวข้อง เชื่อมต่อหน้าจอกับบริการข้อมูล",
     "และตรวจสอบประวัติการติดตามงาน"],
    ["ทดสอบระบบติดตามลีดในขั้นตอนเพิ่ม",
     "แก้ไข ค้นหา และติดตามสถานะ ปรับปรุง",
     "หน้าจอและความถูกต้องของข้อมูล",
     "พร้อมสรุปผลและส่งมอบงานที่ได้รับมอบหมาย"],
    ["ช่วยพัฒนา Frontend เว็บไซต์บริษัท Webpark",
     "จัดวางหน้าแสดงข้อมูลบริษัทและบริการ",
     "ปรับรูปแบบให้รองรับหลายขนาดหน้าจอ",
     "และตรวจสอบการแสดงผลบนอุปกรณ์ต่าง ๆ"],
    ["ช่วยพัฒนา Frontend ระบบจัดการรายงาน",
     "การประชุม จัดทำหน้ารายการ รายละเอียด",
     "และแบบบันทึกข้อมูล เชื่อมต่อ API",
     "พร้อมทดสอบการแสดงผลและการใช้งาน"],
    ["ศึกษาความต้องการระบบจัดการเอกสาร DMS",
     "วิเคราะห์บทบาทผู้ใช้งานและแบบฟอร์ม",
     "PR, PO และ BK ออกแบบฐานข้อมูล",
     "และกระบวนการส่งเอกสารเพื่ออนุมัติ"],
    ["จัดโครงสร้าง Frontend และ Backend",
     "ด้วย Next.js และ NestJS เชื่อมต่อ Prisma",
     "กับ PostgreSQL จัดทำข้อมูลผู้ใช้และสิทธิ์",
     "พร้อมพัฒนาการเข้าสู่ระบบ"],
    ["พัฒนาการสร้างเอกสารร่างและแบบฟอร์ม",
     "PR, PO และ BK รวมถึงการอัปโหลด PDF",
     "จัดทำ API บันทึกข้อมูล ออกเลขเอกสาร",
     "และจัดเก็บเวอร์ชันเอกสาร"],
    ["พัฒนาศูนย์เอกสารและหน้ารายละเอียด",
     "เพิ่มการค้นหาและกรองข้อมูล จัดการ",
     "โฟลเดอร์และขอบเขตการมองเห็นเอกสาร",
     "พร้อมตรวจสอบการเชื่อมต่อข้อมูล"],
    ["พัฒนา Approval Matrix และการส่งอนุมัติ",
     "สร้าง Workflow และขั้นตอนอนุมัติ",
     "จัดทำรายการเอกสารที่รอพิจารณา",
     "และการติดตามสถานะของเอกสาร"],
    ["พัฒนาการอนุมัติ ไม่อนุมัติ และส่งกลับ",
     "เอกสารเพื่อแก้ไข ตรวจสอบสิทธิ์และลำดับ",
     "ผู้อนุมัติ บันทึกผลแต่ละขั้น และปรับสถานะ",
     "ให้สอดคล้องกับกระบวนการทำงาน"],
    ["พัฒนาการจัดเก็บลายเซ็นแบบเข้ารหัส",
     "และการกำหนดตำแหน่งลายเซ็นบน PDF",
     "สร้างเวอร์ชันเอกสารหลังการอนุมัติ",
     "พร้อมทดสอบความถูกต้องของไฟล์ผลลัพธ์"],
    ["พัฒนาการแจ้งเตือนและบันทึก Audit Log",
     "จัดทำหน้าภาพรวมระบบและหน้าผู้ดูแล",
     "สำหรับจัดการผู้ใช้ สิทธิ์ ประเภทเอกสาร",
     "และการตั้งค่าลำดับผู้อนุมัติ"],
    ["ทดสอบการทำงานของ DMS ตั้งแต่สร้าง",
     "เอกสาร PR, PO, BK และ PDF จนอนุมัติ",
     "ตรวจสอบสิทธิ์ การมองเห็น และเวอร์ชัน",
     "พร้อมปรับปรุงความถูกต้องของระบบ"],
    ["ทดสอบการใช้งานร่วมกับผู้เกี่ยวข้องและ",
     "ปรับปรุงตามข้อเสนอแนะ ตรวจสอบโครงสร้าง",
     "ฐานข้อมูลทั้ง 22 ตาราง จัดทำคู่มือใช้งาน",
     "และรวบรวมเนื้อหารายงานสหกิจศึกษา"],
    ["ตรวจสอบระบบรอบสุดท้ายและสรุปผลทดสอบ",
     "จัดเตรียมซอร์สโค้ด โครงสร้างฐานข้อมูล",
     "คู่มือและรายงาน สาธิตการใช้งาน DMS",
     "และส่งมอบงานให้พนักงานที่ปรึกษา"],
]

MONTHS = {6: "มิถุนายน", 7: "กรกฎาคม", 8: "สิงหาคม", 9: "กันยายน", 10: "ตุลาคม"}

def date_label(start, end):
    if start.month == end.month:
        return f"{start.day} - {end.day} {MONTHS[start.month]} 2569"
    return f"{start.day} {MONTHS[start.month]} - {end.day} {MONTHS[end.month]} 2569"

def font(size):
    return ImageFont.truetype(FONT, round(size * SCALE))

def write(draw, x, top, text, size=12.4, max_width=None, center=False):
    f = font(size)
    width = draw.textlength(text, font=f) / SCALE
    if max_width is not None and width > max_width:
        # Date labels occasionally need two lines; do not silently shrink body text.
        raise ValueError(f"Text exceeds {max_width}: {text} ({width})")
    if center:
        x -= width / 2
    draw.text((round(x*SCALE), round(top*SCALE)), text, font=f, fill=(0,0,0,255), anchor="lt")

def wrap(draw, text, size, width):
    f = font(size)
    result=[]
    line=""
    clusters=[]
    for char in text:
        if clusters and unicodedata.category(char).startswith("M"):
            clusters[-1]+=char
        else:
            clusters.append(char)
    for cluster in clusters:
        if line and draw.textlength(line+cluster,font=f)>width*SCALE:
            result.append(line.rstrip())
            line=cluster.lstrip()
        else:
            line+=cluster
    if line:result.append(line)
    return result

def main():
    reader=PdfReader(SOURCE)
    writer=PdfWriter()
    starts=[date(2026,6,22)+timedelta(weeks=i) for i in range(17)]
    date_text=[date_label(d,d+timedelta(days=4)) for d in starts]
    OUT.parent.mkdir(parents=True,exist_ok=True)
    text_lines=["ร่างข้อความบันทึกการปฏิบัติงานสหกิจศึกษารายสัปดาห์",
                "นายธนภัทร ชูสุวรรณ รหัสนิสิต 6521601857",
                "อาจารย์ที่ปรึกษา: อาจารย์พิชยภรณ์ พงศกรรังศิลป์",
                "ภาคการศึกษา 1/2569",
                "ช่วงปฏิบัติงาน 22 มิถุนายน - 16 ตุลาคม 2569",
                "เรียบเรียงตามลำดับหัวข้องานในใบ 06 สำหรับตรวจทานและกรอกแบบฟอร์ม", ""]
    for i,lines in enumerate(WEEKS):
        text_lines += [f"สัปดาห์ที่ {i+1}: {date_text[i]}"," ".join(lines),""]
    TEXT.write_text("\n".join(text_lines),encoding="utf-8-sig")
    for i,original in enumerate(reader.pages):
        page=copy.deepcopy(original)
        x0,y0=float(page.mediabox.left),float(page.mediabox.bottom)
        w,h=float(page.mediabox.width),float(page.mediabox.height)
        page.add_transformation(Transformation().translate(-x0,-y0))
        page.mediabox=RectangleObject([0,0,w,h])
        page.cropbox=RectangleObject([0,0,w,h])
        im=Image.new("RGBA",(round(w*SCALE),round(h*SCALE)),(255,255,255,0))
        draw=ImageDraw.Draw(im)
        if i==0:
            def header_value(x1,y1,x2,y2,value,size=12.2):
                draw.rectangle((x1*SCALE,y1*SCALE,x2*SCALE,y2*SCALE),fill="white")
                write(draw,x1+2,y1-1,value,size,max_width=x2-x1-3)
            header_value(154,82,399,96,"นายธนภัทร ชูสุวรรณ")
            header_value(445,82,563,96,"6521601857")
            header_value(685,82,760,96,"1/2569")
            write(draw,536,106.5,"อาจารย์ที่ปรึกษา: พิชยภรณ์ พงศกรรังศิลป์",10.7,max_width=280)
            header_value(116,129,425,143,"บริษัท Webpark")
            header_value(478,129,588,143,"22 มิถุนายน 2569",10.7)
            header_value(637,129,760,143,"16 ตุลาคม 2569",10.7)
        # Source PDF coordinates are normalized above to a zero origin.
        row_top=170.5945 if i==0 else (123.7945 if i==1 else 100.3945)
        indices=list(range(i*3,min(i*3+3,16)))
        if i==5:
            indices=[15,16]
        for j,week in enumerate(indices):
            top=row_top+117*j
            dtext=date_text[week]
            dlines=wrap(draw,dtext,11.6,184)
            for k,line in enumerate(dlines):
                write(draw,175,top+12+18*k,line,11.6,184,center=True)
            detail=[]
            for line in WEEKS[week]:
                detail+=wrap(draw,line,12.3,286)
            assert len(detail)<=5,(week+1,detail)
            for k,line in enumerate(detail):
                write(draw,284,top+12+18*k,line,12.3,286)
            if week==16:
                write(draw,46,top+9,"17",11.0,center=True)
        stream=BytesIO()
        c=canvas.Canvas(stream,pagesize=(w,h))
        c.drawImage(ImageReader(im),0,0,width=w,height=h,mask="auto")
        if i==5:
            # Add the seventeenth week within the unused area of the final form page.
            c.setLineWidth(.7)
            left,right=16.9685,825.1685
            y_start,y_end=217.3945,334.3945
            for x in [left,75.2685,274.3685,580.3685,710.2685,right]:
                c.line(x,h-y_start,x,h-y_end)
            c.line(left,h-y_end,right,h-y_end)
        c.save()
        stream.seek(0)
        page.merge_page(PdfReader(stream).pages[0])
        writer.add_page(page)
    writer.add_metadata({"/Title":"ร่างบันทึกการปฏิบัติงานสหกิจศึกษา 17 สัปดาห์", "/Author":"ธนภัทร ชูสุวรรณ"})
    with OUT.open("wb") as out:
        writer.write(out)
    final=PdfReader(OUT)
    assert len(final.pages)==6
    print(OUT)
    print(TEXT)

if __name__=="__main__":
    main()
