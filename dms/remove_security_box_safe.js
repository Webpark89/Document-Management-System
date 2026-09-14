const fs = require('fs');
const file = 'client/src/app/(main)/profile/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

lines.splice(322, 22); // Removes 322 to 343
lines.splice(140, 6);  // Removes 140 to 145
lines.splice(73, 1);   // Removes line 73

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Removed successfully without touching layout!');
