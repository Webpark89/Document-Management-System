import { Document, DocumentStatus, DocumentType, User, Workflow, Notification, DashboardStats, AuditLog } from "@/types";

// ─── Mock Documents ───────────────────────────────────────────────────────────
export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "1",
    doc_number: "PR-2026-0001",
    title: "ขอซื้ออุปกรณ์สำนักงาน Q3/2026",
    type: "PR",
    status: "Pending",
    creator_name: "สมชาย ใจดี",
    department: "แผนกจัดซื้อ",
    created_at: "2026-07-10T09:00:00Z",
    updated_at: "2026-07-10T09:00:00Z",
    is_deleted: false,
  },
  {
    id: "2",
    doc_number: "PO-2026-0001",
    title: "ใบสั่งซื้อ Laptop Dell สำหรับทีม IT",
    type: "PO",
    status: "Approved",
    creator_name: "วิภา รักดี",
    department: "แผนก IT",
    created_at: "2026-07-08T14:00:00Z",
    updated_at: "2026-07-12T10:00:00Z",
    is_deleted: false,
  },
  {
    id: "3",
    doc_number: "PR-2026-0002",
    title: "ขอซื้อวัสดุสิ้นเปลืองสำหรับโรงงาน",
    type: "PR",
    status: "Draft",
    creator_name: "นภา มีสุข",
    department: "แผนกผลิต",
    created_at: "2026-07-13T11:00:00Z",
    updated_at: "2026-07-13T11:00:00Z",
    is_deleted: false,
  },
  {
    id: "4",
    doc_number: "PO-2026-0002",
    title: "ใบสั่งซื้อวัตถุดิบ เดือนกรกฎาคม",
    type: "PO",
    status: "Rejected",
    creator_name: "ประยุทธ์ สร้างชาติ",
    department: "แผนกจัดซื้อ",
    created_at: "2026-07-05T08:30:00Z",
    updated_at: "2026-07-07T16:00:00Z",
    is_deleted: false,
  },
  {
    id: "5",
    doc_number: "MM-2026-0001",
    title: "บันทึกข้อความภายใน",
    type: "Memo",
    status: "Approved",
    creator_name: "อรทัย สุขใจ",
    department: "แผนก HR",
    created_at: "2026-07-01T09:00:00Z",
    updated_at: "2026-07-02T10:00:00Z",
    is_deleted: false,
  },
  {
    id: "6",
    doc_number: "PR-2026-0003",
    title: "ขอซื้ออุปกรณ์ป้องกันความปลอดภัย",
    type: "PR",
    status: "Pending",
    creator_name: "มานะ ทำงาน",
    department: "แผนกความปลอดภัย",
    created_at: "2026-07-11T13:00:00Z",
    updated_at: "2026-07-11T13:00:00Z",
    is_deleted: false,
  },
];

// ─── Mock Current User ────────────────────────────────────────────────────────
export const MOCK_CURRENT_USER: User = {
  id: "u1",
  username: "manager01",
  email: "manager@company.com",
  first_name: "วิภา",
  last_name: "รักดี",
  department: "แผนก IT",
  position: "ผู้จัดการ",
  role: "Manager",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

// ─── Mock Notifications ───────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    message: "เอกสาร PR-2026-0001 รออนุมัติจากคุณ",
    document_id: "1",
    document_title: "ขอซื้ออุปกรณ์สำนักงาน Q3/2026",
    is_read: false,
    created_at: "2026-07-14T08:00:00Z",
  },
  {
    id: "n2",
    message: "เอกสาร PR-2026-0003 รออนุมัติจากคุณ",
    document_id: "6",
    document_title: "ขอซื้ออุปกรณ์ป้องกันความปลอดภัย",
    is_read: false,
    created_at: "2026-07-14T09:30:00Z",
  },
  {
    id: "n3",
    message: "เอกสาร PO-2026-0001 ได้รับการอนุมัติแล้ว",
    document_id: "2",
    document_title: "ใบสั่งซื้อ Laptop Dell สำหรับทีม IT",
    is_read: true,
    created_at: "2026-07-12T10:00:00Z",
  },
];

// ─── Mock Dashboard Stats ─────────────────────────────────────────────────────
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  total: 6,
  draft: 1,
  pending: 2,
  approved: 2,
  rejected: 1,
  cancelled: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export const STATUS_LABELS: Record<string, string> = {
  Draft: "แบบร่าง",
  Pending: "รออนุมัติ",
  Approved: "อนุมัติแล้ว",
  Rejected: "ถูกส่งกลับ",
  Cancelled: "ยกเลิก",
};

export const TYPE_LABELS: Record<string, string> = {
  PR: "ใบขอซื้อ (PR)",
  PO: "ใบสั่งซื้อ (PO)",
  Memo: "บันทึกข้อความ",
  Other: "เอกสารแนบ",
};

export const TYPE_COLORS: Record<string, string> = {
  PR: "bg-blue-50 text-blue-700 border-blue-200",
  PO: "bg-purple-50 text-purple-700 border-purple-200",
  Memo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Other: "bg-slate-50 text-slate-600 border-slate-200",
};

// ─── Mock Audit Logs ──────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "al-1",
    user_id: "u1",
    username: "manager01",
    user_fullname: "วิภา รักดี",
    action: "Login",
    module: "Auth",
    ip_address: "192.168.1.45",
    created_at: "2026-07-16T08:00:00Z",
  },
  {
    id: "al-2",
    user_id: "u2",
    username: "somchai.j",
    user_fullname: "สมชาย ใจดี",
    action: "Upload",
    module: "Documents",
    target_id: "PR-2026-0001",
    target_display: "PR-2026-0001",
    ip_address: "192.168.1.102",
    created_at: "2026-07-10T09:00:00Z",
  },
  {
    id: "al-3",
    user_id: "u1",
    username: "manager01",
    user_fullname: "วิภา รักดี",
    action: "Approve",
    module: "Approvals",
    target_id: "PO-2026-0001",
    target_display: "PO-2026-0001",
    ip_address: "192.168.1.45",
    created_at: "2026-07-12T09:30:00Z",
  },
  {
    id: "al-4",
    user_id: "u1",
    username: "manager01",
    user_fullname: "วิภา รักดี",
    action: "Signature",
    module: "Approvals",
    target_id: "PO-2026-0001",
    target_display: "PO-2026-0001",
    ip_address: "192.168.1.45",
    created_at: "2026-07-12T09:31:00Z",
  },
  {
    id: "al-5",
    user_id: "u3",
    username: "orathai.s",
    user_fullname: "อรทัย สุขใจ",
    action: "View",
    module: "Documents",
    target_id: "MM-2026-0001",
    target_display: "MM-2026-0001",
    ip_address: "10.0.0.15",
    created_at: "2026-07-15T14:20:00Z",
  },
  {
    id: "al-6",
    user_id: "u4",
    username: "prayut.s",
    user_fullname: "ประยุทธ์ สร้างชาติ",
    action: "Reject",
    module: "Approvals",
    target_id: "PO-2026-0002",
    target_display: "PO-2026-0002",
    ip_address: "192.168.2.11",
    created_at: "2026-07-07T16:00:00Z",
  },
  {
    id: "al-7",
    user_id: "u5",
    username: "admin01",
    user_fullname: "Admin System",
    action: "Delete",
    module: "Users",
    target_id: "u99",
    target_display: "test.user",
    ip_address: "127.0.0.1",
    created_at: "2026-07-16T11:45:00Z",
  },
];
