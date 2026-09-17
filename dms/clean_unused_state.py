import re

files = [
    "client/src/views/components/forms/BKForm.tsx",
    "client/src/views/components/forms/POForm.tsx",
    "client/src/views/components/forms/PRForm.tsx"
]

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove the state
    content = re.sub(r'\s*const \[uploadedFile, setUploadedFile\] = useState<File \| null>\(null\);', '', content)
    
    # Remove handleFileChange
    handleFile_pattern = r'\s*const handleFileChange = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[^}]+\};\n'
    content = re.sub(handleFile_pattern, '', content)

    # Remove attachmentFileName
    content = re.sub(r'\s*attachmentFileName:\s*uploadedFile\s*\?\s*uploadedFile\.name\s*:\s*undefined,', '', content)

    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Cleaned {file}")
