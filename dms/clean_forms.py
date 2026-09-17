import re

files = [
    "client/src/views/components/forms/BKForm.tsx",
    "client/src/views/components/forms/POForm.tsx",
    "client/src/views/components/forms/PRForm.tsx",
    "client/src/views/components/forms/UploadOnlyForm.tsx"
]

for file in files:
    try:
        with open(file, "r", encoding="utf-8") as f:
            content = f.read()

        # Remove uploadedFile state and handleFileChange if they are specifically for Step2
        # But wait, UploadOnlyForm obviously needs a file! It might use uploadedFile for its main purpose.
        # Let's just remove the props passed to Step2Visibility.
        
        content = re.sub(r'\s*uploadedFile=\{[^\}]+\}', '', content)
        content = re.sub(r'\s*onFileChange=\{[^\}]+\}', '', content)

        with open(file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Cleaned {file}")
    except Exception as e:
        print(f"Error processing {file}: {e}")
