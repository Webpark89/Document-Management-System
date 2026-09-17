import re
with open("client/src/app/(main)/approvals/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Outer container
outer_old = r'<div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs mb-2">'
outer_new = r'<div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs mb-4 overflow-x-auto w-full">'
content = re.sub(outer_old, outer_new, content)

# 2. Search container
search_group_old = r'<div className="flex flex-1 items-center gap-3 w-full">'
search_group_new = r'<div className="flex items-center gap-3 w-[250px] shrink-0">'
content = re.sub(search_group_old, search_group_new, content)

search_input_old = r'<div className="relative w-full xl:w-\[30%\] shrink-0">'
search_input_new = r'<div className="relative w-full shrink-0">'
content = re.sub(search_input_old, search_input_new, content)

# 3. Filters container
filter_group_old = r'<div className="flex flex-wrap flex-1 items-center justify-between gap-3 w-full">'
filter_group_new = r'<div className="flex items-center gap-4 shrink-0 flex-nowrap">'
content = re.sub(filter_group_old, filter_group_new, content)

# 4. Type filters container
type_group_old = r'<div className="flex flex-wrap items-center gap-1\.5 py-1">'
type_group_new = r'<div className="flex items-center gap-1.5 py-1 shrink-0">'
content = re.sub(type_group_old, type_group_new, content)

# 5. Dept and Date container
dept_group_old = r'<div className="flex flex-wrap items-center gap-3 border-l border-slate-100 pl-4">'
dept_group_new = r'<div className="flex items-center gap-3 border-l border-slate-100 pl-4 shrink-0">'
content = re.sub(dept_group_old, dept_group_new, content)

with open("client/src/app/(main)/approvals/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated approvals layout")
