import re

with open('client/src/app/(main)/documents/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

getTypeColor_code = '''  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PR': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'PO': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'BK': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'DOC': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };'''

# Insert getTypeColor before handleSort
content = content.replace("  const handleSort = (key: string) => {", getTypeColor_code + "\n\n  const handleSort = (key: string) => {")

tbody_old = '''                      <td className="py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600">
                          {doc.type}
                        </span>
                      </td>'''

tbody_new = '''                      <td className="py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getTypeColor(doc.type)}`}>
                          {doc.type}
                        </span>
                      </td>'''

content = content.replace(tbody_old, tbody_new)

with open('client/src/app/(main)/documents/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated badge color")
