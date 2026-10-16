interface DashboardSourceDocument {
  id: string;
  real_id?: string;
  title?: string;
  name?: string;
  type: string | { prefix?: string; code?: string };
  department?: string;
  status: string;
  sender?: string;
  creator_name?: string;
  creator_id?: string;
  creator?: {
    id?: string;
    first_name?: string;
    department?: { name?: string };
  };
  created_at?: string;
  submittedDate?: string;
  pr_form?: unknown;
  po_form?: unknown;
  approvers?: string[];
  workflow?: unknown;
}

function totalAmount(form: unknown): number {
  if (!form || typeof form !== "object" || !("total_amount" in form)) return 0;
  const amount = Number(form.total_amount);
  return Number.isFinite(amount) ? amount : 0;
}

export async function loadDashboardData<TStats>(operations: {
  documents: () => Promise<DashboardSourceDocument[]>;
  stats: () => Promise<TStats>;
}) {
  const [source, stats] = await Promise.all([
    operations.documents(),
    operations.stats(),
  ]);
  const documents = source.map((d) => ({
    id: d.id,
    real_id: d.real_id,
    title: d.title || d.name || "",
    type:
      typeof d.type === "object"
        ? d.type?.prefix || d.type?.code || "OTHER"
        : d.type || "OTHER",
    department: d.department || d.creator?.department?.name || "ทั่วไป",
    status: d.status,
    submittedBy: d.sender || d.creator_name || d.creator?.first_name || "ระบบ",
    creator_id: d.creator_id || d.creator?.id,
    creator: d.creator,
    date: d.created_at || d.submittedDate,
    value: d.pr_form ? totalAmount(d.pr_form) : totalAmount(d.po_form),
    approvers: d.approvers || [],
    workflow: d.workflow || null,
  }));
  return {
    documents,
    stats,
    departments: [...new Set(documents.map((d) => d.department))].sort(),
  };
}
export type DashboardDocument = Awaited<
  ReturnType<typeof loadDashboardData>
>["documents"][number];
