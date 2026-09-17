import re

files = [
    "client/src/views/components/forms/BKForm.tsx",
    "client/src/views/components/forms/POForm.tsx",
    "client/src/views/components/forms/PRForm.tsx",
    "client/src/views/components/forms/UploadOnlyForm.tsx"
]

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()

    # Change unknown[] to any[]
    content = content.replace("as unknown[];", "as any[];")

    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed unknown[] in {file}")
