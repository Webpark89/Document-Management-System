const fs = require('fs');
let file = 'client/src/app/(main)/approvals/history/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /actionDate:\s*step\.action_date\s*\?\s*new Date\(step\.action_date\)\.toLocaleString\([\s\S]*?\)\s*:\s*"—",/;
const replacement = 'actionDate: step.action_date || "—",';

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed date format 2!');
} else {
  console.log('Target not found!');
}
