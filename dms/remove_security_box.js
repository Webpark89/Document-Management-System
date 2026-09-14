const fs = require('fs');
const file = 'client/src/app/(main)/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove state
content = content.replace('const [sendingResetLink, setSendingResetLink] = useState(false);\n', '');

// 2. Remove function
const funcStr = `  const handleSendResetLink = async () => {
    setSendingResetLink(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSendingResetLink(false);
    showToast("ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณ", "success");
  };\n`;
content = content.replace(funcStr, '');

// 3. Remove JSX
const jsxStart = content.indexOf('<section className={CARD_CLASS}>');
const jsxTextToFind = 'Reset Password"}';
const jsxEndInside = content.indexOf(jsxTextToFind, jsxStart);
if (jsxStart !== -1 && jsxEndInside !== -1) {
  // Find the closing </section> after jsxEndInside
  const jsxEnd = content.indexOf('</section>', jsxEndInside) + '</section>'.length;
  if (jsxEnd !== -1) {
    const sectionStr = content.substring(jsxStart, jsxEnd);
    if (sectionStr.includes('Security')) {
      content = content.replace(sectionStr, '');
    }
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Removed security box!');
