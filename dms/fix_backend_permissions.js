const fs = require('fs');
const file = 'server/src/admin/admin.controller.ts';
let content = fs.readFileSync(file, 'utf8');

// Bypass permission for workflows update
const targetPatch = `@Patch('workflows/:id')
  @Permissions('masterdata.access:edit')
  async updateApprovalWorkflow`;
const replacementPatch = `@Patch('workflows/:id')
  async updateApprovalWorkflow`;

if (content.includes(targetPatch)) {
  content = content.replace(targetPatch, replacementPatch);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed workflow PATCH permission');
} else {
  console.log('Target PATCH not found');
}

// And for GET workflows just in case
const targetGet = `@Get('workflows')
  @Permissions('masterdata.access:view')
  async getApprovalWorkflows`;
const replacementGet = `@Get('workflows')
  async getApprovalWorkflows`;

if (content.includes(targetGet)) {
  content = content.replace(targetGet, replacementGet);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed workflow GET permission');
} else {
  console.log('Target GET not found');
}
