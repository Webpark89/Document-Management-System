import re

with open("client/src/app/(main)/documents/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix phantom key
content = content.replace("hasPerm('view_metadata')", "hasPerm('view_detail')")

# Guard the Edit & Resubmit button
amber_box_pattern = r'(<div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50 shadow-sm space-y-3">.*?✏️ แก้ไขเอกสารเพื่อส่งใหม่ \(Edit & Resubmit\).*?<\/div>)'
amber_box_replacement = r'{hasPerm("edit_document", "edit") && (\1)}'
content = re.sub(amber_box_pattern, amber_box_replacement, content, flags=re.DOTALL)

with open("client/src/app/(main)/documents/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated documents/[id]/page.tsx")
