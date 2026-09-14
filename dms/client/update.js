const fs = require('fs');
const path = 'd:/Document Management/dms/client/src/views/components/shared/Sidebar.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  'const folderId = searchParams?.get("folderId");',
  'const folderId = searchParams?.get("folderId");\n    const source = searchParams?.get("source");'
);

c = c.replace(
  'const [docsExpanded, setDocsExpanded] = useState(() => isDocsRoute(pathname));',
  'const [docsExpanded, setDocsExpanded] = useState(() => isDocsRoute(pathname) && source !== "submissions");'
);

c = c.replace(
  '    if (isDocsRoute(pathname)) {\n      setDocsExpanded(true);\n    }\n  }, [pathname]);',
  '    if (isDocsRoute(pathname) && source !== "submissions") {\n      setDocsExpanded(true);\n    }\n  }, [pathname, source]);'
);

c = c.replace(
  'const isDocsActive = isDocsRoute(pathname) && (!isOpen || !docsExpanded);',
  'const isDocsActive = isDocsRoute(pathname) && source !== "submissions" && (!isOpen || !docsExpanded);'
);

c = c.replace(
  /const isActive = isNavItemActive\(pathname, item\.href\);/g,
  'let isActive = isNavItemActive(pathname, item.href);\n          if (item.href === "/submissions" && source === "submissions") isActive = true;\n          if (item.href === "/approvals" && source === "submissions") isActive = false;'
);

fs.writeFileSync(path, c);
console.log('done');
