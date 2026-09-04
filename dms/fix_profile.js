const fs = require('fs');
let file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');
const formatFunc = `
function formatEmployeeId(u: any): string {
  if (!u) return "—";
  if (u.employee_id && typeof u.employee_id === "string" && !u.employee_id.includes("-")) {
    return u.employee_id;
  }
  const username = u.username || "";
  if (username.toLowerCase() === "admin") return "EMP-00001";
  const match = username.match(/\\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return \`EMP-\${String(100 + num).padStart(5, "0")}\`;
  }
  const idStr = String(u.id || "");
  if (idStr.length > 0) {
    const hex = idStr.replace(/-/g, "").substring(0, 6);
    const num = (parseInt(hex, 16) % 90000) + 10000;
    return \`EMP-\${num}\`;
  }
  return "EMP-00101";
}
`;

content = content.replace('export default function ProfilePage', formatFunc + '\nexport default function ProfilePage');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed');
