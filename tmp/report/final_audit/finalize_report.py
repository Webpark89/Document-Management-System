from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from docx import Document
import copy,json,re,sys

ROOT=Path('D:/Document Management')
TMP=ROOT/'tmp/report/final_audit'
SOURCE=Path('C:/Users/LeP52ExPower/Desktop/รายงานสหกิจศึกษา_DMS_ธนภัทร_ปรับภาคผนวก_การติดตั้งโปรแกรม.docx')
FINAL=ROOT/'output/documents/รายงานสหกิจศึกษา_DMS_ธนภัทร_ตรวจแก้ก่อนส่ง.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W='{'+NS['w']+'}'

def text(el):return ''.join(el.xpath('.//w:t/text()',namespaces=NS))
def norm(s):return ' '.join(s.replace('\x07','').replace('\x0c','').split())
def set_text(el,value):
    ts=el.xpath('.//w:t',namespaces=NS)
    assert ts
    ts[0].text=value
    ts[0].set('{http://www.w3.org/XML/1998/namespace}space','preserve')
    for t in ts[1:]:t.text=''
def rewrite(source,target,xml):
    with ZipFile(source) as zin,ZipFile(target.with_suffix('.tmp'),'w') as zout:
        for i in zin.infolist():zout.writestr(i,xml if i.filename=='word/document.xml' else zin.read(i.filename))
    target.with_suffix('.tmp').replace(target)

def edit():
    with ZipFile(SOURCE) as z:root=etree.fromstring(z.read('word/document.xml'))
    body=root.find(W+'body')
    replacements={
      39:'บัดนี้ขอส่งรายงานการปฏิบัติงานสหกิจศึกษาเพื่อให้อาจารย์ตรวจพิจารณา จำนวน 1 เล่ม พร้อมรายละเอียดการวิเคราะห์ ออกแบบ พัฒนา และตรวจสอบระบบ',
      58:'ลายมือชื่อนิสิต                         ลายมือชื่ออาจารย์ที่ปรึกษา                 วันที่',
      116:'ส่วนติดต่อผู้ใช้ใช้ Next.js 16, React 19, TypeScript และ Tailwind CSS 4 ส่วนบริการใช้ NestJS 11, Prisma 5 และ PostgreSQL การจัดการ PDF ใช้ pdf-lib และการทดสอบ API/โค้ดใช้เครื่องมือที่กำหนดในโครงการ',
      163:'กรณีใช้งานหลักของระบบสรุปรหัสและชื่อกรณีใช้งาน ผู้เกี่ยวข้อง ขั้นตอนหลัก และผลลัพธ์ ดังตารางต่อไปนี้',
      173:'Prisma Schema แบ่งข้อมูลเป็นข้อมูลหลัก ผู้ใช้และสิทธิ์ เอกสารและเวอร์ชัน กระบวนการอนุมัติ การแจ้งเตือน และ Audit Log ตารางส่วนใหญ่ใช้ UUID เป็นคีย์หลัก ส่วน role_permissions ใช้คีย์หลักร่วมระหว่าง role_id และ permission_id เอกสารหนึ่งฉบับมีหลายเวอร์ชันและมีกระบวนการอนุมัติได้หนึ่งชุด ซึ่งประกอบด้วยหลายขั้น',
      247:'ระบบส่วนหน้ามีหน้าสร้างเอกสาร PR, PO, BK และ PDF หน้าศูนย์เอกสาร หน้ารายละเอียดเอกสาร ประวัติเวอร์ชัน รายการอนุมัติ แดชบอร์ด การแจ้งเตือน โฟลเดอร์ และหน้าจัดการข้อมูลหลัก',
      416:'แบบฟอร์มสหกิจศึกษา',
    }
    children=list(body)
    for i,value in replacements.items():
        assert children[i].tag==W+'p'
        set_text(children[i],value)
    assert 'นำภาพภาพผลทดสอบ' in text(children[270])
    assert text(children[271]).startswith('ภาพที่ 18 ')
    for i in [270,271]:body.remove(children[i])
    tabs=body.findall(W+'tbl')
    for tr in tabs[3].findall(W+'tr'):
        if text(tr).startswith('ภาพที่ 18 '):tabs[3].remove(tr)
    for tr in tabs[1].findall(W+'tr'):
        cells=tr.findall(W+'tc')
        if text(cells[0]).startswith('ภาคผนวก ข'):set_text(cells[0],'ภาคผนวก ข แบบฟอร์มสหกิจศึกษา')
    # Move page breaks at the start of a chapter paragraph to paragraph properties.
    # This keeps the visible heading and Word's reported paragraph page together.
    for p in body.findall(W+'p'):
        if re.fullmatch(r'บทที่\s*[1-5]',norm(text(p))):
            breaks=p.xpath('./w:r/w:br[@w:type="page"]',namespaces=NS)
            if breaks:
                for br in breaks:br.getparent().remove(br)
                pr=p.find(W+'pPr')
                if pr is None:pr=etree.Element(W+'pPr');p.insert(0,pr)
                if pr.find(W+'pageBreakBefore') is None:pr.insert(0,etree.Element(W+'pageBreakBefore'))
    xml=etree.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
    rewrite(SOURCE,FINAL,xml)
    with ZipFile(SOURCE) as a,ZipFile(FINAL) as b:
        media=[n for n in a.namelist() if n.startswith('word/media/')]
        assert all(a.read(n)==b.read(n) for n in media)
        assert [n for n in a.namelist() if n!='word/document.xml']==[n for n in b.namelist() if n!='word/document.xml']
    print('Edited copy; all',len(media),'media files and all other document parts preserved.')

def indices(map_path):
    entries=json.loads(Path(map_path).read_text(encoding='utf-8-sig'))
    main=[(norm(e['text']),str(e['page'])) for e in entries if not e['inTable'] and e['physical']>=11]
    exact={}
    lookup={}
    for s,page in main:
        exact.setdefault(s,page)
        for kind,pat in [('table',r'^ตารางที่\s*(\d+)\b'),('figure',r'^ภาพที่\s*(\d+)\b'),('appendix',r'^ภาพภาคผนวกที่\s*ก\s*(\d+)\b')]:
            m=re.match(pat,s)
            if m:lookup[kind,int(m.group(1))]=page
    assert {n for k,n in lookup if k=='table'}==set(range(1,28))
    assert {n for k,n in lookup if k=='figure'}==set(range(1,18))
    assert {n for k,n in lookup if k=='appendix'}==set(range(1,15))
    with ZipFile(FINAL) as z:root=etree.fromstring(z.read('word/document.xml'))
    tabs=root.find(W+'body').findall(W+'tbl')
    changes=[]
    checked=0
    for ti,tab in enumerate(tabs[:5]):
        for ri,tr in enumerate(tab.findall(W+'tr')):
            cells=tr.findall(W+'tc');label=norm(text(cells[0]));old=norm(text(cells[1]));target=None
            if ti<2:
                if label.startswith('บทที่'):
                    target=exact['บทที่ '+re.match(r'บทที่\s*(\d+)',label).group(1)]
                elif label.startswith('ภาคผนวก ก'):target=exact['ภาคผนวก ก']
                elif label.startswith('ภาคผนวก ข'):target=exact['ภาคผนวก ข']
                elif label in exact:target=exact[label]
                elif ri<=6 and ti==0:continue
            else:
                kind,pat=[('table',r'^ตารางที่\s*(\d+)'),('figure',r'^ภาพที่\s*(\d+)'),('appendix',r'^ภาพภาคผนวกที่\s*ก\s*(\d+)')][ti-2]
                m=re.match(pat,label)
                if m:target=lookup.get((kind,int(m.group(1))))
            assert target is not None,('Unmapped',ti,ri,label)
            checked+=1
            if old!=target:
                changes.append({'label':label,'old':old,'new':target})
                set_text(cells[1],target)
    if changes:rewrite(FINAL,FINAL,etree.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True))
    (TMP/'index_changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Index entries checked:',checked,'changed:',len(changes))
    print(json.dumps(changes,ensure_ascii=False))

if __name__=='__main__':
    if len(sys.argv)>1:indices(sys.argv[1])
    else:edit()
