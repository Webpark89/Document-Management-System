import axios from 'axios';
import {
  type ApprovalMatrixState,
  type DepartmentRecord,
  type DocumentRunningConfig,
  type PositionRecord,
  type SignatureRecord,
  type WorkflowRecord,
} from '@views/features/master-data';
import {
  type ConfigUser,
  type RoleRecord,
} from '@views/features/roles-users';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// --- Master Data ---

export async function getDepartments(): Promise<DepartmentRecord[]> {
  const res = await apiClient.get('/admin/departments');
  return res.data;
}

export async function getPositions(): Promise<PositionRecord[]> {
  const res = await apiClient.get('/admin/positions');
  return res.data;
}

export async function getWorkflows(): Promise<WorkflowRecord[]> {
  const res = await apiClient.get('/admin/workflows');
  return res.data;
}

export async function getSignatures(): Promise<SignatureRecord[]> {
  const res = await apiClient.get('/admin/signatures');
  return res.data;
}

export async function getApprovalMatrix(): Promise<ApprovalMatrixState> {
  const res = await apiClient.get('/admin/approval-matrix');
  return res.data;
}

export async function getDocumentRunningConfigs(): Promise<DocumentRunningConfig[]> {
  const res = await apiClient.get('/admin/running-numbers');
  return res.data;
}

// --- Roles & Users ---

export async function getRoles(): Promise<RoleRecord[]> {
  const res = await apiClient.get('/admin/roles');
  return res.data;
}

export async function getUsers(): Promise<ConfigUser[]> {
  const res = await apiClient.get('/admin/users');
  return res.data;
}
