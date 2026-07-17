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
  name: string;
  levels: 3 | 4;
  approverCount: number;
  approvers: string[];
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
  "Certificate-style",
  "General",
] as const;

export type FormTypeStyle = (typeof FORM_TYPE_OPTIONS)[number];

export const FORM_TYPE_DESCRIPTIONS: Record<FormTypeStyle, string> = {
  "PR-style": "มีตารางรายการสินค้า + คำนวณยอดรวม",
  "PO-style": "มีตารางรายการสั่งซื้อ + ข้อมูลผู้ขาย + ยอดรวม",
  "Certificate-style": "ฟอร์มใบรับรองแบบย่อ ไม่มีตารางสินค้า",
  General: "ฟอร์มทั่วไป ช่องข้อความอิสระ ไม่มีตารางสินค้า",
};

export const DEFAULT_FORM_META: Record<FormTypeStyle, { formCode: string; fieldsCount: number }> = {
  "PR-style": { formCode: "PR-FRM", fieldsCount: 12 },
  "PO-style": { formCode: "PO-FRM", fieldsCount: 15 },
  "Certificate-style": { formCode: "CERT-FRM", fieldsCount: 8 },
  General: { formCode: "GEN-FRM", fieldsCount: 6 },
};

export interface ApprovalMatrixEntry {
  typeName: string;
  prefix: string;
  formType: FormTypeStyle;
  formCode: string;
  fieldsCount: number;
  docCount: number;
  isActive: boolean;
  steps: RoleOption[];
}

export type ApprovalMatrixState = Record<string, ApprovalMatrixEntry>;

/** Document type row used by doc-forms tabs (keyed by matrix entry). */
export interface DocumentTypeRecord {
  key: string;
  typeName: string;
  prefix: string;
  formType: FormTypeStyle;
  formCode: string;
  fieldsCount: number;
  docCount: number;
  isActive: boolean;
}

export type DocFormTypeKey = "PR" | "PO" | "Certificate" | "General";

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
