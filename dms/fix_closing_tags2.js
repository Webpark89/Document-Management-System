const fs = require('fs');
const file = 'client/src/app/(main)/profile/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

lines[304] = '              {/* Sidebar Removed */}';
lines[305] = ''; // Removed <div className="space-y-6">

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Fixed tags by line array!');
