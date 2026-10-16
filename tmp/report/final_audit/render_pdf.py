from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import pypdfium2 as pdfium
import sys

root=Path('D:/Document Management/tmp/report/final_audit')
name=sys.argv[1] if len(sys.argv)>1 else 'source'
pdf=pdfium.PdfDocument(str(root/(name+'.pdf')))
folder=root/(name+'_pages');folder.mkdir(exist_ok=True)
for i in range(len(pdf)):
 page=pdf[i]
 im=page.render(scale=1.5).to_pil().convert('RGB')
 im.save(folder/f'page-{i+1:02}.png')
 page.close()
for start in range(0,len(pdf),9):
 sheet=Image.new('RGB',(1800,2600),'#dddddd');draw=ImageDraw.Draw(sheet)
 for j,i in enumerate(range(start,min(start+9,len(pdf)))):
  im=Image.open(folder/f'page-{i+1:02}.png')
  im.thumbnail((570,815))
  x=15+(j%3)*600;y=38+(j//3)*865
  sheet.paste(im,(x,y))
  draw.text((x,y-24),f'Physical {i+1} / printed {i-9 if i>=10 else "front"}',fill='black',font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20))
 sheet.save(folder/f'contact-{start//9+1}.jpg',quality=90)
print('Rendered',len(pdf),'pages to',folder)
