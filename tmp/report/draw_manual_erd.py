import json, heapq, math, html, hashlib
from pathlib import Path

ROOT=Path('D:/Document Management')
OUT=ROOT/'output/diagrams'
data=json.loads((OUT/'DMS_ERD_schema_verified.json').read_text(encoding='utf-8'))
models={m['table']:m for m in data['models']}
W,H=3800,4160
CW,HH,RH=560,60,40
G=20
locations={
 'positions':(1,220),'departments':(2,220),'roles':(3,220),'permissions':(4,220),
 'folder_permissions':(0,680),'folders':(1,680),'users':(2,680),'approval_matrix':(3,680),'role_permissions':(4,680),
 'bk_forms':(0,1600),'pr_forms':(1,1600),'documents':(2,1600),'document_types':(3,1600),'running_numbers':(4,1600),
 'pr_form_items':(0,2550),'po_form_items':(1,2550),'po_forms':(2,2550),'workflows':(3,2550),'workflow_steps':(4,2550),
 'audit_logs':(0,3320),'notifications':(1,3320),'document_versions':(2,3320),
}
# Row coordinates stay on the routing grid.
locations={t:(col,int(round(y/G)*G)) for t,(col,y) in locations.items()}
for t,m in models.items():
 col,y=locations[t];m.update(x=100+760*col,y=y,w=CW,h=HH+RH*len(m['fields']))
for r in data['relations']:
 p=models[r['parent']];c=models[r['child']]
 assert all(any(f['name']==n for f in p['fields']) for n in r['references'])
 assert all(any(f['name']==n for f in c['fields']) for n in r['fields'])
 assert r['optional']==next(f['optional'] for f in c['fields'] if f['name']==r['fields'][0])

NX,NY=W//G,H//G
blocked=set()
for m in models.values():
 for x in range((m['x']-20)//G,(m['x']+m['w']+20)//G+1):
  for y in range((m['y']-20)//G,(m['y']+m['h']+20)//G+1):blocked.add((x,y))
# Keep heading and legend free of connectors.
for x in range(NX+1):
 for y in range(0,9):blocked.add((x,y))
for x in range(119,NX):
 for y in range(162,NY):blocked.add((x,y))

occupied={};vertices={}
dirs=[(1,0),(-1,0),(0,1),(0,-1)]
def edgekey(a,b):return (a,b) if a<b else (b,a)
def findpath(start,end,owner,initial_dir):
 pq=[];dist={};prev={};seq=0
 initial=(start[0],start[1],initial_dir)
 dist[initial]=0
 heapq.heappush(pq,(abs(start[0]-end[0])+abs(start[1]-end[1]),0,seq,initial))
 final=None
 while pq:
  _,cost,_,state=heapq.heappop(pq)
  if cost!=dist.get(state):continue
  x,y,d=state
  if (x,y)==end:final=state;break
  for nd,(dx,dy) in enumerate(dirs):
   px,py=x+dx,y+dy
   if px<2 or px>NX-2 or py<9 or py>NY-8 or (px,py) in blocked:continue
   ek=edgekey((x,y),(px,py))
   foreign=occupied.get(ek,set())-{owner}
   node_foreign=vertices.get((px,py),set())-{owner}
   step=1+(0.8 if nd!=d else 0)+(18 if foreign else 0)+(1.8 if node_foreign else 0)
   nc=cost+step;ns=(px,py,nd)
   if nc<dist.get(ns,float('inf')):
    dist[ns]=nc;prev[ns]=state;seq+=1
    heur=abs(px-end[0])+abs(py-end[1])
    heapq.heappush(pq,(nc+heur,nc,seq,ns))
 if final is None:return None
 arr=[];cur=final
 while cur!=initial:arr.append((cur[0],cur[1]));cur=prev[cur]
 arr.append(start);arr.reverse()
 return dist[final],arr

def port(m,field,side):
 idx=next(i for i,f in enumerate(m['fields']) if f['name']==field)
 return (m['x']+(m['w'] if side==1 else 0),m['y']+HH+RH*idx+RH//2)
def simplify(points):
 a=[points[0]]
 for i in range(1,len(points)-1):
  x,y=points[i];p=a[-1];n=points[i+1]
  if (p[0]==x==n[0]) or (p[1]==y==n[1]):continue
  a.append(points[i])
 a.append(points[-1]);return a

relationships=data['relations'][:]
# Short local links are routed first; long links use the remaining channels.
relationships.sort(key=lambda r:abs(models[r['parent']]['x']-models[r['child']]['x'])+abs(models[r['parent']]['y']-models[r['child']]['y']))
paths=[]
for ri,r in enumerate(relationships):
 parent,child=models[r['parent']],models[r['child']]
 owner=r['parent']+'.'+r['references'][0]
 options=[]
 for ps in [-1,1]:
  for cs in [-1,1]:
   a=port(parent,r['references'][0],ps);b=port(child,r['fields'][0],cs)
   sa=((a[0]+ps*60)//G,a[1]//G);sb=((b[0]+cs*60)//G,b[1]//G)
   if sa in blocked or sb in blocked:continue
   result=findpath(sa,sb,owner,0 if ps==1 else 1)
   if result:
    cost,route=result
    # Prefer facing sides and avoid unnecessarily circling an entity.
    options.append((cost,ps,cs,a,b,route))
 if not options:raise RuntimeError('No route '+str(r))
 cost,ps,cs,a,b,route=min(options,key=lambda v:v[0])
 for p,q in zip(route,route[1:]):occupied.setdefault(edgekey(p,q),set()).add(owner)
 for p in route:vertices.setdefault(p,set()).add(owner)
 points=simplify([a]+[(x*G,y*G) for x,y in route]+[b])
 paths.append(dict(relation=r,points=points,ps=ps,cs=cs))
 print(f"Routed {ri+1}/33: {r['child']}.{r['fields'][0]} -> {r['parent']}.{r['references'][0]}",flush=True)

svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
 '<rect width="100%" height="100%" fill="white"/>',
 '<style>text{font-family:Arial,sans-serif;fill:#353a40} .field{font-size:24px}.type{font-size:20px;fill:#60656b}.key{font-size:15px;font-weight:bold;fill:#535960}</style>']
def text(x,y,s,size=24,bold=False,anchor='start',fill=None):
 svg.append(f'<text x="{x}" y="{y}" font-size="{size}"'+(' font-weight="bold"' if bold else '')+f' text-anchor="{anchor}"'+(f' style="fill:{fill}"' if fill else '')+f'>{html.escape(s)}</text>')
text(W/2,83,'Document Management System',46,True,'middle')
text(W/2,133,'ENTITY RELATIONSHIP DIAGRAM',28,False,'middle')

for p in paths:
 points=' '.join(f'{x},{y}' for x,y in p['points'])
 # White under-stroke breaks crossing lines so crossings cannot be mistaken for junctions.
 svg.append(f'<polyline points="{points}" fill="none" stroke="white" stroke-width="9" stroke-linejoin="round"/>')
 svg.append(f'<polyline points="{points}" fill="none" stroke="#5b6066" stroke-width="2.6" stroke-linejoin="round"/>')

def cardinality(point,side,kind):
 x,y=point
 def line(x1,y1,x2,y2):svg.append(f'<path d="M{x1},{y1} L{x2},{y2}" fill="none" stroke="#454b52" stroke-width="2.8"/>')
 if kind=='many':
  for dy in [-11,0,11]:line(x,y+dy,x+side*22,y)
  svg.append(f'<circle cx="{x+side*37}" cy="{y}" r="7" fill="white" stroke="#454b52" stroke-width="2.5"/>')
 else:
  line(x+side*10,y-11,x+side*10,y+11)
  if kind=='one':line(x+side*23,y-11,x+side*23,y+11)
  else:svg.append(f'<circle cx="{x+side*30}" cy="{y}" r="7" fill="white" stroke="#454b52" stroke-width="2.5"/>')

for p in paths:
 r=p['relation']
 cardinality(p['points'][0],p['ps'],'optional' if r['optional'] else 'one')
 cardinality(p['points'][-1],p['cs'],'optional' if r['unique'] else 'many')

for table,m in models.items():
 x,y,w,h=m['x'],m['y'],m['w'],m['h']
 svg.append(f'<defs><clipPath id="clip_{table}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7"/></clipPath></defs>')
 svg.append(f'<g clip-path="url(#clip_{table})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="white"/>')
 svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{HH}" fill="#f5c1b4"/>')
 text(x+18,y+40,table,29,True)
 for i,f in enumerate(m['fields']):
  fy=y+HH+i*RH
  if i%2:svg.append(f'<rect x="{x}" y="{fy}" width="{w}" height="{RH}" fill="#e9e9e9"/>')
  keys=[f['pk'] and 'PK',f['fk'] and 'FK',f['uq'] and 'UQ']
  keys += ['U'+str(j+1) for j,g in enumerate(m['unique']) if f['name'] in g]
  key=','.join(k for k in keys if k)
  # Key labels are separate from field names, as in a database modelling tool.
  svg.append(f'<text class="key" x="{x+10}" y="{fy+27}">{html.escape(key)}</text>')
  svg.append(f'<text class="field" x="{x+108}" y="{fy+28}">{html.escape(f["name"])}</text>')
  # Prisma type names are kept verbatim; native modifiers appear in the notes.
  svg.append(f'<text class="type" x="{x+w-12}" y="{fy+28}" text-anchor="end">{html.escape(f["type"])}</text>')
 svg.append('</g>')
 svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="none" stroke="#4b5057" stroke-width="2.6"/>')
 svg.append(f'<line x1="{x}" y1="{y+HH}" x2="{x+w}" y2="{y+HH}" stroke="#4b5057" stroke-width="2"/>')

# Compact model notes use the spare lower-right corner, not another set of tables.
lx,ly=2420,3330
text(lx,ly,'NOTATION',27,True)
text(lx,ly+43,'PK  Primary key     FK  Foreign key     UQ  Unique',22)
text(lx,ly+80,'U1 / U2  Fields in the same composite unique key',21)
text(lx,ly+117,'?  Nullable     []  Array     Types follow Prisma Schema',21)
for j,(kind,label) in enumerate([('one','Exactly one'),('optional','Zero or one'),('many','Zero or many')]):
 py=ly+170+j*45
 svg.append(f'<line x1="{lx}" y1="{py}" x2="{lx+100}" y2="{py}" stroke="#5b6066" stroke-width="2.6"/>')
 cardinality((lx,py),1,kind)
 text(lx+125,py+8,label,22)
text(lx,ly+340,'ENUM VALUES',27,True)
ey=ly+382
for e in data['enums']:
 text(lx,ey,e['name'],22,True)
 vals=e['values']
 groups=[vals[i:i+5] for i in range(0,len(vals),5)]
 for group in groups:
  ey+=30;text(lx,ey,' / '.join(group),20)
 ey+=37
text(100,H-105,'22 tables  |  190 columns  |  33 foreign key relationships',23,True)
text(100,H-65,'Source: dms/server/prisma/schema.prisma',21)
text(W-100,H-65,'Crossing lines do not indicate a relationship.',20,False,'end')
svg.append('</svg>')
(OUT/'DMS_ERD_Readable.svg').write_text('\n'.join(svg),encoding='utf-8')
(OUT/'DMS_ERD_routes_verified.json').write_text(json.dumps(paths,indent=2),encoding='utf-8')
assert len(paths)==33 and len(models)==22 and sum(len(m['fields']) for m in models.values())==190
print('Verified: 22 tables / 190 scalar columns / 33 exact FK-to-PK connections',flush=True)
