import re

files = [
    "client/src/views/components/forms/BKForm.tsx",
    "client/src/views/components/forms/POForm.tsx",
    "client/src/views/components/forms/PRForm.tsx"
]

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()

    # Match the entire handleFileChange function
    content = re.sub(r'\s*const handleFileChange = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?setUploadedFile[\s\S]*?};\n', '\n', content)

    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Cleaned {file}")
