const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/app/(main)/submissions/create/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replaceAll('router.push(/documents/);', 'router.push(/documents/?source=submissions);');
c = c.replaceAll('router.push("/documents/" + (created.id || (created as any)?.real_id || ""));', 'router.push("/documents/" + (created.id || (created as any)?.real_id || "") + "?source=submissions");');

fs.writeFileSync(path, c);
console.log('done');
