// Unified in-memory mock data for Admin Config + Master Data + Approval Matrix.
// Single source of truth — do not duplicate these arrays elsewhere.

// ---------------------------------------------------------------------------
// Users, roles, master-data entities
// ---------------------------------------------------------------------------

export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  role: "Employee" | "Manager" | "Executive" | "Administrator";
  status: UserStatus;
}

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
}

export interface RoleRecord {
  id: string;
  name: string;
  permissionSummary: string;
  isActive: boolean;
}

export type ConfigUser = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
};

export const LEVEL_OPTIONS = ["L1", "L2", "L3", "L4", "Executive"] as const;

export const USER_ROLE_OPTIONS = [
  "Employee",
  "Manager",
  "Executive",
  "Administrator",
] as const;

export let USERS: AdminUser[] = [
  {
    id: "1",
    name: "สมชาย ใจดี",
    position: "ผู้จัดการแผนกจัดซื้อ",
    department: "แผนกจัดซื้อ",
    email: "somchai@company.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "2",
    name: "สุดา วงศ์ศรี",
    position: "หัวหน้าแผนกบัญชี",
    department: "แผนกบัญชี",
    email: "suda@company.com",
    role: "Employee",
    status: "active",
  },
  {
    id: "3",
    name: "วิภา รักดี",
    position: "หัวหน้าแผนกบัญชี",
    department: "แผนกคลังสินค้า",
    email: "wipa@company.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "4",
    name: "ประเสริฐ มีสุข",
    position: "ผู้อำนวยการ",
    department: "แผนก IT",
    email: "prasert@company.com",
    role: "Executive",
    status: "active",
  },
  {
    id: "5",
    name: "นภา สุขใจ",
    position: "เจ้าหน้าที่แผนก IT",
    department: "แผนกบัญชี",
    email: "napja@company.com",
    role: "Employee",
    status: "inactive",
  },
];

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

export let ROLES: RoleRecord[] = [
  { id: "1", name: "Administrator", permissionSummary: "Full access", isActive: true },
  { id: "2", name: "Executive", permissionSummary: "View, Create, Approve", isActive: true },
  { id: "3", name: "Manager", permissionSummary: "View, Create, Edit, Approve", isActive: true },
  { id: "4", name: "Employee", permissionSummary: "View, Create", isActive: true },
  { id: "5", name: "Senior manager", permissionSummary: "View, Create, Edit", isActive: false },
];

export function formatApproverLabel(user: Pick<AdminUser, "name" | "position">) {
  return `${user.name} — ${user.position}`;
}

export function getActiveDepartments(departments: DepartmentRecord[] = DEPARTMENTS) {
  return departments.filter((d) => d.isActive);
}

export function getApproverUsers(users: AdminUser[] = USERS) {
  return users.filter((u) => u.status === "active");
}

export function toConfigUser(user: AdminUser): ConfigUser {
  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
    department: user.department,
    position: user.position,
    role: user.role,
    isActive: user.status === "active",
  };
}

export function fromConfigUser(user: ConfigUser): AdminUser {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    department: user.department,
    position: user.position,
    role: user.role as AdminUser["role"],
    status: user.isActive ? "active" : "inactive",
  };
}

export function getUsersAsConfig(): ConfigUser[] {
  return USERS.map(toConfigUser);
}

export let MOCK_USERS = getUsersAsConfig();

export function syncMockUsers() {
  MOCK_USERS = getUsersAsConfig();
}

export function prependConfigUser(user: ConfigUser) {
  USERS = [fromConfigUser(user), ...USERS];
  syncMockUsers();
}

export function updateConfigUser(id: string, patch: Partial<ConfigUser>) {
  USERS = USERS.map((u) => {
    if (u.id !== id) return u;
    const merged = { ...toConfigUser(u), ...patch };
    return fromConfigUser(merged);
  });
  syncMockUsers();
}

export function countUsersByRole(roleName: string, users: ConfigUser[] = MOCK_USERS) {
  return users.filter((u) => u.role === roleName).length;
}

export function countUsersInDepartment(departmentName: string): number {
  return USERS.filter((u) => u.department === departmentName && u.status === "active").length;
}

export function countActivePositionsInDepartment(
  departmentName: string,
  positions: PositionRecord[] = POSITIONS
): number {
  return positions.filter((p) => p.department === departmentName && p.isActive).length;
}

export function countUsersWithPosition(positionName: string): number {
  return USERS.filter(
    (u) =>
      u.status === "active" &&
      (u.position === positionName || u.position.includes(positionName))
  ).length;
}

export function countWorkflowsUsingApprover(
  approverName: string,
  workflows: WorkflowRecord[] = WORKFLOWS
): number {
  return workflows.filter((w) => w.isActive && w.approvers.includes(approverName)).length;
}

export function prependRole(role: RoleRecord) {
  ROLES.unshift(role);
}

export const MOCK_ROLES = ROLES;

export function createInitialMasterTabData() {
  return {
    doctype: DOCUMENT_TYPES.map((r) => ({ ...r })),
    department: DEPARTMENTS.map((r) => ({ ...r })),
    position: POSITIONS.map((r) => ({ ...r })),
    workflow: WORKFLOWS.map((r) => ({ ...r, approvers: [...r.approvers] })),
    signature: SIGNATURES.map((r) => ({ ...r })),
  };
}

// ---------------------------------------------------------------------------
// Approval matrix + document forms + running numbers
// ---------------------------------------------------------------------------

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

export function matrixToDocumentTypes(matrix: ApprovalMatrixState): DocumentTypeRecord[] {
  return Object.entries(matrix).map(([key, entry]) => ({
    key,
    typeName: entry.typeName,
    prefix: entry.prefix,
    formType: entry.formType,
    formCode: entry.formCode,
    fieldsCount: entry.fieldsCount,
    docCount: entry.docCount,
    isActive: entry.isActive,
  }));
}

export function getApprovalStepsForPrefix(
  prefix: string,
  matrix: ApprovalMatrixState = APPROVAL_MATRIX
): RoleOption[] {
  const entry = Object.values(matrix).find((e) => e.prefix === prefix);
  return entry ? [...entry.steps] : [];
}

export type DocFormTypeKey = "PR" | "PO" | "Certificate" | "General";

export const DOC_TYPE_TO_MATRIX_KEY: Record<string, DocFormTypeKey> = {
  PR: "PR",
  PO: "PO",
  Certificate: "Certificate",
  General: "General",
};

const DEFAULT_APPROVER_BY_ROLE: Record<RoleOption, string> = {
  "หัวหน้าแผนก": "สมชาย ใจดี",
  "ผู้จัดการฝ่าย": "กิตติศักดิ์ พรหมมา",
  "ผู้จัดการฝ่ายจัดซื้อ": "วิภา รักดี",
  "ผู้อำนวยการ": "อรทัย สุขใจ",
  "ฝ่ายบุคคล": "กิตติศักดิ์ พรหมมา",
};

export interface MatrixWorkflowStep {
  id: string;
  stepOrder: number;
  roleName: RoleOption;
  approverName: string;
}

export function buildWorkflowStepsForMatrixKey(
  matrixKey: DocFormTypeKey,
  matrix: ApprovalMatrixState = APPROVAL_MATRIX
): MatrixWorkflowStep[] {
  const entry = matrix[matrixKey];
  if (!entry) return [];
  return entry.steps.map((role, index) => ({
    id: String(index + 1),
    stepOrder: index + 1,
    roleName: role,
    approverName: DEFAULT_APPROVER_BY_ROLE[role] ?? "",
  }));
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

function buddhistYearParts(): { be4: string; be2: string } {
  const be4 = String(new Date().getFullYear() + 543);
  return { be4, be2: be4.slice(-2) };
}

export function formatRunningPattern(
  config: Pick<DocumentRunningConfig, "prefix" | "yearFormat" | "runningDigits" | "separator">,
  nextCounter = 1
): { pattern: string; example: string } {
  const sep = config.separator === "none" ? "" : config.separator;
  const runToken = `{RUNNING:${config.runningDigits}}`;
  const yearToken =
    config.yearFormat === "be4" ? "{YYYY}" : config.yearFormat === "be2" ? "{YY}" : null;

  let pattern = "{PREFIX}";
  if (yearToken) pattern += sep ? `${sep}${yearToken}` : yearToken;
  pattern += sep ? `${sep}${runToken}` : runToken;

  const { be4, be2 } = buddhistYearParts();
  const yearVal = config.yearFormat === "be4" ? be4 : config.yearFormat === "be2" ? be2 : null;
  const nextNum = String(nextCounter).padStart(config.runningDigits, "0");

  let example = config.prefix;
  if (yearVal) example += sep ? `${sep}${yearVal}` : yearVal;
  example += sep ? `${sep}${nextNum}` : nextNum;

  return { pattern, example };
}

export function createDefaultRunningConfig(
  matrixKey: string,
  entry: ApprovalMatrixEntry
): DocumentRunningConfig {
  return {
    matrixKey,
    typeName: entry.typeName,
    prefix: entry.prefix,
    yearFormat: "be4",
    runningDigits: 4,
    separator: "-",
    resetCycle: "yearly",
    currentCounter: entry.docCount,
    isActive: entry.isActive,
  };
}

export function createInitialRunningConfigs(
  matrix: ApprovalMatrixState = APPROVAL_MATRIX
): DocumentRunningConfig[] {
  return Object.entries(matrix).map(([key, entry]) =>
    createDefaultRunningConfig(key, entry)
  );
}

export let RUNNING_CONFIGS: DocumentRunningConfig[] = createInitialRunningConfigs();

export function getRunningConfigs(): DocumentRunningConfig[] {
  return RUNNING_CONFIGS.map((c) => ({ ...c }));
}

export function updateRunningConfig(
  matrixKey: string,
  patch: Partial<Omit<DocumentRunningConfig, "matrixKey" | "prefix">>
): void {
  const idx = RUNNING_CONFIGS.findIndex((c) => c.matrixKey === matrixKey);
  if (idx < 0) return;
  RUNNING_CONFIGS[idx] = { ...RUNNING_CONFIGS[idx], ...patch };
}

export function appendRunningConfig(matrixKey: string, entry: ApprovalMatrixEntry): void {
  if (RUNNING_CONFIGS.some((c) => c.matrixKey === matrixKey)) {
    const idx = RUNNING_CONFIGS.findIndex((c) => c.matrixKey === matrixKey);
    RUNNING_CONFIGS[idx] = {
      ...RUNNING_CONFIGS[idx],
      typeName: entry.typeName,
      prefix: entry.prefix,
      isActive: entry.isActive,
    };
    return;
  }
  RUNNING_CONFIGS.push(createDefaultRunningConfig(matrixKey, entry));
}

export function syncRunningConfigsWithMatrix(matrix: ApprovalMatrixState): DocumentRunningConfig[] {
  for (const [key, entry] of Object.entries(matrix)) {
    const idx = RUNNING_CONFIGS.findIndex((c) => c.matrixKey === key);
    if (idx < 0) {
      RUNNING_CONFIGS.push(createDefaultRunningConfig(key, entry));
    } else {
      RUNNING_CONFIGS[idx] = {
        ...RUNNING_CONFIGS[idx],
        typeName: entry.typeName,
        prefix: entry.prefix,
      };
    }
  }
  return getRunningConfigs();
}
