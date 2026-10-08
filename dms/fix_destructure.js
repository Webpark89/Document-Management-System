const fs = require('fs');

['PRForm', 'POForm', 'BKForm'].forEach(f => {
  const file = 'd:/Document Management/dms/client/src/views/components/forms/' + f + '.tsx';
  let c = fs.readFileSync(file, 'utf8');

  // Fix function signature destructuring
  c = c.replace(/initialData,\s*isViewer\s*\}\:\s*[A-Za-z]+Props\)/g, 'initialData, isViewer, tempSignature, onSignClick }: any)');
  c = c.replace(/initialData,\s*isViewer\s*$/m, 'initialData, isViewer, tempSignature, onSignClick');

  fs.writeFileSync(file, c, 'utf8');
});
