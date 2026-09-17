import re
import os

files = [
    "client/src/app/(main)/submissions/page.tsx",
    "client/src/app/(main)/approvals/page.tsx"
]

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update the overflow-x-auto container
    container_old = r'<div className="flex flex-1 items-center justify-between gap-4 overflow-x-auto w-full">'
    container_new = r'<div className="flex flex-wrap flex-1 items-center justify-between gap-3 w-full">'
    content = re.sub(container_old, container_new, content)

    # 2. Update the button styles
    btn_old = r'className=\{\`flex items-center justify-center gap-1\.5 px-3 py-1\.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap min-w-\[70px\] \$\{'
    btn_new = r'className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors whitespace-nowrap ${'
    content = re.sub(btn_old, btn_new, content)

    # 3. Add flex-wrap to the Type Filter container itself just in case
    type_old = r'<div className="flex items-center gap-2 shrink-0 py-1">'
    type_new = r'<div className="flex flex-wrap items-center gap-1.5 py-1">'
    content = re.sub(type_old, type_new, content)

    # 4. Add flex-wrap to the Date Range & Dept Filter
    dept_old = r'<div className="flex items-center gap-3 shrink-0 border-l border-slate-100 pl-4">'
    dept_new = r'<div className="flex flex-wrap items-center gap-3 border-l border-slate-100 pl-4">'
    content = re.sub(dept_old, dept_new, content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
print("Updated classes in submissions and approvals")
