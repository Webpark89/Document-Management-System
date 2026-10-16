const fs=require('node:fs');
const path=require('node:path');
const {instance}=require('C:/Users/LeP52ExPower/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@viz-js/viz/dist/viz.cjs');
const sharp=require('C:/Users/LeP52ExPower/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='D:/Document Management',out=path.join(root,'output/diagrams');
const schema=fs.readFileSync(path.join(root,'dms/server/prisma/schema.prisma'),'utf8');
const blocks=[...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)];
const enums=[...schema.matchAll(/enum\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].map(x=>({name:x[1],values:x[2].split('\n').map(l=>l.split('//')[0].trim()).filter(Boolean)}));
const modelNames=blocks.map(x=>x[1]);
const models=blocks.map(x=>{
 const body=x[2],table=body.match(/@@map\("([^"]+)"\)/)[1];
 const compound=(tag)=>[...body.matchAll(new RegExp('@@'+tag+'\\(\\[([^\\]]+)\\]','g'))].map(m=>m[1].split(',').map(t=>t.trim()));
 const pk=compound('id').flat(),unique=compound('unique');
 const fields=body.split('\n').map(l=>l.split('//')[0].trim()).filter(l=>l&&!l.startsWith('@')).map(l=>{
  const m=l.match(/^(\w+)\s+(\w+)(\[\]|\?)?(.*)$/);if(!m||modelNames.includes(m[2]))return null;
  return {name:m[1],type:m[2]+(m[3]||''),optional:m[3]==='?',pk:m[4].includes('@id')||pk.includes(m[1]),uq:m[4].includes('@unique'),native:(m[4].match(/@db\.(\w+(?:\([^)]*\))?)/)||[])[1],raw:l};
 }).filter(Boolean);
 const relations=body.split('\n').map(l=>{
  const m=l.match(/^\s*(\w+)\s+(\w+)(\?)?\s+@relation\([^\n]*fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\]/);return m?{name:m[1],parentModel:m[2],optional:!!m[3],fields:m[4].split(',').map(s=>s.trim()),references:m[5].split(',').map(s=>s.trim())}:null;
 }).filter(Boolean);
 return {model:x[1],table,fields,relations,unique};
});
const map=Object.fromEntries(models.map(m=>[m.model,m]));
const relations=models.flatMap(m=>m.relations.map(r=>({...r,child:m.table,parent:map[r.parentModel].table,unique:r.fields.length===1&&m.fields.find(f=>f.name===r.fields[0]).uq})));
for(const m of models)for(const f of m.fields)f.fk=m.relations.some(r=>r.fields.includes(f.name));
if(models.length!==22||relations.length!==33)throw Error('Schema counts changed');
const count=models.reduce((n,m)=>n+m.fields.length,0);
fs.writeFileSync(path.join(out,'DMS_ERD_schema_verified.json'),JSON.stringify({tables:models.length,columns:count,foreignKeys:relations.length,models,enums,relations},null,2));
function esc(s){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function card(m){
 let s=`<TABLE BORDER="1" COLOR="#4e5257" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0"><TR><TD BGCOLOR="#f5c1b4" COLSPAN="3" ALIGN="LEFT" CELLPADDING="10"><FONT FACE="Arial" POINT-SIZE="21"><B>${m.table}</B></FONT></TD></TR>`;
 m.fields.forEach((f,i)=>{
  const key=[f.pk?'PK':'',f.fk?'FK':'',f.uq?'UQ':'',...m.unique.flatMap((g,j)=>g.includes(f.name)?['U'+(j+1)]:[])].filter(Boolean).join(',');
  let t=f.type;
  if(f.native)t=f.native+(f.optional?'?':'');
  s+=`<TR><TD BGCOLOR="${i%2?'#e9e9e9':'#ffffff'}" ALIGN="LEFT" CELLPADDING="4" WIDTH="65"><FONT FACE="Arial" POINT-SIZE="11">${key || " "}</FONT></TD><TD PORT="${f.name}" BGCOLOR="${i%2?'#e9e9e9':'#ffffff'}" ALIGN="LEFT" CELLPADDING="4" WIDTH="216"><FONT FACE="Arial" POINT-SIZE="14">${esc(f.name)}</FONT></TD><TD BGCOLOR="${i%2?'#e9e9e9':'#ffffff'}" ALIGN="LEFT" CELLPADDING="4" WIDTH="132"><FONT FACE="Arial" POINT-SIZE="12" COLOR="#555b62">${esc(t)}</FONT></TD></TR>`;
 });
 return `"${m.table}" [label=<${s}</TABLE>>];`;
}
const ranks=[['departments','positions','roles','permissions'],['folder_permissions','folders','users','role_permissions'],['bk_forms','documents','document_types','approval_matrix','running_numbers'],['pr_forms','document_versions','workflows','notifications','audit_logs'],['pr_form_items','po_forms','workflow_steps'],['po_form_items']];
let dot=`digraph DMS { graph [rankdir=TB,splines=ortho,nodesep=0.85,ranksep=1.35,bgcolor="white",pad=0.4,outputorder=edgesfirst]; node [shape=plain,fontname="Arial"]; edge [dir=both,color="#555b62",penwidth=1.4,arrowsize=0.9];\n`;
dot+=models.map(card).join('\n');
for(const r of ranks)dot+=`\n{rank=same; ${r.map(t=>'"'+t+'"').join(';')};}\n`;
for(const r of relations){
 const parentMark=r.optional?'teeodot':'teetee',childMark=r.unique?'teeodot':'crowodot';
 dot+=`"${r.parent}" -> "${r.child}" [arrowtail="${parentMark}",arrowhead="${childMark}"${r.parent===r.child?',constraint=false':''}];\n`;
}
dot+='}';
fs.writeFileSync(path.join(out,'DMS_ERD_Clean.dot'),dot);
(async()=>{const viz=await instance();const svg=viz.renderString(dot,{format:'svg',engine:'dot'});fs.writeFileSync(path.join(out,'DMS_ERD_Clean_graph.svg'),svg);await sharp(Buffer.from(svg),{density:144}).png().toFile(path.join(out,'DMS_ERD_Clean_graph.png'));await sharp(Buffer.from(svg)).resize({width:2000}).png().toFile(path.join(root,'tmp/report/clean_erd_preview.png'));console.log({tables:models.length,fields:count,relationships:relations.length,...await sharp(path.join(out,'DMS_ERD_Clean_graph.png')).metadata()});})();




