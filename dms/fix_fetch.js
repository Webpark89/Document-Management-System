const fs = require('fs');

function fixFile(file, needsImport) {
  let content = fs.readFileSync(file, 'utf8');
  if (needsImport && !content.includes('API_BASE_URL')) {
    content = content.replace('import { useAuth }', 'import { API_BASE_URL } from "@/lib/api";\nimport { useAuth }');
  }
  content = content.replace(/fetch\("\/api\/admin\/settings"\)/g, 'fetch(`${API_BASE_URL}/api/admin/settings`)');
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('client/src/views/components/forms/PRForm.tsx', true);
fixFile('client/src/views/components/forms/POForm.tsx', true);
fixFile('client/src/views/components/documents/DocumentPreview.tsx', false);

console.log("Fixed");
