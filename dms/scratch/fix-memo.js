const fs = require('fs');
const path = require('path');

const files = [
  'client/src/app/(main)/admin/reports/page.tsx',
  'client/src/app/(main)/dashboard/page.tsx',
  'client/src/app/(main)/documents/upload/page.tsx',
  'client/src/views/components/forms/BKForm.tsx'
];

const dir = path.join(__dirname, '..');

files.forEach(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf-8');

  if (f.endsWith('upload/page.tsx')) {
    content = content.replace(/MemoForm/g, 'BKForm');
    content = content.replace(/MemoSubmitData/g, 'BKSubmitData');
    content = content.replace(/"Memo"/g, '"บันทึก"');
    content = content.replace(/=== "MEMO"/g, '=== "BK"');
    content = content.replace(/"MEMO"/g, '"BK"');
    content = content.replace(/handleMemoSubmit/g, 'handleBKSubmit');
    content = content.replace(/เอกสารบันทึกข้อมูล \(Memo\)/g, 'บันทึกข้อความ (BK)');
    content = content.replace(/Memo: "#10b981"/g, 'บันทึก: "#10b981"');
    content = content.replace(/Memo: 0/g, 'บันทึก: 0');
    content = content.replace(/counts\.Memo/g, 'counts["บันทึก"]');
    content = content.replace(/TYPE_COLORS\.Memo/g, 'TYPE_COLORS["บันทึก"]');
    content = content.replace(/type === "บันทึก"\s*\?\s*"MEMO"/g, 'type === "บันทึก" ? "BK"');
  } else if (f.endsWith('dashboard/page.tsx')) {
    content = content.replace(/"Memo"/g, '"บันทึก"');
    content = content.replace(/Memo: "#10b981"/g, 'บันทึก: "#10b981"');
    content = content.replace(/Memo: 0/g, 'บันทึก: 0');
    content = content.replace(/counts\.Memo/g, 'counts["บันทึก"]');
    content = content.replace(/TYPE_COLORS\.Memo/g, 'TYPE_COLORS["บันทึก"]');
  } else if (f.endsWith('reports/page.tsx')) {
    content = content.replace(/"Memo"/g, '"บันทึก"');
  } else if (f.endsWith('BKForm.tsx')) {
    content = content.replace(/MemoSubmitData/g, 'BKSubmitData');
    content = content.replace(/MemoForm/g, 'BKForm');
  }

  fs.writeFileSync(p, content);
  console.log('Fixed', f);
});
