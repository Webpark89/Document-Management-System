import re

with open("client/src/app/(main)/admin/config/roles/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_onclick = r'onClick=\{\(\) =>\s*router\.push\(\`/admin/config/roles\?mode=edit&id=\$\{role\.id\}\`\)\s*\}'
good_onclick = r'onClick={() => {\n                          if (hasPerm("role_management", "edit")) {\n                            router.push(`/admin/config/roles?mode=edit&id=${role.id}`);\n                          }\n                        }}'

content = re.sub(bad_onclick, good_onclick, content)

with open("client/src/app/(main)/admin/config/roles/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated roles page")
