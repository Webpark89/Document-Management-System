const fs = require('fs');
const file = 'd:/Document Management/dms/client/src/views/components/forms/PRForm.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(
  'if (isViewer && initialData?.workflow?.steps) {',
  'if (isViewer && initialData?.workflow?.steps) { console.log("Workflow Steps:", initialData.workflow.steps);'
);
fs.writeFileSync(file, c, 'utf8');
