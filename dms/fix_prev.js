const fs = require('fs');

let file = 'client/src/views/components/documents/DocumentPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace React import
content = content.replace('import React from "react";', 'import React, { useState, useEffect } from "react";\nimport { api } from "@/lib";');

// replace useSignatures to add state
let targetPrev = 'const { signatures, findByApproverName } = useSignatures();';
content = content.replace(targetPrev, targetPrev + '\n\n  const [companySettings, setCompanySettings] = useState({\n    companyName: "\\u0E1A\\u0E23\\u0E34\\u0E29\\u0E31\\u0E17 \\u0E19\\u0E34\\u0E2A\\u0E0B\\u0E38\\u0E22 (\\u0E1B\\u0E23\\u0E30\\u0E40\\u0E17\\u0E28\\u0E44\\u0E17\\u0E22) \\u0E08\\u0E33\\u0E01\\u0E31\\u0E14",\n    companyAddress: "\\u0E40\\u0E25\\u0E02\\u0E17\\u0E35\\u0E48 123 \\u0E2D\\u0E32\\u0E04\\u0E32\\u0E23\\u0E19\\u0E34\\u0E2A\\u0E0B\\u0E38\\u0E22 \\u0E16\\u0E19\\u0E19\\u0E2A\\u0E38\\u0E02\\u0E38\\u0E21\\u0E27\\u0E34\\u0E17 \\u0E41\\u0E02\\u0E27\\u0E07\\u0E04\\u0E25\\u0E2D\\u0E07\\u0E40\\u0E15\\u0E22 \\u0E40\\u0E02\\u0E15\\u0E04\\u0E25\\u0E2D\\u0E07\\u0E40\\u0E15\\u0E22 \\u0E01\\u0E23\\u0E38\\u0E07\\u0E40\\u0E17\\u0E1E\\u0E21\\u0E2B\\u0E32\\u0E19\\u0E04\\u0E23 10110\\n\\u0E40\\u0E25\\u0E02\\u0E1B\\u0E23\\u0E30\\u0E08\\u0E33\\u0E15\\u0E31\\u0E27\\u0E1C\\u0E39\\u0E49\\u0E40\\u0E2A\\u0E35\\u0E22\\u0E20\\u0E32\\u0E29\\u0E35: 0105559000123"\n  });\n\n  useEffect(() => {\n    api.get("/api/admin/settings").then(res => { if (res.data?.companyName) setCompanySettings(res.data); }).catch(() => {});\n  }, []);');

// Replace strings
content = content.replace(/buyerName: ".*?"/g, 'buyerName: companySettings.companyName');
content = content.replace(/buyerAddress: ".*?"/g, 'buyerAddress: companySettings.companyAddress');
content = content.replace(/buyerTaxId: "0105559000123"/g, 'buyerTaxId: ""');
content = content.replace(/<div className={`w-16 h-16 border-2 \$\{primaryBorder\} flex items-center justify-center font-black text-xl \$\{primaryText\}`}>\s*LOGO\s*<\/div>\s*<div>/, '<div>');
content = content.replace(/<p className="text-slate-700 mt-1 font-semibold">.*?: \{meta\.buyerTaxId\}<\/p>/, '{meta.buyerTaxId && <p className="text-slate-700 mt-1 font-semibold">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35: {meta.buyerTaxId}</p>}');
content = content.replace(/<p className="text-slate-700 mt-1 max-w-\[200px\] leading-tight">\{meta\.buyerAddress\}<\/p>/, '<p className="text-slate-700 mt-1 max-w-[200px] leading-tight whitespace-pre-wrap">{meta.buyerAddress}</p>');

fs.writeFileSync(file, content, 'utf8');
