with open("prisma/schema.prisma", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("visibility  Json?", "visibility_type String @default(\"CompanyWide\")\n    visibility_departments String[]\n    visibility_users String[]")

with open("prisma/schema.prisma", "w", encoding="utf-8", newline="") as f:
    f.write(content)
print("Updated schema to explicit arrays")
