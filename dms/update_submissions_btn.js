const fs = require('fs');

const file = 'd:/Document Management/dms/client/src/app/(main)/submissions/page.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /href="\/approvals\/history"([\s\S]+?)ประวัติการอนุมัติ/m,
  'href="/submissions/history"$1ประวัติการถูกอนุมัติ'
);

fs.writeFileSync(file, c, 'utf8');
