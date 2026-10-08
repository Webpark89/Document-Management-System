const fs = require('fs');

function patchForm2(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix destructuring
  content = content.replace(
    /isViewer = false\r?\n\}\: [A-Z]+FormProps\)/,
    'isViewer = false,\n  tempSignature,\n  onSignClick\n}: any)'
  );
  content = content.replace(
    /isViewer = false\r?\n\}\: PRFormProps\)/,
    'isViewer = false,\n  tempSignature,\n  onSignClick\n}: PRFormProps)'
  );
  content = content.replace(
    /isViewer = false\r?\n\}\: POFormProps\)/,
    'isViewer = false,\n  tempSignature,\n  onSignClick\n}: POFormProps)'
  );
  content = content.replace(
    /isViewer = false\r?\n\}\: BKFormProps\)/,
    'isViewer = false,\n  tempSignature,\n  onSignClick\n}: BKFormProps)'
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

patchForm2('d:/Document Management/dms/client/src/views/components/forms/PRForm.tsx');
patchForm2('d:/Document Management/dms/client/src/views/components/forms/POForm.tsx');
patchForm2('d:/Document Management/dms/client/src/views/components/forms/BKForm.tsx');
