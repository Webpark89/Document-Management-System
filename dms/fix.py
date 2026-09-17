with open('client/src/app/(main)/documents/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("name: \`\${u.first_name} \${u.last_name}\`,", "name: `${u.first_name} ${u.last_name}`,")

with open('client/src/app/(main)/documents/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed template literals")
