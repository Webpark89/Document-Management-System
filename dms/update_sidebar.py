import re

with open("client/src/views/components/folders/FolderSidebar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove getVisibilityIcon usage
pattern = r'<span title=\{VISIBILITY_LABEL\[folder\.visibility\]\}>\s*\{getVisibilityIcon\(folder\.visibility\)\}\s*<\/span>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open("client/src/views/components/folders/FolderSidebar.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated FolderSidebar.tsx")
