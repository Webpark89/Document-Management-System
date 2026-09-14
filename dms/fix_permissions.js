const fs = require('fs');
const file = 'server/src/admin/admin.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `@Get('users')
  @Permissions('config.user_management:view', 'config.access:view')
  async getUsers()`;

const replacement = `@Get('users')
  async getUsers()`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed permissions!');
} else {
  console.log('Target not found.');
}
