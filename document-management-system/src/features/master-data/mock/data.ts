import type {
  ApprovalMatrixState,
  DepartmentRecord,
  FormTypeRecord,
  MasterDocumentTypeRecord,
  PositionRecord,
  SignatureRecord,
  WorkflowRecord,
} from "../types";

export const DEPARTMENTS: DepartmentRecord[] = [
  { id: "1", name: "แผนกจัดซื้อ", code: "PROC", employeeCount: 12, isActive: true },
  { id: "2", name: "แผนกบัญชี", code: "ACC", employeeCount: 8, isActive: true },
  { id: "3", name: "แผนกคลังสินค้า", code: "WH", employeeCount: 15, isActive: true },
  { id: "4", name: "แผนก IT", code: "IT", employeeCount: 6, isActive: true },
];

export const POSITIONS: PositionRecord[] = [
  { id: "1", name: "ผู้จัดการ", level: "L3", department: "แผนกจัดซื้อ", isActive: true },
  { id: "2", name: "เจ้าหน้าที่", level: "L1", department: "แผนกบัญชี", isActive: true },
  { id: "3", name: "หัวหน้าแผนก", level: "L2", department: "แผนกคลังสินค้า", isActive: true },
];

export const DOCUMENT_TYPES: MasterDocumentTypeRecord[] = [
  { id: "1", name: "ใบขอซื้อ (PR)", prefix: "PR", docCount: 24, isActive: true },
  { id: "2", name: "ใบสั่งซื้อ (PO)", prefix: "PO", docCount: 18, isActive: true },
  { id: "3", name: "ใบรับรอง", prefix: "CERT", docCount: 5, isActive: true },
];

export const FORM_TYPES: FormTypeRecord[] = [
  { id: "1", name: "ฟอร์ม PR", code: "PR-FRM", fieldsCount: 12, isActive: true },
  { id: "2", name: "ฟอร์ม PO", code: "PO-FRM", fieldsCount: 15, isActive: true },
  { id: "3", name: "ฟอร์มใบรับรอง", code: "CERT-FRM", fieldsCount: 8, isActive: true },
];

export const WORKFLOWS: WorkflowRecord[] = [
  {
    id: "1",
    name: "อนุมัติ PR",
    levels: 3,
    approverCount: 3,
    approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข"],
    isActive: true,
  },
  {
    id: "2",
    name: "อนุมัติ PO",
    levels: 4,
    approverCount: 4,
    approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข", "นภา สุขใจ"],
    isActive: true,
  },
  {
    id: "3",
    name: "อนุมัติใบรับรอง",
    levels: 3,
    approverCount: 3,
    approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข"],
    isActive: true,
  },
];

export const SIGNATURES: SignatureRecord[] = [
  {
    id: "1",
    approverName: "สมชาย ใจดี",
    position: "ผู้จัดการแผนกจัดซื้อ",
    signedCount: 42,
    isActive: true,
  },
  {
    id: "2",
    approverName: "วิภา รักดี",
    position: "หัวหน้าแผนกบัญชี",
    signedCount: 28,
    isActive: true,
  },
  {
    id: "3",
    approverName: "ประเสริฐ มีสุข",
    position: "ผู้อำนวยการ",
    signedCount: 15,
    isActive: true,
  },
];

export const APPROVAL_MATRIX: ApprovalMatrixState = {
  PR: {
    typeName: "ใบขอซื้อ (PR)",
    prefix: "PR",
    formType: "PR-style",
    formCode: "PR-FRM",
    fieldsCount: 12,
    docCount: 24,
    isActive: true,
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย", "ผู้จัดการฝ่ายจัดซื้อ"],
  },
  PO: {
    typeName: "ใบสั่งซื้อ (PO)",
    prefix: "PO",
    formType: "PO-style",
    formCode: "PO-FRM",
    fieldsCount: 15,
    docCount: 18,
    isActive: true,
    steps: ["หัวหน้าแผนก", "ผู้จัดการฝ่าย", "ผู้จัดการฝ่ายจัดซื้อ", "ผู้อำนวยการ"],
  },
  Certificate: {
    typeName: "ใบรับรอง",
    prefix: "CERT",
    formType: "Certificate-style",
    formCode: "CERT-FRM",
    fieldsCount: 8,
    docCount: 5,
    isActive: true,
    steps: ["หัวหน้าแผนก", "ฝ่ายบุคคล"],
  },
  General: {
    typeName: "เอกสารทั่วไป",
    prefix: "GEN",
    formType: "General",
    formCode: "GEN-FRM",
    fieldsCount: 6,
    docCount: 0,
    isActive: true,
    steps: ["หัวหน้าแผนก"],
  },
};

export const DOC_TYPE_TO_MATRIX_KEY = {
  PR: "PR",
  PO: "PO",
  Certificate: "Certificate",
  General: "General",
} as const;

const DEFAULT_APPROVER_BY_ROLE = {
  "หัวหน้าแผนก": "สมชาย ใจดี",
  "ผู้จัดการฝ่าย": "กิตติศักดิ์ พรหมมา",
  "ผู้จัดการฝ่ายจัดซื้อ": "วิภา รักดี",
  "ผู้อำนวยการ": "อรทัย สุขใจ",
  "ฝ่ายบุคคล": "กิตติศักดิ์ พรหมมา",
} as const;

export { DEFAULT_APPROVER_BY_ROLE };
