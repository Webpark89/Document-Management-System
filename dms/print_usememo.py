import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "const filteredLogs = useMemo" in line:
        start = i
        break

for i in range(start, start + 35):
    print(lines[i])
