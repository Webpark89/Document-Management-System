const dateKey = (value: string | Date) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
};

export function isApprovedThisMonth(
  doc: { status: string; approved_at?: string | null },
  now = new Date(),
) {
  const approved = doc.approved_at ? dateKey(doc.approved_at) : null;
  return (
    doc.status === "Approved" &&
    !!approved &&
    approved.slice(0, 7) === dateKey(now)?.slice(0, 7)
  );
}

export function isOwnedDocument(
  doc: { creator_id?: string; creator?: { id?: string } },
  userId?: string,
) {
  return !!userId && (doc.creator_id || doc.creator?.id) === userId;
}

export function documentStatusData(documents: { status: string }[]) {
  return [
    { status: "Draft", name: "ฉบับร่าง", fill: "#94a3b8" },
    { status: "Pending", name: "รออนุมัติ", fill: "#f59e0b" },
    { status: "Returned", name: "ส่งกลับแก้ไข", fill: "#f97316" },
    { status: "Rejected", name: "ไม่อนุมัติ", fill: "#ef4444" },
    { status: "Approved", name: "อนุมัติแล้ว", fill: "#10b981" },
    { status: "Cancelled", name: "ยกเลิก", fill: "#64748b" },
  ]
    .map((status) => ({
      ...status,
      value: documents.filter((doc) => doc.status === status.status).length,
    }))
    .filter((status) => status.value > 0);
}

export function inBangkokDateRange(
  value: string | undefined,
  from: string,
  to: string,
) {
  const key = value ? dateKey(value) : null;
  return (
    (!from && !to) || (!!key && (!from || key >= from) && (!to || key <= to))
  );
}

export function pendingAgeDays(
  doc: { status: string; submitted_at?: string | null },
  now = Date.now(),
) {
  if (doc.status !== "Pending" || !doc.submitted_at) return null;
  const submitted = new Date(doc.submitted_at).getTime();
  return Number.isFinite(submitted) ? (now - submitted) / 86400000 : null;
}

export function pendingLongerThanSevenDays(doc: { status: string; submitted_at?: string | null }, now = Date.now()) {
  const days = pendingAgeDays(doc, now);
  return days !== null && days > 7;
}
