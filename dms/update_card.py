import re

with open("client/src/views/components/folders/FolderCard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove visibility badge
pattern = r'<span\s+className=\{`text-\[10px\] font-bold px-2 py-0\.5 rounded-full border \$\{\s*VISIBILITY_COLOR\[folder\.visibility\]\s*\}\`\}\s*>\s*\{VISIBILITY_LABEL\[folder\.visibility\]\}\s*<\/span>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open("client/src/views/components/folders/FolderCard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated FolderCard.tsx")
