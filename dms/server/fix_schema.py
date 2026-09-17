with open("prisma/schema.prisma", "r", encoding="utf-8") as f:
    content = f.read()

import re
content = re.sub(r'visibility\s+Json\?.*?\n', '', content)
content = content.replace("is_deleted  Boolean        @default(false)", "is_deleted  Boolean        @default(false)\n    visibility  Json?")

with open("prisma/schema.prisma", "w", encoding="utf-8", newline="") as f:
    f.write(content)
print("Fixed schema")
