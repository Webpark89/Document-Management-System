import re

with open("server/src/documents/documents.service.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the old where.OR logic
old_logic = r"if \(currentUserRole !== 'Administrator' && currentUserId\) \{\n\s*where\.OR = \[\{ creator_id: currentUserId \}, \{ status: 'Approved' \}\];\n\s*\}"

new_logic = """if (currentUserRole !== 'Administrator' && currentUserId) {
      const userObj = await this.prisma.user.findUnique({ where: { id: currentUserId } });
      const deptId = userObj?.department_id;
      
      const visibilityConditions: any[] = [
        { visibility_type: 'CompanyWide' },
        { visibility_users: { has: currentUserId } }
      ];
      if (deptId) {
        visibilityConditions.push({ visibility_departments: { has: deptId } });
      }
      
      where.AND = [
        { OR: visibilityConditions }
      ];
    }"""

content = re.sub(old_logic, new_logic, content)

# Fix search logic to use AND if needed
search_logic_old = r"if \(search\) \{\n\s*where\.OR = \[\n\s*\{ title: \{ contains: search, mode: 'insensitive' \} \},"
search_logic_new = """if (search) {
      const searchOr = [
        { title: { contains: search, mode: 'insensitive' } },
        { doc_number: { contains: search, mode: 'insensitive' } },
        { search_text: { contains: search, mode: 'insensitive' } },
      ];
      if (where.AND) {
        (where.AND as any[]).push({ OR: searchOr });
      } else {
        where.AND = [{ OR: searchOr }];
      }"""
# Wait, let's just replace the whole search block safely
content = re.sub(r'if \(search\) \{\n\s*where\.OR = \[\n\s*\{ title: \{ contains: search, mode: \'insensitive\' \} \},\n\s*\{ doc_number: \{ contains: search, mode: \'insensitive\' \} \},\n\s*\{ search_text: \{ contains: search, mode: \'insensitive\' \} \},\n\s*\];\n\s*\}', search_logic_new + "\n    }", content)

with open("server/src/documents/documents.service.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated findAll visibility logic")
