const fs = require('fs');
const file = 'client/src/app/(main)/admin/audit-logs/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add formatDateOnlyTH and formatTimeOnly below formatDateTimeTH
const dateFns = `  const formatDateTimeTH = (isoString: string) => {
    const d = new Date(isoString);
    // Simple mock formatting for TH layout (e.g. 17 ก.ค. 2026, 16:30)
    return d.toLocaleString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateOnlyTH = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTimeOnly = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };`;

const originalFormat = `  const formatDateTimeTH = (isoString: string) => {
    const d = new Date(isoString);
    // Simple mock formatting for TH layout (e.g. 17 ก.ค. 2026, 16:30)
    return d.toLocaleString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };`;

content = content.replace(originalFormat, dateFns);

// 2. Update table headers
const oldTh = `<DataTableHeader title="Timestamp" sortKey="timestamp" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-44" />`;
const newTh = `<DataTableHeader title="Date" sortKey="timestamp" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-32" />
                    <DataTableHeader title="Time" sortKey="timestamp" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3 px-4 w-28" />`;
content = content.replace(oldTh, newTh);

// 3. Update table body columns
const oldTd = `<td className="py-3 px-4">
                            <div className="text-sm font-semibold text-slate-700">{formatDateTimeTH(log.timestamp)}</div>
                          </td>`;
const newTd = `<td className="py-3 px-4">
                            <div className="text-sm font-semibold text-slate-700">{formatDateOnlyTH(log.timestamp)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-mono text-slate-600">{formatTimeOnly(log.timestamp)}</div>
                          </td>`;
content = content.replace(oldTd, newTd);

// 4. Update colSpan=7 to colSpan=8
content = content.replaceAll('colSpan={7}', 'colSpan={8}');

fs.writeFileSync(file, content, 'utf8');
console.log('Refactored audit logs!');
