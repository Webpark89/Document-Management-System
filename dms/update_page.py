import re

with open("client/src/app/(main)/submissions/create/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# For handlePRSubmit, handlePOSubmit, handleBKSubmit, handleUploadOnlySubmit
# We add visibility: data.visibility to apiPayload

content = content.replace("workflow_steps: data.workflowSteps", "visibility: (data as any).visibility,\n        workflow_steps: data.workflowSteps")

with open("client/src/app/(main)/submissions/create/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated create/page.tsx payload")
