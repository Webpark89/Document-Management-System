import re

with open("client/src/app/(main)/admin/config/users/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_double_click = r'onDoubleClick=\{\(\) => setEditUser\(user\)\}'
good_double_click = r'onDoubleClick={() => { if (hasPerm("user_management", "edit")) setEditUser(user); }}'

content = re.sub(bad_double_click, good_double_click, content)

with open("client/src/app/(main)/admin/config/users/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated users page")
