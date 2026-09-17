with open('client/src/app/(main)/documents/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("  Plus,\n  X\n} from \"lucide-react\";", "  Plus,\n  X,\n  Check\n} from \"lucide-react\";")

with open('client/src/app/(main)/documents/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Check to lucide-react imports")
