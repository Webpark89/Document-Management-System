with open('client/src/app/(main)/submissions/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("router.push(`/documents/${item.real_id}`);", "router.push(`/documents/${item.real_id}?source=submissions`);")

with open('client/src/app/(main)/submissions/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated router.push")
