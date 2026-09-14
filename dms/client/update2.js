const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/views/components/shared/Sidebar.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  '    if (isDocsRoute(pathname)) {\n      setDocsExpanded(true);\n    }\n  }, [pathname]);',
  '    if (isDocsRoute(pathname) && source !== "submissions") {\n      setDocsExpanded(true);\n    }\n  }, [pathname, source]);'
);

fs.writeFileSync(path, c);
console.log('done');
