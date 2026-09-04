const fs = require('fs');
let file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the Edit Profile button
const buttonRegex = /\{hasPerm\('edit_own', 'edit'\) && \([\s\S]*?<button type="button" onClick=\{handleEditInfo\}[\s\S]*?Edit Profile[\s\S]*?<\/button>\s*\)\}/m;
content = content.replace(buttonRegex, '');

// 2. Remove the handleEditInfo function
const handlerRegex = /const handleEditInfo = \(\) => \{\s*showToast\("ฟีเจอร์แก้ไขข้อมูลจะเปิดใช้งานในเฟสถัดไป", "success"\);\s*\};\s*/m;
content = content.replace(handlerRegex, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed Edit Profile button');
