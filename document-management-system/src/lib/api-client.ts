/**
 * API client stubs — swap mock implementations for real fetch per feature later.
 */
import {
  APPROVAL_MATRIX,
  DEPARTMENTS,
  POSITIONS,
  SIGNATURES,
  WORKFLOWS,
  createInitialMasterTabData,
  createInitialRunningConfigs,
  getActiveDepartments,
  getApprovalStepsForPrefix,
  getRunningConfigs,
  buildWorkflowStepsForMatrixKey,
  formatRunningPattern,
  matrixToDocumentTypes,
  syncRunningConfigsWithMatrix,
  updateRunningConfig,
  type ApprovalMatrixState,
  type DepartmentRecord,
  type DocumentRunningConfig,
  type PositionRecord,
  type SignatureRecord,
  type WorkflowRecord,
} from "@/features/master-data";
import {
  MOCK_ROLES,
  MOCK_USERS,
  ROLES,
  USERS,
  countUsersByRole,
  deactivateRole,
  getApproverUsers,
  prependConfigUser,
  prependRole,
  syncMockUsers,
  updateConfigUser,
  type ConfigUser,
  type RoleRecord,
} from "@/features/roles-users";

const MOCK_DELAY_MS = 500;

async function mockDelay<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return value;
}

// --- Master Data ---

export async function getDepartments(): Promise<DepartmentRecord[]> {
  return mockDelay([...DEPARTMENTS]);
}

export async function getPositions(): Promise<PositionRecord[]> {
  return mockDelay([...POSITIONS]);
}

export async function getWorkflows(): Promise<WorkflowRecord[]> {
  return mockDelay([...WORKFLOWS]);
}

export async function getSignatures(): Promise<SignatureRecord[]> {
  return mockDelay([...SIGNATURES]);
}

export async function getMasterTabData() {
  return mockDelay(createInitialMasterTabData());
}

export async function getApprovalMatrix(): Promise<ApprovalMatrixState> {
  return mockDelay({ ...APPROVAL_MATRIX });
}

export async function getDocumentRunningConfigs(): Promise<DocumentRunningConfig[]> {
  return mockDelay(getRunningConfigs());
}

export {
  getActiveDepartments,
  getApprovalStepsForPrefix,
  buildWorkflowStepsForMatrixKey,
  formatRunningPattern,
  matrixToDocumentTypes,
  syncRunningConfigsWithMatrix,
  updateRunningConfig,
  createInitialRunningConfigs,
};

// --- Roles & Users ---

export async function getRoles(): Promise<RoleRecord[]> {
  return mockDelay([...ROLES]);
}

export async function getUsers(): Promise<ConfigUser[]> {
  return mockDelay([...MOCK_USERS]);
}

export {
  USERS,
  ROLES,
  MOCK_USERS,
  MOCK_ROLES,
  countUsersByRole,
  deactivateRole,
  getApproverUsers,
  prependConfigUser,
  prependRole,
  syncMockUsers,
  updateConfigUser,
};
