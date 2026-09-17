import re
with open("client/src/app/(main)/admin/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Update date formatter
format_old = r'const formatDateTimeTH = \(isoString: string\) => \{\n\s*const d = new Date\(isoString\);\n\s*// Simple mock formatting for TH layout \(e\.g\. 17 ก\.ค\. 2026, 16:30\)\n\s*return d\.toLocaleString\(\'th-TH\', \{.*?\n\s*\}\);\n\s*\};'
format_new = r'''const formatDateTH = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTimeTH = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };'''
content = re.sub(format_old, format_new, content, flags=re.DOTALL)

# Update header
header_old = r'<DataTableHeader title="Date / Time" sortKey="timestamp" currentSortKey=\{sortKey\} currentDirection=\{sortDirection\} onSort=\{handleSort\} className="py-3 px-4 w-40" />'
header_new = r'''<DataTableHeader title="Date" sortKey="timestamp" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-28" />
                    <DataTableHeader title="Time" sortKey="timestamp" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-24" />'''
content = re.sub(header_old, header_new, content)

# Update cell
cell_old = r'<td className="py-3 px-4">\n\s*<div className="text-sm font-semibold \n*text-slate-700">\{formatDateTimeTH\(log\.timestamp\)\}</div>\n\s*</td>'
cell_new = r'''<td className="py-3 px-4">
                              <div className="text-sm font-semibold text-slate-700">{formatDateTH(log.timestamp)}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-slate-500 font-medium">{formatTimeTH(log.timestamp)}</div>
                            </td>'''
content = re.sub(cell_old, cell_new, content)

with open("client/src/app/(main)/admin/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Split date and time")
