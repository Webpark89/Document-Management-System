import re

with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_logic = "const hasPerm = (itemKey: string, action: string = 'view') =>\n    !user?.permissions ? true : !!user.permissions.includes(`auditlog.${itemKey}:${action}`);"
good_logic = "const hasPerm = (itemKey: string, action: string = 'view') =>\n    user?.role === \"Administrator\" || !!user?.permissions?.includes(`auditlog.${itemKey}:${action}`);"

content = content.replace(bad_logic, good_logic)

with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated audit logs permissions securely")
