export function auditDateKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}
export function auditCsv(rows: { timestamp: string; userName: string; action: string; module: string; targetId: string; targetLabel: string; ipAddress: string; comment?: string }[]) {
  const cell = (value: string) => {
    const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [['Timestamp','User','Action','Module','Target ID','Target Label','IP Address','Comment'],
    ...rows.map(row => [row.timestamp,row.userName,row.action,row.module,row.targetId,row.targetLabel,row.ipAddress,row.comment ?? '']),
  ].map(row => row.map(cell).join(',')).join('\r\n');
}
