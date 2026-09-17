with open("prisma/schema.prisma", "r", encoding="utf-8") as f:
    content = f.read()

# Fix BOM if present
if content.startswith("\ufeff"):
    content = content[1:]

content = content.replace("is_deleted  Boolean        @default(false)", "is_deleted  Boolean        @default(false)\n    visibility  Json?          // { type: string, departments: string[], users: string[] }")

with open("prisma/schema.prisma", "w", encoding="utf-8", newline="") as f:
    f.write(content)
print("Updated schema")
