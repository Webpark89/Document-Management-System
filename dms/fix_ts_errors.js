const fs = require('fs');

// Fix 1: master-data/types.ts duplicate employeeCount
const mdTypesPath = 'd:/Document Management/dms/client/src/views/features/master-data/types.ts';
let mdContent = fs.readFileSync(mdTypesPath, 'utf8');
mdContent = mdContent.replace("  employeeCount: number;\n  isActive: boolean;\n  employeeCount?: number;", "  employeeCount: number;\n  isActive: boolean;");
fs.writeFileSync(mdTypesPath, mdContent, 'utf8');

// Fix 2: submissions/history/page.tsx Date TS errors
const subHistPath = 'd:/Document Management/dms/client/src/app/(main)/submissions/history/page.tsx';
let subContent = fs.readFileSync(subHistPath, 'utf8');

subContent = subContent.replace(
  /rawCreatedAt: doc\.created_at,/g,
  'rawCreatedAt: doc.created_at || new Date().toISOString(),'
);

subContent = subContent.replace(
  /formatThaiDate\(new Date\(doc\.created_at\)\)/g,
  'formatThaiDate(new Date(doc.created_at || Date.now()))'
);

subContent = subContent.replace(
  /const itemDate = new Date\(item\.rawCreatedAt\)\.getTime\(\);/g,
  'const itemDate = new Date(item.rawCreatedAt || Date.now()).getTime();'
);

subContent = subContent.replace(
  /valA = new Date\(a\.rawCreatedAt\)\.getTime\(\);/g,
  'valA = new Date(a.rawCreatedAt || Date.now()).getTime();'
);

subContent = subContent.replace(
  /valB = new Date\(b\.rawCreatedAt\)\.getTime\(\);/g,
  'valB = new Date(b.rawCreatedAt || Date.now()).getTime();'
);

fs.writeFileSync(subHistPath, subContent, 'utf8');
