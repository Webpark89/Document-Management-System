const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../client/src/app/(main)/admin/master-data');
const p1 = path.join(dir, 'page.tsx');
if (fs.existsSync(p1)) {
  let content = fs.readFileSync(p1, 'utf-8');
  content = content.replace(/value="MEMO"/g, 'value="บันทึก"');
  content = content.replace(/บันทึกข้อความ \(MEMO\)/g, 'บันทึกข้อความ (BK)');
  content = content.replace(/"MEMO"/g, '"บันทึก"');
  content = content.replace(/'MEMO'/g, "'บันทึก'");
  fs.writeFileSync(p1, content);
  console.log('Fixed', p1);
}

const dir2 = path.join(__dirname, '../client/src/app/(main)/approvals/history');
const p2 = path.join(dir2, 'page.tsx');
if (fs.existsSync(p2)) {
  let content = fs.readFileSync(p2, 'utf-8');
  content = content.replace(/MEMO-2026/g, 'BK-2026');
  fs.writeFileSync(p2, content);
  console.log('Fixed', p2);
}

const dir3 = path.join(__dirname, '../client/src/views/features/master-data/components');
const p3 = path.join(dir3, 'DocumentTypesTab.tsx');
if (fs.existsSync(p3)) {
  let content = fs.readFileSync(p3, 'utf-8');
  content = content.replace(/Memo/g, 'BK');
  content = content.replace(/MEMO/g, 'BK');
  content = content.replace(/"บันทึก"/g, '"บันทึก"'); // just to check
  fs.writeFileSync(p3, content);
  console.log('Fixed', p3);
}
