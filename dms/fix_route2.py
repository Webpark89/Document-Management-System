with open('client/src/app/(main)/submissions/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("href={`/documents/${item.id}?source=submissions`}", "href={`/documents/${item.real_id}?source=submissions`}")

with open('client/src/app/(main)/submissions/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Eye button")
