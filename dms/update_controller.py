import re

with open("server/src/documents/documents.controller.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("await this.documentsService.findOne(id);", "await this.documentsService.findOne(id, user);")

with open("server/src/documents/documents.controller.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated controller")
