import {
  DEFAULT_FORM_FIELDS,
  type ApprovalMatrixState,
  type DepartmentRecord,
  type FormTypeRecord,
  type MasterDocumentTypeRecord,
  type PositionRecord,
  type SignatureRecord,
  type WorkflowRecord,
} from "../types";

export const DEPARTMENTS: DepartmentRecord[] = [
  { id: "1", name: "แผนกจัดซื้อ", code: "PROC", employeeCount: 12, isActive: true },
  { id: "2", name: "แผนกบัญชีและการเงิน", code: "ACC", employeeCount: 8, isActive: true },
  { id: "3", name: "แผนกคลังสินค้าและจัดส่ง", code: "WH", employeeCount: 15, isActive: true },
  { id: "4", name: "แผนกเทคโนโลยีสารสนเทศ", code: "IT", employeeCount: 6, isActive: true },
  { id: "5", name: "แผนกทรัพยากรบุคคล", code: "HR", employeeCount: 5, isActive: true },
  { id: "6", name: "แผนกบริหารงานทั่วไป", code: "GA", employeeCount: 7, isActive: true },
  { id: "7", name: "แผนกประกันคุณภาพ", code: "QA", employeeCount: 9, isActive: true },
  { id: "8", name: "แผนกผลิต", code: "PROD", employeeCount: 20, isActive: true },
];

export const POSITIONS: PositionRecord[] = [
  { id: "1", name: "ผู้จัดการฝ่ายจัดซื้อ", level: "L3", department: "แผนกจัดซื้อ", isActive: true },
  { id: "2", name: "เจ้าหน้าที่บัญชี", level: "L1", department: "แผนกบัญชีและการเงิน", isActive: true },
  { id: "3", name: "หัวหน้าคลังสินค้า", level: "L2", department: "แผนกคลังสินค้าและจัดส่ง", isActive: true },
  { id: "4", name: "ผู้ดูแลระบบ IT", level: "L3", department: "แผนกเทคโนโลยีสารสนเทศ", isActive: true },
  { id: "5", name: "เจ้าหน้าที่ HR", level: "L1", department: "แผนกทรัพยากรบุคคล", isActive: true },
  { id: "6", name: "ผู้อำนวยการฝ่ายผลิต", level: "L4", department: "แผนกผลิต", isActive: true },
];

export const DOCUMENT_TYPES: MasterDocumentTypeRecord[] = [
  { id: "1", name: "ใบขอซื้อ (PR)", prefix: "PR", docCount: 24, isActive: true },
  { id: "2", name: "ใบสั่งซื้อ (PO)", prefix: "PO", docCount: 18, isActive: true },
  { id: "3", name: "บันทึกข้อความ (MEMO)", prefix: "MEMO", docCount: 10, isActive: true },
  { id: "4", name: "เอกสารอื่นๆ (OTHER)", prefix: "OTHER", docCount: 5, isActive: true },
];

export const FORM_TYPES: FormTypeRecord[] = [
  { id: "1", name: "ฟอร์ม PR", code: "PR-FRM", fieldsCount: 12, isActive: true },
  { id: "2", name: "ฟอร์ม PO", code: "PO-FRM", fieldsCount: 15, isActive: true },
  { id: "3", name: "ฟอร์ม MEMO", code: "MEMO-FRM", fieldsCount: 8, isActive: true },
  { id: "4", name: "ฟอร์ม OTHER", code: "OTHER-FRM", fieldsCount: 6, isActive: true },
];

export const WORKFLOWS: WorkflowRecord[] = [
  {
    id: "1",
    documentTypeId: "doc-type-pr",
    name: "อนุมัติ PR",
    prefix: "PR",
    levels: 3,
    approverCount: 3,
    approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข"],
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย", "ผู้จัดการฝ่ายจัดซื้อ"],
    isActive: true,
  },
  {
    id: "2",
    documentTypeId: "doc-type-po",
    name: "อนุมัติ PO",
    prefix: "PO",
    levels: 4,
    approverCount: 4,
    approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข", "นภา สุขใจ"],
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย", "ผู้จัดการฝ่ายจัดซื้อ", "ผู้อำนวยการ"],
    isActive: true,
  },
  {
    id: "3",
    documentTypeId: "doc-type-memo",
    name: "อนุมัติ MEMO",
    prefix: "MEMO",
    levels: 2,
    approverCount: 2,
    approvers: ["สมชาย ใจดี", "กิตติศักดิ์ พรหมมา"],
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย"],
    isActive: true,
  },
  {
    id: "4",
    documentTypeId: "doc-type-other",
    name: "อนุมัติ OTHER",
    prefix: "OTHER",
    levels: 1,
    approverCount: 1,
    approvers: ["สมชาย ใจดี"],
    steps: ["หัวหน้าแผนก"],
    isActive: true,
  },
];

export const SIGNATURES: SignatureRecord[] = [
  {
    id: "1",
    approverName: "สมชาย ใจดี",
    position: "ผู้จัดการฝ่ายจัดซื้อ",
    signedCount: 42,
    isActive: true,
    imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50' viewBox='0 0 150 50'><path d='M10,35 Q30,10 60,30 T110,15 T140,40' fill='none' stroke='%231d4ed8' stroke-width='3' stroke-linecap='round'/></svg>",
  },
  {
    id: "2",
    approverName: "วิภา รักดี",
    position: "หัวหน้าคลังสินค้า",
    signedCount: 28,
    isActive: true,
    imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50' viewBox='0 0 150 50'><path d='M15,20 C45,45 60,5 90,30 C120,45 130,10 145,25' fill='none' stroke='%23047857' stroke-width='2.5' stroke-linecap='round'/></svg>",
  },
  {
    id: "3",
    approverName: "ประเสริฐ มีสุข",
    position: "ผู้ดูแลระบบ IT",
    signedCount: 15,
    isActive: true,
    imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50' viewBox='0 0 150 50'><path d='M10,25 Q40,45 70,25 T130,25 Q140,10 145,35' fill='none' stroke='%23b91c1c' stroke-width='3' stroke-linecap='round'/></svg>",
  },
];

export const APPROVAL_MATRIX: ApprovalMatrixState = {
  PR: {
    id: "doc-type-pr",
    typeName: "ใบขอซื้อ (PR)",
    prefix: "PR",
    formType: "PR-style",
    formCode: "PR-FRM",
    fieldsCount: DEFAULT_FORM_FIELDS["PR-style"].length,
    docCount: 24,
    isActive: true,
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย", "ผู้จัดการฝ่ายจัดซื้อ"],
    fields: [...DEFAULT_FORM_FIELDS["PR-style"]],
  },
  PO: {
    id: "doc-type-po",
    typeName: "ใบสั่งซื้อ (PO)",
    prefix: "PO",
    formType: "PO-style",
    formCode: "PO-FRM",
    fieldsCount: DEFAULT_FORM_FIELDS["PO-style"].length,
    docCount: 18,
    isActive: true,
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย", "ผู้จัดการฝ่ายจัดซื้อ", "ผู้อำนวยการ"],
    fields: [...DEFAULT_FORM_FIELDS["PO-style"]],
  },
  MEMO: {
    id: "doc-type-memo",
    typeName: "บันทึกข้อความ (MEMO)",
    prefix: "MEMO",
    formType: "MEMO-style",
    formCode: "MEMO-FRM",
    fieldsCount: DEFAULT_FORM_FIELDS["MEMO-style"].length,
    docCount: 10,
    isActive: true,
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย"],
    fields: [...DEFAULT_FORM_FIELDS["MEMO-style"]],
  },
  OTHER: {
    id: "doc-type-other",
    typeName: "เอกสารอื่นๆ (OTHER)",
    prefix: "OTHER",
    formType: "OTHER-style",
    formCode: "OTHER-FRM",
    fieldsCount: DEFAULT_FORM_FIELDS["OTHER-style"].length,
    docCount: 5,
    isActive: true,
    steps: ["หัวหน้าแผนก"],
    fields: [...DEFAULT_FORM_FIELDS["OTHER-style"]],
  },
};

export const DOC_TYPE_TO_MATRIX_KEY = {
  PR: "PR",
  PO: "PO",
  MEMO: "MEMO",
  OTHER: "OTHER",
} as const;

const DEFAULT_APPROVER_BY_ROLE = {
  "หัวหน้าแผนก": "สมชาย ใจดี",
  "ผู้จัดการฝ่าย": "กิตติศักดิ์ พรหมมา",
  "ผู้จัดการฝ่ายจัดซื้อ": "วิภา รักดี",
  "ผู้อำนวยการ": "อรทัย สุขใจ",
  "ฝ่ายบุคคล": "กิตติศักดิ์ พรหมมา",
} as const;

export { DEFAULT_APPROVER_BY_ROLE };
