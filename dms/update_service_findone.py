import re

with open("server/src/documents/documents.service.ts", "r", encoding="utf-8") as f:
    content = f.read()

find_one_logic_old = r"async findOne\(id: string\) \{\n\s*const isUuid ="
find_one_logic_new = """async findOne(id: string, user?: { id: string; role: string; department_id?: string }) {
    const isUuid ="""

content = re.sub(find_one_logic_old, find_one_logic_new, content)

# Inject access check after fetching document in findOne
find_one_check = r"return this\.mapDocumentToResponse\(doc\);\n\s*\}"
check_logic = """if (doc && user && user.role !== 'Administrator') {
      const isCreator = doc.creator_id === user.id;
      const isVisibleType = doc.visibility_type === 'CompanyWide';
      const isVisibleDept = doc.visibility_departments && user.department_id && doc.visibility_departments.includes(user.department_id);
      const isVisibleUser = doc.visibility_users && doc.visibility_users.includes(user.id);
      
      if (!isCreator && !isVisibleType && !isVisibleDept && !isVisibleUser) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้');
      }
    }
    return this.mapDocumentToResponse(doc);
  }"""
content = re.sub(find_one_check, check_logic, content)

with open("server/src/documents/documents.service.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated findOne in service")
