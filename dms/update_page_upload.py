import re

with open("client/src/app/(main)/submissions/create/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add visibility to formData in handleOtherSubmit (editId case with file)
content = content.replace("formData.append(\"workflow_steps\", JSON.stringify(workflowStepsMapped));", "formData.append(\"workflow_steps\", JSON.stringify(workflowStepsMapped));\n          formData.append(\"visibility\", JSON.stringify((data as any).visibility));")

# Add visibility to apiPayload in handleOtherSubmit (editId case without file)
content = content.replace("workflow_steps: workflowStepsMapped,", "visibility: (data as any).visibility,\n            workflow_steps: workflowStepsMapped,")

with open("client/src/app/(main)/submissions/create/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated create/page.tsx UploadOnly Form payload")
