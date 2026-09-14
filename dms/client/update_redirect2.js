const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/app/(main)/submissions/create/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replaceAll('router.push(/documents/$' + '{editId});', 'router.push(/documents/$' + '{editId}?source=submissions);');

fs.writeFileSync(path, c);
console.log('done');
