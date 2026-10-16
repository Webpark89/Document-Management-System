from __future__ import annotations

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"D:/Document Management/output/diagrams")
OUT.mkdir(parents=True, exist_ok=True)
THAI = r"C:/Windows/Fonts/LeelawUI.ttf"
THAI_BOLD = r"C:/Windows/Fonts/LeelaUIb.ttf"
LATIN = r"C:/Windows/Fonts/arial.ttf"


def font(size, bold=False, latin=False):
    return ImageFont.truetype(LATIN if latin else THAI_BOLD if bold else THAI, size)


def label(draw, xy, value, size=35, fill="#151515", bold=False, spacing=7):
    lines = value.split("\n")
    f = font(size, bold)
    heights = [draw.textbbox((0, 0), line, font=f)[3] - draw.textbbox((0, 0), line, font=f)[1] for line in lines]
    total = sum(heights) + (len(lines)-1)*spacing
    y = xy[1] - total/2
    for line, height in zip(lines, heights):
        draw.text((xy[0], y), line, font=f, fill=fill, anchor="mt")
        y += height + spacing


def arrow(draw, points, fill="#222222", width=4, head=18, dash=False):
    if dash:
        for start, end in zip(points, points[1:]):
            dx, dy = end[0]-start[0], end[1]-start[1]
            distance = math.hypot(dx, dy)
            steps = int(distance//22)
            for i in range(0, steps, 2):
                p1 = (start[0]+dx*i/max(steps,1), start[1]+dy*i/max(steps,1))
                p2 = (start[0]+dx*min(i+1,steps)/max(steps,1), start[1]+dy*min(i+1,steps)/max(steps,1))
                draw.line([p1,p2], fill=fill, width=width)
    else:
        draw.line(points, fill=fill, width=width, joint="curve")
    a, b = points[-2], points[-1]
    ang = math.atan2(b[1]-a[1], b[0]-a[0])
    left = (b[0]-head*math.cos(ang)+head*.58*math.sin(ang), b[1]-head*math.sin(ang)-head*.58*math.cos(ang))
    right = (b[0]-head*math.cos(ang)-head*.58*math.sin(ang), b[1]-head*math.sin(ang)+head*.58*math.cos(ang))
    draw.polygon([b,left,right], fill=fill)


def process(draw, cx, cy, w, h, text, size=35, rounded=False, fill="white", outline="#222222"):
    box = (cx-w/2, cy-h/2, cx+w/2, cy+h/2)
    if rounded:
        draw.rounded_rectangle(box, radius=h/2, fill=fill, outline=outline, width=3)
    else:
        draw.rectangle(box, fill=fill, outline=outline, width=3)
    label(draw, (cx,cy), text, size=size, fill=outline)


def diamond(draw, cx, cy, w, h, text, size=31):
    pts = [(cx,cy-h/2),(cx+w/2,cy),(cx,cy+h/2),(cx-w/2,cy)]
    draw.polygon(pts, fill="white", outline="#222222", width=3)
    label(draw,(cx,cy),text,size=size)


def flow_frame(draw, W, H, title, left, right):
    draw.rectangle((85,70,W-85,H-70),outline="#222222",width=3)
    draw.line((85,195,W-85,195),fill="#222222",width=3)
    draw.line((85,260,W-85,260),fill="#222222",width=3)
    draw.line((W//2,195,W//2,H-70),fill="#222222",width=3)
    label(draw,(W//2,128),title,42,bold=True)
    label(draw,(W//4,228),left,33)
    label(draw,(W*3//4,228),right,33)


def as_is_to_be():
    W,H=2100,1800
    im=Image.new("RGB",(W,H),"white")
    d=ImageDraw.Draw(im)
    d.rectangle((65,60,W-65,H-65),outline="#222222",width=3)
    d.line((65,190,W-65,190),fill="#222222",width=3)
    d.line((65,275,W-65,275),fill="#222222",width=3)
    d.line((W//2,190,W//2,H-65),fill="#222222",width=3)
    label(d,(W//2,125),"ภาพรวมกระบวนการจัดการเอกสาร",48,bold=True)
    label(d,(W//4,232),"กระบวนการเดิม (As-Is)",39,bold=True)
    label(d,(W*3//4,232),"กระบวนการใหม่ (To-Be)",39,bold=True)
    left_x,right_x=525,1575
    ys=[400,675,950,1225,1500]
    old=[
        "จัดทำเอกสารด้วยไฟล์\nหรือกระดาษ",
        "ส่งเรื่องอนุมัติผ่านขั้นตอน\nที่แยกจากแหล่งเก็บเอกสาร",
        "ติดตามผลและสถานะ\nจากหลายช่องทาง",
        "จัดเก็บไฟล์และข้อมูล\nกระจายหลายแห่ง",
        "ค้นหาและตรวจประวัติ\nย้อนหลังได้ยาก",
    ]
    new=[
        "สร้างหรืออัปโหลดเอกสาร\nในระบบ DMS",
        "บันทึกร่าง ออกเลขเอกสาร\nและเก็บเวอร์ชัน",
        "ส่งอนุมัติตามลำดับ\nใน Approval Matrix",
        "พิจารณาและลงลายเซ็น\nพร้อมบันทึกผลแต่ละขั้น",
        "ค้นหา ติดตามสถานะ\nและดูประวัติย้อนหลัง",
    ]
    for x,items in ((left_x,old),(right_x,new)):
        for y,value in zip(ys,items):
            process(d,x,y,760,132,value,size=36)
        for a,b in zip(ys,ys[1:]):
            arrow(d,[(x,a+66),(x,b-66)])
    im.save(OUT/"01_as_is_to_be.png",dpi=(300,300))


def stick_actor(draw,x,y,name):
    draw.ellipse((x-30,y-105,x+30,y-45),outline="#222222",width=4)
    draw.line((x,y-45,x,y+40),fill="#222222",width=4)
    draw.line((x-62,y-5,x+62,y-5),fill="#222222",width=4)
    draw.line((x,y+40,x-58,y+112),fill="#222222",width=4)
    draw.line((x,y+40,x+58,y+112),fill="#222222",width=4)
    label(draw,(x,y+158),name,36,bold=True)


def use_case():
    W,H=2400,1950
    im=Image.new("RGB",(W,H),"white")
    d=ImageDraw.Draw(im)
    d.rectangle((500,90,1900,1870),outline="#222222",width=3)
    label(d,(1200,150),"ระบบจัดการเอกสาร DMS",46,bold=True)
    creator=(235,565)
    approver=(235,1410)
    admin=(2165,760)
    stick_actor(d,*creator,"ผู้สร้างเอกสาร")
    stick_actor(d,*approver,"ผู้อนุมัติ")
    stick_actor(d,*admin,"ผู้ดูแลระบบ")
    left_x,right_x=930,1520
    left_cases=[
        (355,"เข้าสู่ระบบ"),
        (575,"สร้างและแก้ไข\nเอกสารร่าง"),
        (795,"ส่งเอกสาร\nขออนุมัติ"),
        (1015,"ค้นหาและติดตาม\nสถานะเอกสาร"),
        (1235,"เปิดรายการ\nรออนุมัติ"),
        (1455,"อนุมัติ ปฏิเสธ\nหรือส่งกลับ"),
        (1675,"ลงลายเซ็น\nบนเอกสาร PDF"),
    ]
    right_cases=[
        (445,"จัดการผู้ใช้\nและบทบาท"),
        (675,"จัดการประเภท\nเอกสาร"),
        (905,"กำหนดลำดับ\nอนุมัติ"),
        (1135,"ตรวจสอบประวัติ\nการใช้งาน"),
    ]
    for y,value in left_cases:
        d.ellipse((left_x-260,y-75,left_x+260,y+75),outline="#222222",width=3)
        label(d,(left_x,y),value,34)
    for y,value in right_cases:
        d.ellipse((right_x-260,y-75,right_x+260,y+75),outline="#222222",width=3)
        label(d,(right_x,y),value,34)
    for y,_ in left_cases[:4]:
        d.line((creator[0]+65,creator[1]-5,left_x-260,y),fill="#222222",width=3)
    for y,_ in left_cases[4:]:
        d.line((approver[0]+65,approver[1]-5,left_x-260,y),fill="#222222",width=3)
    for y,_ in right_cases:
        d.line((admin[0]-65,admin[1]-5,right_x+260,y),fill="#222222",width=3)
    im.save(OUT/"02_use_case_dms.png",dpi=(300,300))


def flow_create():
    W,H=1800,2220
    im=Image.new("RGB",(W,H),"white")
    d=ImageDraw.Draw(im)
    flow_frame(d,W,H,"ระบบ DMS\nหน้าสร้างและส่งอนุมัติเอกสาร","ผู้สร้างเอกสาร","ระบบ DMS")
    user, system=490,1290
    process(d,user,355,260,74,"เริ่มต้น",rounded=True)
    process(d,user,505,410,100,"เลือกประเภทเอกสาร\nPR / PO / BK / PDF")
    process(d,user,680,410,100,"กรอกข้อมูลหรือ\nอัปโหลดไฟล์")
    process(d,user,845,320,90,"กดบันทึกร่าง")
    process(d,system,845,330,90,"ตรวจสอบข้อมูล")
    diamond(d,system,1025,290,140,"ข้อมูล\nถูกต้อง?")
    process(d,system,1240,430,115,"ออกเลขเอกสาร\nบันทึก Draft และ Version 1")
    process(d,1550,1120,235,105,"แจ้งแก้ไข\nข้อมูล",size=30)
    process(d,user,1440,330,90,"กดส่งอนุมัติ")
    process(d,system,1440,470,115,"อ่าน Approval Matrix\nสร้าง Workflow และ Steps",size=32)
    process(d,system,1670,430,105,"แจ้งผู้อนุมัติ\nขั้นแรก",size=33)
    process(d,system,1910,365,95,"สถานะ Pending",rounded=True)
    for y1,y2 in [(392,455),(555,630),(730,800)]: arrow(d,[(user,y1),(user,y2)])
    arrow(d,[(650,845),(1125,845)])
    arrow(d,[(system,890),(system,955)])
    arrow(d,[(system,1095),(system,1182)])
    label(d,(1200,1140),"ใช่",27)
    arrow(d,[(1435,1025),(1550,1025),(1550,1067)])
    label(d,(1510,990),"ไม่",27)
    arrow(d,[(system,1297),(system,1350),(user,1350),(user,1395)])
    arrow(d,[(655,1440),(1055,1440)])
    arrow(d,[(system,1498),(system,1618)])
    arrow(d,[(system,1722),(system,1862)])
    im.save(OUT/"01_flow_create_submit.png",dpi=(300,300))


def flow_approve():
    W,H=1800,2380
    im=Image.new("RGB",(W,H),"white")
    d=ImageDraw.Draw(im)
    flow_frame(d,W,H,"ระบบ DMS\nหน้าพิจารณาอนุมัติเอกสาร","ผู้อนุมัติ","ระบบ DMS")
    user,system=490,1290
    process(d,user,355,250,75,"เริ่มต้น",rounded=True)
    process(d,user,510,330,90,"เปิดรายการรออนุมัติ")
    process(d,system,510,450,100,"ตรวจผู้รับผิดชอบ\nและขั้นปัจจุบัน")
    diamond(d,system,710,310,145,"มีสิทธิ์\nพิจารณา?")
    process(d,1550,850,235,95,"แจ้งไม่มีสิทธิ์",size=30)
    process(d,user,900,350,90,"ตรวจเอกสารและ\nเลือกผลพิจารณา")
    diamond(d,user,1090,310,140,"อนุมัติ?")
    process(d,system,1090,460,105,"ฝังลายเซ็นใน PDF\nบันทึกผลอนุมัติขั้น",size=32)
    diamond(d,system,1350,300,145,"ครบทุก\nขั้นแล้ว?")
    process(d,system,1600,380,95,"สถานะ Approved")
    process(d,1590,1600,210,95,"แจ้งขั้นถัดไป",size=30)
    process(d,system,1840,440,100,"แจ้งผู้สร้างเอกสาร\nและบันทึก Audit Log",size=31)
    process(d,system,2150,260,75,"สิ้นสุด",rounded=True)
    process(d,user,1350,350,90,"ปฏิเสธ/ส่งกลับ\nพร้อมเหตุผล")
    process(d,user,1900,350,100,"แจ้งเหตุผลและ\nปรับสถานะคำร้อง")
    process(d,user,2150,260,75,"สิ้นสุด",rounded=True)
    arrow(d,[(user,393),(user,465)])
    arrow(d,[(655,510),(1065,510)])
    arrow(d,[(system,560),(system,638)])
    arrow(d,[(system,783),(system,810),(user,810),(user,855)])
    label(d,(1225,790),"ใช่",27)
    arrow(d,[(1445,710),(1550,710),(1550,802)])
    label(d,(1500,675),"ไม่",27)
    arrow(d,[(user,945),(user,1020)])
    arrow(d,[(645,1090),(1060,1090)])
    label(d,(825,1050),"ใช่",27)
    arrow(d,[(user,1160),(user,1304)])
    label(d,(440,1220),"ไม่",27)
    arrow(d,[(system,1143),(system,1277)])
    arrow(d,[(system,1423),(system,1552)])
    label(d,(1230,1495),"ใช่",27)
    arrow(d,[(1440,1350),(1590,1350),(1590,1552)])
    label(d,(1530,1310),"ไม่",27)
    arrow(d,[(system,1648),(system,1790)])
    arrow(d,[(1590,1648),(1590,1740),(system,1740),(system,1790)])
    arrow(d,[(system,1892),(system,2112)])
    arrow(d,[(user,1395),(user,1847)])
    arrow(d,[(user,1950),(user,2112)])
    im.save(OUT/"02_flow_approval.png",dpi=(300,300))


def dark_label(draw,xy,text,size=36,bold=False):
    label(draw,xy,text,size=size,fill="#f6f6f6",bold=bold)


def actor(draw,x,W,H,name):
    for y in (95,H-145):
        draw.rounded_rectangle((x-180,y,x+180,y+100),radius=9,outline="#d9d9d9",width=3)
        dark_label(draw,(x,y+50),name,37)
    draw.line((x,195,x,H-145),fill="#c7c7c7",width=3)


def msg(draw,xa,xb,y,text,returning=False,size=33):
    color="#e6e6e6"
    arrow(draw,[(xa,y),(xb,y)],fill=color,width=3,head=18,dash=returning)
    dark_label(draw,((xa+xb)/2,y-34),text,size=size)


def sequence_create():
    W,H=2700,1600
    im=Image.new("RGB",(W,H),"#1d1d20")
    d=ImageDraw.Draw(im)
    X=[260,970,1680,2410]
    for x,name in zip(X,["ผู้สร้าง","เว็บ DMS","API DMS","ฐานข้อมูล"]): actor(d,x,W,H,name)
    steps=[
      (0,1,270,"เลือกประเภทและกรอกข้อมูล",False),
      (1,2,380,"ส่งข้อมูลสร้างเอกสาร",False),
      (2,3,490,"ออกเลขและบันทึก Document + Version 1",False),
      (3,2,600,"คืนรหัสเอกสารและสถานะ Draft",True),
      (2,1,710,"แสดงเอกสารร่าง",True),
      (0,1,820,"กดส่งอนุมัติ",False),
      (1,2,930,"ส่งคำขอ Submit",False),
      (2,3,1040,"อ่าน Matrix และสร้าง Workflow + Steps",False),
      (3,2,1150,"คืนผู้อนุมัติขั้นแรก",True),
      (2,1,1260,"คืนสถานะ Pending / แจ้งเตือน",True),
      (1,0,1370,"แสดงผลการส่งอนุมัติ",True),
    ]
    for a,b,y,t,r in steps: msg(d,X[a],X[b],y,t,r,31 if len(t)>35 else 34)
    im.save(OUT/"06_sequence_create.png",dpi=(300,300))


def sequence_approve():
    W,H=2900,1760
    im=Image.new("RGB",(W,H),"#1d1d20")
    d=ImageDraw.Draw(im)
    X=[250,830,1410,1990,2650]
    for x,name in zip(X,["ผู้อนุมัติ","เว็บ DMS","API DMS","ตัวประมวลผล PDF","ฐานข้อมูล"]): actor(d,x,W,H,name)
    steps=[
      (0,1,260,"เปิดเอกสารและตรวจรายละเอียด",False),
      (0,1,370,"ยืนยันอนุมัติและตำแหน่งลายเซ็น",False),
      (1,2,480,"ส่งคำขอ Approve",False),
      (2,4,590,"ตรวจขั้นปัจจุบันและผู้อนุมัติ",False),
      (4,2,700,"คืนข้อมูลขั้นและเวอร์ชัน",True),
      (2,3,810,"ฝังลายเซ็นบน PDF",False),
      (3,2,920,"คืนไฟล์ที่ลงลายเซ็น",True),
      (2,4,1030,"บันทึกเวอร์ชัน ผลขั้น และ Audit Log",False),
      (4,2,1140,"คืนสถานะขั้นถัดไปหรือ Approved",True),
      (2,4,1250,"สร้าง Notification ผู้เกี่ยวข้อง",False),
      (4,2,1360,"ยืนยันการบันทึก",True),
      (2,1,1470,"ส่งผลการพิจารณา",True),
      (1,0,1580,"แสดงสถานะล่าสุด",True),
    ]
    for a,b,y,t,r in steps: msg(d,X[a],X[b],y,t,r,30 if len(t)>32 else 33)
    im.save(OUT/"07_sequence_approval_signature.png",dpi=(300,300))


def er_table(draw,x,y,w,title,fields,fs=27):
    row_h=52
    h=70+len(fields)*row_h
    draw.rectangle((x,y,x+w,y+h),outline="#222222",width=3,fill="white")
    draw.rectangle((x,y,x+w,y+70),outline="#222222",width=3,fill="#f1f1f1")
    label(draw,(x+w/2,y+35),title,35,bold=True)
    k1=x+75; k2=x+w*.70
    draw.line((k1,y+70,k1,y+h),fill="#777777",width=2)
    draw.line((k2,y+70,k2,y+h),fill="#777777",width=2)
    for i,(key,name,typ) in enumerate(fields):
        yy=y+70+i*row_h
        draw.line((x,yy,x+w,yy),fill="#777777",width=2)
        label(draw,(x+38,yy+row_h/2),key,fs)
        draw.text((k1+14,yy+row_h/2),name,font=font(fs,latin=True),fill="#222222",anchor="lm")
        draw.text((k2+12,yy+row_h/2),typ,font=font(fs,latin=True),fill="#222222",anchor="lm")
    return (x,y,x+w,y+h)


def relation(draw,pts,start="1",end="N"):
    draw.line(pts,fill="#333333",width=3,joint="curve")


def er():
    W,H=2760,1800
    im=Image.new("RGB",(W,H),"white")
    d=ImageDraw.Draw(im)
    users=er_table(d,80,130,760,"users (ผู้ใช้)",[
        ("PK","id","UUID"),("","username","String"),("","first_name","String"),
        ("FK","role_id","UUID?"),("FK","department_id","UUID?"),("","signature_encrypted","String?"),
    ])
    docs=er_table(d,1000,130,760,"documents (เอกสาร)",[
        ("PK","id","UUID"),("","doc_number","String"),("FK","type_id","UUID"),
        ("FK","creator_id","UUID"),("","status","Enum"),("","visibility_type","String"),
    ])
    types=er_table(d,1920,130,760,"document_types (ประเภท)",[
        ("PK","id","UUID"),("","type_name","String"),("","prefix","String"),
        ("","is_active","Boolean"),
    ])
    versions=er_table(d,80,970,760,"document_versions (เวอร์ชัน)",[
        ("PK","id","UUID"),("FK","document_id","UUID"),("","version_number","Int"),
        ("","file_data","Bytes?"),("","form_data","Json?"),
    ])
    workflow=er_table(d,1000,970,760,"workflows (กระบวนการ)",[
        ("PK","id","UUID"),("FK","document_id","UUID"),("","current_step","Int"),
        ("","total_steps","Int"),("","status","Enum"),
    ])
    steps=er_table(d,1920,970,760,"workflow_steps (ขั้นอนุมัติ)",[
        ("PK","id","UUID"),("FK","workflow_id","UUID"),("FK","approver_id","UUID?"),
        ("","step_order","Int"),("","status","Enum"),("","signature_applied","Boolean"),
    ])
    matrix=er_table(d,1920,540,760,"approval_matrix (ลำดับมาตรฐาน)",[
        ("PK","id","UUID"),("FK","document_type_id","UUID"),("FK","required_role_id","UUID"),
        ("","step_order","Int"),
    ])
    relation(d,[(840,315),(1000,315)])
    relation(d,[(1920,315),(1760,315)])
    relation(d,[(1380,512),(1380,790),(460,790),(460,970)])
    relation(d,[(1380,512),(1380,970)])
    relation(d,[(1760,1180),(1920,1180)])
    relation(d,[(2300,408),(2300,540)])
    im.save(OUT/"08_er_core_prisma.png",dpi=(300,300))


if __name__ == "__main__":
    as_is_to_be()
    use_case()
    flow_create()
    flow_approve()
    sequence_create()
    sequence_approve()
    er()
    for p in sorted(OUT.glob("*.png")):
        print(p.name, p.stat().st_size)
