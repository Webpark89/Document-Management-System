const fs = require('fs');
let file = 'client/src/app/(main)/approvals/history/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = 'actionDate: step.action_date ? new Date(step.action_date).toLocaleDateString("th-TH") : "—",';
const replacement = 'actionDate: step.action_date ? new Date(step.action_date).toLocaleString("th-TH", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed date format!');
} else {
  console.log('Target not found!');
}
