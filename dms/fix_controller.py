import re

with open("server/src/documents/documents.controller.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Fix findVersions
content = content.replace("async findVersions(@Param('id') id: string) {", "async findVersions(@Param('id') id: string, @CurrentUser() user?: any) {")

with open("server/src/documents/documents.controller.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated controller findVersions")
