from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(r'D:/Document Management')
OUT=ROOT/'output/diagrams/DMS_ERD_Data_Flow_22_Tables.png'
GRAPH=ROOT/'output/diagrams/dms_flow_erd_graph.png'
W=6000
im=Image.open(GRAPH).convert('RGB')
im=im.resize((W-120,round(im.height*(W-120)/im.width)),Image.Resampling.LANCZOS)
top=745
H=top+im.height+270
canvas=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(canvas)
THAI=r'C:/Windows/Fonts/LeelawUI.ttf'
BOLD=r'C:/Windows/Fonts/LeelaUIb.ttf'
def font(n,bold=False):return ImageFont.truetype(BOLD if bold else THAI,n)
def text(x,y,s,size=48,bold=False,fill='#171717',anchor='mm'):
    d.text((x,y),s,font=font(size,bold),fill=fill,anchor=anchor)
text(W//2,105,'ERD และการไหลข้อมูลของระบบ DMS',106,True)
text(W//2,205,'22 ตาราง • 33 ความสัมพันธ์ PK–FK • อ้างอิง Prisma Schema ของโปรเจกต์',48)
labels=[
 ('1','ผู้ใช้และสิทธิ์','users / roles / permissions'),
 ('2','สร้างเอกสาร','documents + PR / PO / BK'),
 ('3','จัดเก็บเวอร์ชัน','document_versions'),
 ('4','ส่งเอกสารอนุมัติ','approval_matrix / workflows'),
 ('5','พิจารณาและลงลายเซ็น','workflow_steps / documents'),
 ('6','แจ้งเตือนและเก็บประวัติ','notifications / audit_logs'),
]
margin,gap=75,48
bw=(W-2*margin-5*gap)//6
for i,(n,title,sub) in enumerate(labels):
    x=margin+i*(bw+gap);y=300
    d.rounded_rectangle((x,y,x+bw,y+230),radius=14,fill='#edf3f9',outline='#285d8f',width=4)
    text(x+bw//2,y+51,n,52,True,fill='#285d8f')
    text(x+bw//2,y+112,title,46,True)
    text(x+bw//2,y+180,sub,34)
    if i<5:
        xx=x+bw+5;yy=y+115
        d.line((xx,yy,xx+gap-15,yy),fill='#285d8f',width=7)
        d.polygon([(xx+gap-9,yy),(xx+gap-28,yy-15),(xx+gap-28,yy+15)],fill='#285d8f')
text(W//2,602,'แถบบนแสดงลำดับการทำงาน  •  เส้นเชื่อมใน ERD ด้านล่างแสดงการอ้างอิงจาก PK ไปยัง FK',43)
text(W//2,674,'สีน้ำเงินเน้นความสัมพันธ์หลักของการสร้างเอกสารและกระบวนการอนุมัติ',42,fill='#285d8f')
canvas.paste(im,(60,top))
baseline=top+im.height+75
text(W//2,baseline,'1 = หนึ่งระเบียน     0..1 = ไม่มีหรือหนึ่งระเบียน     0..N = ไม่มีหรือหลายระเบียน',44)
text(W//2,baseline+70,'PK = คีย์หลัก     FK = คีย์อ้างอิง     UQ = ค่าไม่ซ้ำ     ? = ค่าว่างได้',44)
text(W//2,baseline+140,'แสดงคีย์และฟิลด์สำคัญที่เกี่ยวข้องกับการทำงานของระบบ',38,fill='#555555')
canvas.save(OUT,dpi=(300,300),optimize=True)
preview=canvas.copy();preview.thumbnail((2100,1700));preview.save(ROOT/'tmp/report/DMS_ERD_Data_Flow_preview.png')
print(OUT)
print(canvas.size)
