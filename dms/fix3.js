const fs = require('fs');

['PRForm', 'POForm', 'BKForm'].forEach(f => {
  const file = 'd:/Document Management/dms/client/src/views/components/forms/' + f + '.tsx';
  let c = fs.readFileSync(file, 'utf8');
  c = c.split('className="border border-slate-800 p-1 flex flex-col h-28 relative group"').join('className="border border-slate-800 p-1 flex flex-col h-28 relative group pointer-events-auto"');
  fs.writeFileSync(file, c, 'utf8');
});
