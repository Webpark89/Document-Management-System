import type {
  ApprovalMatrixEntry,
  ApprovalMatrixState,
  DepartmentRecord,
  DocFormTypeKey,
  DocumentRunningConfig,
  DocumentTypeRecord,
  MatrixWorkflowStep,
  PositionRecord,
  RoleOption,
  WorkflowRecord,
} from "../types";
import {
  APPROVAL_MATRIX,
  DEFAULT_APPROVER_BY_ROLE,
  DEPARTMENTS,
  DOCUMENT_TYPES,
  POSITIONS,
  SIGNATURES,
  WORKFLOWS,
} from "./data";

export function getActiveDepartments(departments: DepartmentRecord[] = DEPARTMENTS) {
  return departments.filter((d) => d.isActive);
}

export function countActivePositionsInDepartment(
  departmentName: string,
  positions: PositionRecord[] = POSITIONS
): number {
  return positions.filter((p) => p.department === departmentName && p.isActive).length;
}

export function countWorkflowsUsingApprover(
  approverName: string,
  workflows: WorkflowRecord[] = WORKFLOWS
): number {
  return workflows.filter((w) => w.isActive && w.approvers.includes(approverName)).length;
}

export function createInitialMasterTabData() {
  return {
    doctype: DOCUMENT_TYPES.map((r) => ({ ...r })),
    department: DEPARTMENTS.map((r) => ({ ...r })),
    position: POSITIONS.map((r) => ({ ...r })),
    workflow: WORKFLOWS.map((r) => ({ ...r, approvers: [...r.approvers] })),
    signature: SIGNATURES.map((r) => ({ ...r })),
  };
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
  return Object.entries(matrix).map(([key, entry]) => createDefaultRunningConfig(key, entry));
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