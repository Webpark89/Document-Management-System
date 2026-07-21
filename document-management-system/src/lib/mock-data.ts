import { Document, DocumentStatus, DocumentType, User, Workflow, Notification, DashboardStats, AuditLog } from "@/types";

// ─── Mock Documents ───────────────────────────────────────────────────────────
export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "PR-2026-0001",
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
    id: "PO-2026-0001",
    doc_number: "PO-2026-0001",
    title: "ใบสั่งซื้อ Laptop Dell สำหรับทีม IT",
    type: "PO",
    status: "Approved",
    creator_name: "วิภา รักดี",
    department: "แผนกคลังสินค้าและจัดส่ง",
    created_at: "2026-07-08T14:00:00Z",
    updated_at: "2026-07-12T10:00:00Z",
    is_deleted: false,
  },
  {
    id: "PR-2026-0002",
    doc_number: "PR-2026-0002",
    title: "ขอซื้อวัสดุสิ้นเปลืองสำหรับโรงงาน",
    type: "PR",
    status: "Draft",
    creator_name: "นภา สุขใจ",
    department: "แผนกทรัพยากรบุคคล",
    created_at: "2026-07-13T11:00:00Z",
    updated_at: "2026-07-13T11:00:00Z",
    is_deleted: false,
  },
  {
    id: "PO-2026-0002",
    doc_number: "PO-2026-0002",
    title: "ใบสั่งซื้อวัตถุดิบ เดือนกรกฎาคม",
    type: "PO",
    status: "Rejected",
    creator_name: "กิตติศักดิ์ พรหมมา",
    department: "แผนกผลิต",
    created_at: "2026-07-05T08:30:00Z",
    updated_at: "2026-07-07T16:00:00Z",
    is_deleted: false,
  },
  {
    id: "MEMO-2026-0001",
    doc_number: "MEMO-2026-0001",
    title: "บันทึกข้อความภายใน",
    type: "Memo",
    status: "Approved",
    creator_name: "สุดา วงศ์ศรี",
    department: "แผนกบัญชีและการเงิน",
    created_at: "2026-07-01T09:00:00Z",
    updated_at: "2026-07-02T10:00:00Z",
    is_deleted: false,
  },
  {
    id: "PR-2026-0003",
    doc_number: "PR-2026-0003",
    title: "ขอซื้ออุปกรณ์ป้องกันความปลอดภัย",
    type: "PR",
    status: "Pending",
    creator_name: "ประเสริฐ มีสุข",
    department: "แผนกเทคโนโลยีสารสนเทศ",
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
  department: "แผนกคลังสินค้าและจัดส่ง",
  position: "หัวหน้าคลังสินค้า",
  role: "Manager",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

// ─── Mock Notifications ───────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    message: "เอกสาร PR-2026-0001 รออนุมัติจากคุณ",
    document_id: "PR-2026-0001",
    document_title: "ขอซื้ออุปกรณ์สำนักงาน Q3/2026",
    is_read: false,
    created_at: "2026-07-14T08:00:00Z",
  },
  {
    id: "n2",
    message: "เอกสาร PR-2026-0003 รออนุมัติจากคุณ",
    document_id: "PR-2026-0003",
    document_title: "ขอซื้ออุปกรณ์ป้องกันความปลอดภัย",
    is_read: false,
    created_at: "2026-07-14T09:30:00Z",
  },
  {
    id: "n3",
    message: "เอกสาร PO-2026-0001 ได้รับการอนุมัติแล้ว",
    document_id: "PO-2026-0001",
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

export const MOCK_REPORT_DATA = [
  { id: "PR-2026-0001", type: "PR", department: "แผนกจัดซื้อ", status: "Approved", date: "2026-07-01", value: 15000, approvalDays: 2, title: "ขอซื้ออุปกรณ์สำนักงาน Q3/2026", submittedBy: "สมชาย ใจดี" },
  { id: "PO-2026-0001", type: "PO", department: "แผนกคลังสินค้าและจัดส่ง", status: "Pending", date: "2026-07-05", value: 45000, approvalDays: null, title: "ใบสั่งซื้อ Laptop Dell สำหรับทีม IT", submittedBy: "วิภา รักดี" },
  { id: "MM-2026-0001", type: "Memo", department: "แผนกบัญชีและการเงิน", status: "Approved", date: "2026-07-10", value: 0, approvalDays: 1, title: "บันทึกข้อความภายใน", submittedBy: "สุดา วงศ์ศรี" },
  { id: "OT-2026-0001", type: "Other", department: "แผนกคลังสินค้าและจัดส่ง", status: "Rejected", date: "2026-07-12", value: 0, approvalDays: 3, title: "ขออนุมัติเบิกค่าเดินทาง", submittedBy: "วิภา รักดี" },
  { id: "PR-2026-0002", type: "PR", department: "แผนกทรัพยากรบุคคล", status: "Returned", date: "2026-07-14", value: 25000, approvalDays: null, title: "ขอซื้ออะไหล่เครื่องจักร", submittedBy: "นภา สุขใจ" },
  { id: "PO-2026-0002", type: "PO", department: "แผนกผลิต", status: "Approved", date: "2026-06-25", value: 120000, approvalDays: 5, title: "ใบสั่งซื้อวัตถุดิบ เดือนกรกฎาคม", submittedBy: "กิตติศักดิ์ พรหมมา" },
  { id: "MM-2026-0002", type: "Memo", department: "แผนกจัดซื้อ", status: "Pending", date: "2026-07-15", value: 0, approvalDays: null, title: "แจ้งปรับปรุงระบบบัญชี", submittedBy: "สมชาย ใจดี" },
  { id: "PR-2026-0003", type: "PR", department: "แผนกคลังสินค้าและจัดส่ง", status: "Approved", date: "2026-06-30", value: 8500, approvalDays: 1, title: "ขอซื้อ Software License", submittedBy: "วิภา รักดี" },
  { id: "PO-2026-0003", type: "PO", department: "แผนกผลิต", status: "Approved", date: "2026-07-02", value: 210000, approvalDays: 4, title: "ใบสั่งซื้อเครื่องจักรใหม่", submittedBy: "กิตติศักดิ์ พรหมมา" },
  { id: "OT-2026-0002", type: "Other", department: "แผนกทรัพยากรบุคคล", status: "Approved", date: "2026-07-08", value: 0, approvalDays: 2, title: "รายงานการประชุมประจำเดือน", submittedBy: "นภา สุขใจ" },
  { id: "PR-2026-0004", type: "PR", department: "แผนกทรัพยากรบุคคล", status: "Approved", date: "2026-07-16", value: 5000, approvalDays: 1, title: "ขอซื้อกระดาษ A4", submittedBy: "นภา สุขใจ" },
  { id: "PO-2026-0004", type: "PO", department: "แผนกผลิต", status: "Rejected", date: "2026-07-17", value: 35000, approvalDays: 3, title: "จัดจ้างที่ปรึกษา HR", submittedBy: "กิตติศักดิ์ พรหมมา" },
  { id: "PR-2026-0005", type: "PR", department: "แผนกคลังสินค้าและจัดส่ง", status: "Cancelled", date: "2026-07-18", value: 12000, approvalDays: null, title: "ขอซื้อเมาส์และคีย์บอร์ด", submittedBy: "วิภา รักดี" },
];

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
    user_id: "2",
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
    comment: "อนุมัติเบื้องต้น",
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
    user_id: "2",
    username: "suda.w",
    user_fullname: "สุดา วงศ์ศรี",
    action: "View",
    module: "Documents",
    target_id: "MM-2026-0001",
    target_display: "MM-2026-0001",
    ip_address: "10.0.0.15",
    created_at: "2026-07-15T14:20:00Z",
  },
  {
    id: "al-6",
    user_id: "6",
    username: "kittisak.p",
    user_fullname: "กิตติศักดิ์ พรหมมา",
    action: "Reject",
    module: "Approvals",
    target_id: "PO-2026-0002",
    target_display: "PO-2026-0002",
    ip_address: "192.168.2.11",
    comment: "งบประมาณไตรมาสนี้ไม่เพียงพอ โปรดเลื่อนไป Q4",
    created_at: "2026-07-07T16:00:00Z",
  },
  {
    id: "al-7",
    user_id: "5",
    username: "napa.s",
    user_fullname: "นภา สุขใจ",
    action: "Delete",
    module: "Users",
    target_id: "u99",
    target_display: "test.user",
    ip_address: "127.0.0.1",
    created_at: "2026-07-16T11:45:00Z",
  },
];

// ─── Mock Document Versions ───────────────────────────────────────────────────
import { DocumentVersion } from "@/features/documents/types";

export const MOCK_DOCUMENT_VERSIONS: DocumentVersion[] = [
  // PR-2026-0001
  {
    id: "v3_pr1",
    document_id: "PR-2026-0001",
    version_number: "V.3",
    uploaded_by: "วิภา รักดี",
    created_at: "2026-07-16T10:00:00Z",
    file_size_kb: 1450,
    remarks: "แก้ไขตามคอมเมนต์จากฝ่ายจัดซื้อเรื่องราคาประเมินใหม่",
    is_active: true,
  },
  {
    id: "v2_pr1",
    document_id: "PR-2026-0001",
    version_number: "V.2",
    uploaded_by: "สมชาย ใจดี",
    created_at: "2026-07-15T15:30:00Z",
    file_size_kb: 1405,
    remarks: "แนบเอกสารใบเสนอราคาเพิ่มเติม (Vendor A และ B)",
    is_active: false,
  },
  {
    id: "v1_pr1",
    document_id: "PR-2026-0001",
    version_number: "V.1",
    uploaded_by: "วิภา รักดี",
    created_at: "2026-07-14T09:00:00Z",
    file_size_kb: 1200,
    remarks: "สร้างเอกสารร่างเริ่มต้น (Initial Draft)",
    is_active: false,
  },

  // PO-2026-0001
  {
    id: "v2_po1",
    document_id: "PO-2026-0001",
    version_number: "V.2",
    uploaded_by: "วิภา รักดี",
    created_at: "2026-07-12T10:00:00Z",
    file_size_kb: 2150,
    remarks: "ประทับลายเซ็นอนุมัติเรียบร้อย",
    is_active: true,
  },
  {
    id: "v1_po1",
    document_id: "PO-2026-0001",
    version_number: "V.1",
    uploaded_by: "วิภา รักดี",
    created_at: "2026-07-05T09:00:00Z",
    file_size_kb: 2048,
    remarks: "Initial PO document",
    is_active: false,
  },

  // PR-2026-0002
  {
    id: "v2_pr2",
    document_id: "PR-2026-0002",
    version_number: "V.2",
    uploaded_by: "อรทัย สุขใจ",
    created_at: "2026-07-13T14:00:00Z",
    file_size_kb: 950,
    remarks: "แก้ไขข้อมูลจำนวนตามที่ฝ่ายผลิตแจ้งปรับลด",
    is_active: true,
  },
  {
    id: "v1_pr2",
    document_id: "PR-2026-0002",
    version_number: "V.1",
    uploaded_by: "อรทัย สุขใจ",
    created_at: "2026-07-12T11:00:00Z",
    file_size_kb: 930,
    remarks: "Initial document submission",
    is_active: false,
  },

  // MEMO-2026-0001
  {
    id: "v1_mm1",
    document_id: "MEMO-2026-0001",
    version_number: "V.1",
    uploaded_by: "ประเสริฐ มีสุข",
    created_at: "2026-07-11T09:00:00Z",
    file_size_kb: 450,
    remarks: "บันทึกขออนุมัติสัมมนาประจำปี",
    is_active: true,
  },

  // PR-2026-0003
  {
    id: "v1_pr3",
    document_id: "PR-2026-0003",
    version_number: "V.1",
    uploaded_by: "สมชาย ใจดี",
    created_at: "2026-07-10T13:00:00Z",
    file_size_kb: 1850,
    remarks: "ขอซื้อ Software License สำหรับทีมพัฒนา",
    is_active: true,
  },

  // PO-2026-0002
  {
    id: "v1_po2",
    document_id: "PO-2026-0002",
    version_number: "V.1",
    uploaded_by: "ประทีป สุขเจริญ",
    created_at: "2026-07-09T08:30:00Z",
    file_size_kb: 1024,
    remarks: "ใบสั่งซื้อกระดาษและอุปกรณ์เครื่องเขียน",
    is_active: true,
  },

  // OTHER-2026-0001
  {
    id: "v1_ot1",
    document_id: "OTHER-2026-0001",
    version_number: "V.1",
    uploaded_by: "กิตติศักดิ์ พรหมมา",
    created_at: "2026-07-08T10:00:00Z",
    file_size_kb: 3200,
    remarks: "เอกสารยินยอมตรวจแปลงผลิตวัตถุดิบ",
    is_active: true,
  },

  // PR-2026-0004
  {
    id: "v1_pr4",
    document_id: "PR-2026-0004",
    version_number: "V.1",
    uploaded_by: "วิภา รักดี",
    created_at: "2026-07-07T09:00:00Z",
    file_size_kb: 1100,
    remarks: "ขอซื้อโต๊ะและเก้าอี้บัญชี",
    is_active: true,
  },

  // PO-2026-0003
  {
    id: "v1_po3",
    document_id: "PO-2026-0003",
    version_number: "V.1",
    uploaded_by: "ณัฐพล วงศ์สว่าง",
    created_at: "2026-07-06T14:10:00Z",
    file_size_kb: 4120,
    remarks: "สั่งซื้อเครื่องปั๊มน้ำอุตสาหกรรม",
    is_active: true,
  },

  // MEMO-2026-0002
  {
    id: "v1_mm2",
    document_id: "MEMO-2026-0002",
    version_number: "V.1",
    uploaded_by: "สมชาย ใจดี",
    created_at: "2026-07-05T10:00:00Z",
    file_size_kb: 512,
    remarks: "รายงานการปรับปรุงระบบเน็ตเวิร์ก",
    is_active: true,
  }
];

