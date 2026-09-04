const fs = require('fs');

function fixForm(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('import { API_BASE_URL } from "@/lib/api";\nimport { useAuth }', 'import { api } from "@/lib";\nimport { useAuth }');
  
  const regex = /fetch\(`\$\{API_BASE_URL\}\/api\/admin\/settings`, \{\s*headers: \{ "Authorization": `Bearer \$\{localStorage\.getItem\("token"\)\}` \}\s*\}\)\s*\.then\(res => res\.json\(\)\)\s*\.then\(data => \{\s*if \(data\.companyName\) setCompanySettings\(data\);\s*\}\)\s*\.catch\(\(\) => \{\}\);/g;
  
  content = content.replace(regex, 'api.get("/api/admin/settings").then(res => { if (res.data?.companyName) setCompanySettings(res.data); }).catch(() => {});');
  
  fs.writeFileSync(file, content, 'utf8');
}

fixForm('client/src/views/components/forms/PRForm.tsx');
fixForm('client/src/views/components/forms/POForm.tsx');

let previewFile = 'client/src/views/components/documents/DocumentPreview.tsx';
let preview = fs.readFileSync(previewFile, 'utf8');
preview = preview.replace('import { API_BASE_URL } from "@/lib/api";', 'import { api } from "@/lib";');
const regexPrev = /fetch\(`\$\{API_BASE_URL\}\/api\/admin\/settings`, \{\s*headers: \{ "Authorization": `Bearer \$\{localStorage\.getItem\("token"\)\}` \}\s*\}\)\s*\.then\(res => res\.json\(\)\)\s*\.then\(data => \{\s*if \(data\.companyName\) setCompanySettings\(data\);\s*\}\)\s*\.catch\(\(\) => \{\}\);/g;
preview = preview.replace(regexPrev, 'api.get("/api/admin/settings").then(res => { if (res.data?.companyName) setCompanySettings(res.data); }).catch(() => {});');
fs.writeFileSync(previewFile, preview, 'utf8');

console.log('Fixed forms');
