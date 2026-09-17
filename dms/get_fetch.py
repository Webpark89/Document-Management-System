import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r'useEffect\(\(\) => \{\s*let isMounted = true;\s*setLoading\(true\);\s*adminService.*?\}\, \[.*?\]\);', content, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
