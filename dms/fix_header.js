const fs = require('fs');

const fallback = `setCompanySettings({ companyName: "บริษัท นิสซุย (ประเทศไทย) จำกัด", companyAddress: "เลขที่ 123 อาคารนิสซุย ถนนสุขุมวิท" });`;

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  const target = `.catch(() => {});`;
  const replacement = `.catch((err) => { console.error('Failed to fetch settings:', err); ${fallback} });`;
  
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + file);
  }
}

fixFile('client/src/views/components/forms/PRForm.tsx');
fixFile('client/src/views/components/forms/POForm.tsx');
fixFile('client/src/views/components/documents/DocumentPreview.tsx');
