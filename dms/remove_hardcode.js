const fs = require('fs');

function removeHardcode(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/companyName:\s*".*?"/, 'companyName: ""');
  content = content.replace(/companyAddress:\s*".*?"/, 'companyAddress: ""');
  fs.writeFileSync(file, content, 'utf8');
}

removeHardcode('client/src/views/components/forms/PRForm.tsx');
removeHardcode('client/src/views/components/forms/POForm.tsx');
removeHardcode('client/src/views/components/documents/DocumentPreview.tsx');
console.log('Removed hardcoded initial state');
