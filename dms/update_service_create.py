import re

with open("server/src/documents/documents.service.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add auto-grant logic function
auto_grant_logic = """
  private processVisibility(visibility: any, creatorId: string, workflowSteps: any[]) {
    let visibilityType = 'CompanyWide';
    let visibilityDepts: string[] = [];
    let visibilityUsers: string[] = [];

    if (visibility) {
      if (typeof visibility === 'string') {
        try { visibility = JSON.parse(visibility); } catch (e) {}
      }
      visibilityType = visibility.type || 'CompanyWide';
      visibilityDepts = visibility.departments || [];
      visibilityUsers = visibility.users || [];
    }

    if (visibilityType !== 'CompanyWide') {
      visibilityUsers.push(creatorId);
      if (workflowSteps) {
        for (const step of workflowSteps) {
          let stepData = step;
          if (typeof step === 'string') {
            try { stepData = JSON.parse(step); } catch (e) {}
          }
          if (stepData && stepData.approver_id) {
            visibilityUsers.push(stepData.approver_id);
          }
        }
      }
      visibilityUsers = [...new Set(visibilityUsers)];
    }

    return { visibility_type: visibilityType, visibility_departments: visibilityDepts, visibility_users: visibilityUsers };
  }
"""

if "private processVisibility" not in content:
    content = content.replace("export class DocumentsService {", "export class DocumentsService {\n" + auto_grant_logic)

# In create()
content = re.sub(
    r'const doc = await tx\.document\.create\(\{\n\s*data: \{',
    r'const vis = this.processVisibility((dto as any).visibility, creator.id, dto.workflow_steps);\n          const doc = await tx.document.create({\n            data: {\n              ...vis,',
    content
)

# In createWithFile()
# It uses fields from body. We need to pass creatorId and approverIds
# createWithFile has `approver_ids` which is an array of strings in formData, or JSON stringified.
# Let's map approver_ids to workflowSteps mock for processVisibility
content = re.sub(
    r'const doc = await tx\.document\.create\(\{\n\s*data: \{',
    r'let approversMock = [];\n          try { approversMock = JSON.parse(approver_ids as string).map(id => ({ approver_id: id })); } catch (e) { approversMock = []; }\n          const vis = this.processVisibility((body as any).visibility, creator.id, approversMock);\n          const doc = await tx.document.create({\n            data: {\n              ...vis,',
    content
)

# In updateDocumentFull()
content = re.sub(
    r'const doc = await tx\.document\.update\(\{\n\s*where: \{ id \},\n\s*data: \{',
    r'const existing = await tx.document.findUnique({ where: { id } });\n          const vis = this.processVisibility((dto as any).visibility, existing?.creator_id || userId, dto.workflow_steps);\n          const doc = await tx.document.update({\n            where: { id },\n            data: {\n              ...vis,',
    content
)

# In updateDocumentFullWithFile()
content = re.sub(
    r'const doc = await tx\.document\.update\(\{\n\s*where: \{ id \},\n\s*data: \{',
    r'const existing = await tx.document.findUnique({ where: { id } });\n          let approversMock = [];\n          try { approversMock = JSON.parse(approver_ids as string).map(id => ({ approver_id: id })); } catch (e) { approversMock = []; }\n          const vis = this.processVisibility((body as any).visibility, existing?.creator_id, approversMock);\n          const doc = await tx.document.update({\n            where: { id },\n            data: {\n              ...vis,',
    content
)

with open("server/src/documents/documents.service.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated documents.service.ts creation logic")
