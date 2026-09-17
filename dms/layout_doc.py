import re
with open("client/src/app/(main)/documents/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Outer container
outer_old = r'<div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-4">\n\s*<div className="flex flex-col xl:flex-row gap-4">'
outer_new = r'<div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-4 overflow-x-auto hide-scrollbar">\n          <div className="flex items-center gap-4 min-w-max">'
content = re.sub(outer_old, outer_new, content)

# 2. Search container
search_input_old = r'<div className="relative flex-1 w-full xl:max-w-\[300px\] shrink-0">'
search_input_new = r'<div className="relative w-[250px] shrink-0">'
content = re.sub(search_input_old, search_input_new, content)

# 3. Filters container
filter_group_old = r'<div className="flex flex-wrap items-center gap-3 xl:ml-auto">'
filter_group_new = r'<div className="flex items-center gap-4 shrink-0 flex-nowrap xl:ml-auto">'
content = re.sub(filter_group_old, filter_group_new, content)

with open("client/src/app/(main)/documents/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated documents layout")
