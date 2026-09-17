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

    # Add visibility to onSubmit payload
    # For PRForm, POForm, BKForm, UploadOnlyForm
    content = content.replace("workflowSteps,\n        isDraft,", "workflowSteps,\n        visibility,\n        isDraft,")

    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {file}")
