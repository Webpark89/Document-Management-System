export interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  isActive: boolean;
}

export interface PositionRecord {
  id: string;
  name: string;
  level: string;
  department: string;
  isActive: boolean;
}

/** Master Data tab document type (legacy master-data page seed). */
export interface MasterDocumentTypeRecord {
  id: string;
  name: string;
  prefix: string;
  docCount: number;
  isActive: boolean;
}

export interface FormTypeRecord {
  id: string;
  name: string;
  code: string;
  fieldsCount: number;
  isActive: boolean;
}

export interface WorkflowRecord {
  id: string;
  documentTypeId: string; // Foreign Key to DocumentType.id
  name: string;
  prefix: string;
  levels: number;
  approverCount: number;
  approvers: string[];
  steps: RoleOption[];
  isActive: boolean;
}

export interface SignatureRecord {
  id: string;
  approverName: string;
  position: string;
  signedCount: number;
  isActive: boolean;
  imageUrl?: string;
}

export const ROLE_OPTIONS = [
  "หัวหน้าแผนก",
  "ผู้จัดการฝ่าย",
  "ผู้จัดการฝ่ายจัดซื้อ",
  "ผู้อำนวยการ",
  "ฝ่ายบุคคล",
] as const;

export type RoleOption = (typeof ROLE_OPTIONS)[number];

export const FORM_TYPE_OPTIONS = [
  "PR-style",
  "PO-style",
  "MEMO-style",
  "OTHER-style",
] as const;

export type FormTypeStyle = (typeof FORM_TYPE_OPTIONS)[number];

export const FORM_TYPE_DESCRIPTIONS: Record<FormTypeStyle, string> = {
  "PR-style": "มีตารางรายการสินค้า + คำนวณยอดรวม",
  "PO-style": "มีตารางรายการสั่งซื้อ + ข้อมูลผู้ขาย + ยอดรวม",
  "MEMO-style": "ฟอร์มบันทึกข้อความ (MEMO - ช่องข้อความและคำขอ)",
  "OTHER-style": "ฟอร์มทั่วไป (OTHER - เอกสารอื่นๆ)",
};

export const DEFAULT_FORM_META: Record<FormTypeStyle, { formCode: string; fieldsCount: number }> = {
  "PR-style": { formCode: "PR-FRM", fieldsCount: 8 },
  "PO-style": { formCode: "PO-FRM", fieldsCount: 10 },
  "MEMO-style": { formCode: "MEMO-FRM", fieldsCount: 6 },
  "OTHER-style": { formCode: "OTHER-FRM", fieldsCount: 5 },
};

export const DEFAULT_FORM_FIELDS: Record<FormTypeStyle, FormFieldConfig[]> = {
  "PR-style": [
    { id: "pr_f1", name: "เลขที่เอกสาร", type: "Text", isRequired: true, isSystem: true },
    { id: "pr_f2", name: "วันที่เอกสาร", type: "Date", isRequired: true, isSystem: true },
    { id: "pr_f3", name: "ผู้จัดทำ", type: "Text", isRequired: true, isSystem: true },
    { id: "pr_f4", name: "แผนก", type: "Dropdown", isRequired: true, isSystem: true },
    { id: "pr_f5", name: "วัตถุประสงค์การจัดซื้อ", type: "Text", isRequired: true },
    { id: "pr_f6", name: "วันที่ต้องการสินค้า", type: "Date", isRequired: true },
    { id: "pr_f7", name: "ตารางรายการสินค้า", type: "Table", isRequired: true, isSystem: true },
    { id: "pr_f8", name: "ยอดรวมเงิน (ก่อน VAT)", type: "Number", isRequired: true, isSystem: true },
  ],
  "PO-style": [
    { id: "po_f1", name: "เลขที่เอกสาร", type: "Text", isRequired: true, isSystem: true },
    { id: "po_f2", name: "วันที่เอกสาร", type: "Date", isRequired: true, isSystem: true },
    { id: "po_f3", name: "ชื่อผู้ขาย (Vendor)", type: "Text", isRequired: true, isSystem: true },
    { id: "po_f4", name: "ผู้ติดต่อ", type: "Text", isRequired: false },
    { id: "po_f5", name: "ที่อยู่ผู้ขาย", type: "Long Text", isRequired: false },
    { id: "po_f6", name: "วันที่กำหนดส่งมอบ", type: "Date", isRequired: true },
    { id: "po_f7", name: "เงื่อนไขการชำระเงิน", type: "Text", isRequired: false },
    { id: "po_f8", name: "ตารางรายการสั่งซื้อ", type: "Table", isRequired: true, isSystem: true },
    { id: "po_f9", name: "ภาษีมูลค่าเพิ่ม (VAT 7%)", type: "Number", isRequired: true, isSystem: true },
    { id: "po_f10", name: "ยอดรวมเงินสุทธิ", type: "Number", isRequired: true, isSystem: true },
  ],
  "MEMO-style": [
    { id: "memo_f1", name: "เลขที่เอกสาร", type: "Text", isRequired: true, isSystem: true },
    { id: "memo_f2", name: "วันที่", type: "Date", isRequired: true, isSystem: true },
    { id: "memo_f3", name: "เรื่อง", type: "Text", isRequired: true, isSystem: true },
    { id: "memo_f4", name: "เรียน", type: "Text", isRequired: true },
    { id: "memo_f5", name: "จาก", type: "Text", isRequired: true },
    { id: "memo_f6", name: "รายละเอียดบันทึกข้อความ", type: "Long Text", isRequired: true, isSystem: true },
  ],
  "OTHER-style": [
    { id: "other_f1", name: "เลขที่เอกสาร", type: "Text", isRequired: true, isSystem: true },
    { id: "other_f2", name: "วันที่", type: "Date", isRequired: true, isSystem: true },
    { id: "other_f3", name: "เรื่อง", type: "Text", isRequired: true, isSystem: true },
    { id: "other_f4", name: "รายละเอียด", type: "Long Text", isRequired: true, isSystem: true },
    { id: "other_f5", name: "แนบไฟล์เอกสาร", type: "File", isRequired: false, isSystem: true },
  ],
};

export interface FormFieldConfig {
  id: string;
  name: string;
  type: "Text" | "Long Text" | "Number" | "Date" | "File" | "Dropdown" | "Table";
  isRequired: boolean;
  isSystem?: boolean;
}

export interface ApprovalMatrixEntry {
  id: string; // Primary Key
  typeName: string;
  prefix: string;
  formType: FormTypeStyle;
  formCode: string;
  fieldsCount: number;
  docCount: number;
  isActive: boolean;
  steps: RoleOption[];
  fields?: FormFieldConfig[];
}

export type ApprovalMatrixState = Record<string, ApprovalMatrixEntry>;

/** Document type row used by doc-forms tabs (keyed by matrix entry). */
export interface DocumentTypeRecord {
  id: string; // Primary Key
  key: string;
  typeName: string;
  prefix: string;
  formType: FormTypeStyle;
  formCode: string;
  fieldsCount: number;
  docCount: number;
  isActive: boolean;
  fields?: FormFieldConfig[];
}

export type DocFormTypeKey = "PR" | "PO" | "MEMO" | "OTHER";

export interface MatrixWorkflowStep {
  id: string;
  stepOrder: number;
  roleName: RoleOption;
  approverName: string;
}

export type YearFormat = "be2" | "be4" | "none";
export type RunningSeparator = "-" | "/" | "none";
export type ResetCycle = "yearly" | "monthly" | "never";
export type RunningDigits = 3 | 4 | 5;

export interface DocumentRunningConfig {
  id: string; // Primary Key
  documentTypeId: string; // Foreign Key to DocumentType.id
  matrixKey: string;
  typeName: string;
  prefix: string;
  yearFormat: YearFormat;
  runningDigits: RunningDigits;
  separator: RunningSeparator;
  resetCycle: ResetCycle;
  currentCounter: number;
  isActive: boolean;
}

export const RESET_CYCLE_LABELS: Record<ResetCycle, string> = {
  yearly: "รายปี",
  monthly: "รายเดือน",
  never: "ไม่รีเซ็ต",
};

export const YEAR_FORMAT_LABELS: Record<YearFormat, string> = {
  be2: 'พ.ศ. 2 หลัก "69"',
  be4: 'พ.ศ. 4 หลัก "2569"',
  none: "ไม่แสดงปี",
};
