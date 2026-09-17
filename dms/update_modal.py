import re

# 1. FolderCreateModal.tsx
with open("client/src/views/components/folders/FolderCreateModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace visibility UI
content = re.sub(r'\{\/\* Visibility \*\/\}.*?(?=\{\/\* Actions \*\/\})', '', content, flags=re.DOTALL)

with open("client/src/views/components/folders/FolderCreateModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated FolderCreateModal UI")
