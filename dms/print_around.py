lines = open("client/src/app/(main)/admin/audit-logs/page.tsx", encoding="utf-8").readlines()
for i, line in enumerate(lines):
    if "getAuditLogs" in line:
        for j in range(i-5, i+25):
            print(lines[j].rstrip())
        break
