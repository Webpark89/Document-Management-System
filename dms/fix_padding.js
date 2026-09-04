const fs = require('fs');
let file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/px-6 py-5 border-b/g, 'px-8 py-6 border-b');
content = content.replace(/<div className="p-6">/g, '<div className="p-8">');
content = content.replace(/<div className="p-6 space-y-4">/g, '<div className="p-8 space-y-6">');

fs.writeFileSync(file, content, 'utf8');
