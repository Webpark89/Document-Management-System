const fs = require('node:fs');
const path = require('node:path');
const { instance } = require('C:/Users/LeP52ExPower/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@viz-js/viz/dist/viz.cjs');
const sharp = require('C:/Users/LeP52ExPower/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const root = 'D:/Document Management';
const out = path.join(root, 'output/diagrams');
fs.mkdirSync(out, {recursive:true});
const schema = fs.readFileSync(path.join(root,'dms/server/prisma/schema.prisma'),'utf8');
const models = [...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].map(m=>({model:m[1],body:m[2],table:(m[2].match(/@@map\("([^"]+)"\)/)||[])[1]}));
const mapped = Object.fromEntries(models.map(m=>[m.model,m.table]));
const ranks = [
 ['departments','positions','roles','permissions'],
 ['users','role_permissions','document_types'],
 ['folders','documents','running_numbers','approval_matrix'],
 ['folder_permissions','pr_forms','po_forms','bk_forms','workflows'],
 ['pr_form_items','po_form_items','document_versions','workflow_steps'],
 ['notifications','audit_logs'],
];
const extra = {
 departments:['name'], positions:['name'], roles:['name'], permissions:['module','action'],
 users:['signature_encrypted'], documents:['doc_number','status','approved_at'],
 document_types:['type_name','prefix'], folders:['visibility'], folder_permissions:['can_view','can_edit'],
 pr_forms:['total_amount'],pr_form_items:['item_name','quantity'],po_forms:['vendor_name'],po_form_items:['item_name','quantity'],bk_forms:['subject'],
 document_versions:['version_number','file_data','form_data'],approval_matrix:['step_order'],
 workflows:['current_step','status'],workflow_steps:['step_order','status','signature_applied'],
 notifications:['message','is_read'],audit_logs:['action','target_id'],running_numbers:['current_number']
};
const colors = t => ['documents','users'].includes(t)?'#dce9f6':(['workflows','workflow_steps','approval_matrix'].includes(t)?'#e1ecdf':'#eeeeee');
const relations=[];
for(const m of models){
 for(const line of m.body.split('\n')){
  const rel=line.match(/^\s*\w+\s+(\w+)(\?)?\s+@relation\([^\n]*fields:\s*\[([^\]]+)\]/);
  if(rel) for(const field of rel[3].split(',').map(s=>s.trim())){
   const fieldLine=m.body.split('\n').find(s=>new RegExp('^\\s*'+field+'\\s+').test(s))||'';
   relations.push({parent:mapped[rel[1]],child:m.table,field,optional:!!rel[2],unique:fieldLine.includes('@unique')});
  }
 }
}
if(models.length!==22 || relations.length!==33)throw new Error(`Unexpected schema ${models.length}/${relations.length}`);
function html(s){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function card(m){
 const fk=relations.filter(r=>r.child===m.table).map(r=>r.field);
 const isComposite=m.body.includes('@@id(');
 const fields=[...(isComposite?[]:['id']),...fk,...(extra[m.table]||[])];
 const unique=[...new Set(fields)];
 let rows=`<TR><TD WIDTH="245" BGCOLOR="${colors(m.table)}" CELLPADDING="10"><FONT POINT-SIZE="19"><B>${m.table}</B></FONT></TD></TR>`;
 for(const field of unique){
  let prefix=field==='id'?'PK':fk.includes(field)?(isComposite?'PK,FK':'FK'):' ';
  let name=field;
  const line=m.body.split('\n').find(s=>new RegExp('^\\s*'+field+'\\s+').test(s))||'';
  if(line.includes('@unique'))name+=' [UQ]';
  if(/^\s*\w+\s+\w+\?/.test(line))name+=' ?';
  rows+=`<TR><TD ALIGN="LEFT" CELLPADDING="5"><FONT FACE="Consolas" POINT-SIZE="13">${html(prefix.padEnd(6,' ')+name)}</FONT></TD></TR>`;
 }
 return `"${m.table}" [label=<<TABLE BORDER="1" COLOR="#454545" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" WIDTH="245">${rows}</TABLE>>];`;
}
let dot=`digraph DMS { graph [rankdir=TB, splines=ortho, nodesep=0.38, ranksep=0.72, bgcolor="white", pad=0.25, outputorder=edgesfirst]; node [shape=plain, fontname="Arial"]; edge [color="#7d858d", penwidth=1.15, arrowsize=0.75, fontname="Arial", fontsize=11, labelfontcolor="#343b42", labeldistance=1.5];\n`;
dot+=models.map(card).join('\n');
for(const r of ranks)dot+=`\n{rank=same; ${r.map(t=>'"'+t+'"').join(';')};}\n`;
for(const r of relations){
 const main=['users>documents','documents>workflows','workflows>workflow_steps','documents>document_versions'].includes(r.parent+'>'+r.child);
 const src=r.optional?'0..1':'1';const dst=r.unique?'0..1':'0..N';
 const backward=r.parent==='users' && ['folder_permissions','pr_forms','document_versions','workflow_steps','notifications','audit_logs'].includes(r.child);
 let attrs=`taillabel="${src}",headlabel="${dst}",tooltip="${r.child}.${r.field} references ${r.parent}.id"`;
 if(main)attrs+=',color="#285d8f",penwidth=2.8';
 if(r.parent===r.child)attrs+=',constraint=false';
 if(backward)attrs+=',weight=0.3';
 dot+=`"${r.parent}" -> "${r.child}" [${attrs}];\n`;
}
dot+='}';
fs.writeFileSync(path.join(out,'dms_flow_erd.dot'),dot);
fs.writeFileSync(path.join(out,'dms_flow_erd_relationships.json'),JSON.stringify(relations,null,2));
(async()=>{
 const viz=await instance();
 const svg=viz.renderString(dot,{format:'svg',engine:'dot'});
 fs.writeFileSync(path.join(out,'dms_flow_erd_graph.svg'),svg);
 await sharp(Buffer.from(svg),{density:110}).png().toFile(path.join(out,'dms_flow_erd_graph.png'));
 console.log('Rendered 22 tables / 33 foreign keys');
 console.log(await sharp(path.join(out,'dms_flow_erd_graph.png')).metadata());
})();
