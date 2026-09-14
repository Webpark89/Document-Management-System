const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/app/(main)/approvals/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');",
  "const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');\n  const [lastViewed] = useState(() => { if (typeof window !== 'undefined') return parseInt(localStorage.getItem('lastViewedApprovals') || '0', 10); return 0; });"
);

const target_tr =                     <tr\n                        key={item.id};
const replacement_tr =                     <tr\n                        key={item.id}\n                        data-is-new={item.status === "Pending" && (item.rawSubmittedDate || 0) > lastViewed};
c = c.replace(target_tr, replacement_tr);

const target_class = "className={	ransition-colors group }";
const replacement_class = "className={	ransition-colors group  }";
c = c.replace(target_class, replacement_class);

fs.writeFileSync(path, c);
console.log('done');
