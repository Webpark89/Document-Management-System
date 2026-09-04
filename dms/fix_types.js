const fs = require('fs');
let file = 'client/src/views/components/documents/DocumentPreview.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('api.get("/api/admin/settings")', 'api.get<any>("/api/admin/settings")');
fs.writeFileSync(file, content, 'utf8');

file = 'client/src/views/components/forms/PRForm.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace('api.get("/api/admin/settings")', 'api.get<any>("/api/admin/settings")');
fs.writeFileSync(file, content, 'utf8');

file = 'client/src/views/components/forms/POForm.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace('api.get("/api/admin/settings")', 'api.get<any>("/api/admin/settings")');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed types');
