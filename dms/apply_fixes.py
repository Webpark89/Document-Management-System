import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix headers
headers_old = r'<DataTableHeader title="Date" sortKey="timestamp" currentSortKey=\{sortKey\} currentDirection=\{sortDirection\} onSort=\{handleSort\} className="py-3 px-4 w-32" />\n\s*<DataTableHeader title="Time" sortKey="timestamp" currentSortKey=\{sortKey\} currentDirection=\{sortDirection\} onSort=\{handleSort\} className="py-3 px-4 w-28" />'
headers_new = r'<DataTableHeader title="Date / Time" sortKey="timestamp" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-40" />'
content = re.sub(headers_old, headers_new, content)

# Fix dependencies
deps_old = r'return data;\n  \}, \[searchTerm, dateFrom, dateTo, selectedModule, selectedActions, sortKey, sortDirection\]\);'
deps_new = r'return data;\n  }, [realLogs, searchTerm, dateFrom, dateTo, selectedModule, selectedActions, sortKey, sortDirection]);'
content = re.sub(deps_old, deps_new, content)

# Fix security logic (from previous request)
sec_old = r'const hasPerm = \(itemKey: string, action: string = \'view\'\) =>\n\s*!user\?\.permissions \? true : !!user\.permissions\.includes\(`auditlog\.\$\{itemKey\}:\$\{action\}`\);'
sec_new = r'const hasPerm = (itemKey: string, action: string = \'view\') =>\n    user?.role === "Administrator" || !!user?.permissions?.includes(`auditlog.${itemKey}:${action}`);'
content = re.sub(sec_old, sec_new, content)


with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated all fixes")
