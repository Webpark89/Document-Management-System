import axios from 'axios';
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
} from '@views/features/master-data';
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
} from '@views/features/roles-users';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle auth failures
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const MOCK_DELAY_MS = 300;

async function mockDelay<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return value;
}

// --- Master Data (Fallback/Mock for UI components awaiting full backend seed) ---

export async function getDepartments(): Promise<DepartmentRecord[]> {
  try {
    const res = await apiClient.get('/admin/departments');
    return res.data;
  } catch {
    return mockDelay([...DEPARTMENTS]);
  }
}

export async function getPositions(): Promise<PositionRecord[]> {
  try {
    const res = await apiClient.get('/admin/positions');
    return res.data;
  } catch {
    return mockDelay([...POSITIONS]);
  }
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
  try {
    const res = await apiClient.get('/admin/roles');
    return res.data;
  } catch {
    return mockDelay([...ROLES]);
  }
}

export async function getUsers(): Promise<ConfigUser[]> {
  try {
    const res = await apiClient.get('/admin/users');
    return res.data;
  } catch {
    return mockDelay([...MOCK_USERS]);
  }
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
