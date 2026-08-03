import { api } from "@/lib";

export interface DepartmentDto {
  id: string;
  name: string;
  is_active: boolean;
  employeeCount?: number;
}

export interface PositionDto {
  id: string;
  name: string;
  level: string;
  is_active: boolean;
}

export interface DocumentTypeDto {
  id: string;
  type_name: string;
  prefix: string;
  is_active: boolean;
  running_numbers?: any[];
}

export interface AuditLogDto {
  id: string;
  user_id?: string;
  username: string;
  user_fullname: string;
  action: string;
  module: string;
  target_id?: string;
  ip_address: string;
  created_at: string;
}

export const adminService = {
  // ---- Users & Roles ----
  async getUsersList(): Promise<any[]> {
    const res = await api.get<any[]>("/api/admin/users");
    return res.data;
  },

  async createUser(payload: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    department_id?: string;
    position_id?: string;
    role_id?: string;
    password?: string;
  }): Promise<any> {
    const res = await api.post("/api/admin/users", payload);
    return res.data;
  },

  async toggleUserActive(id: string): Promise<any> {
    const res = await api.patch(`/api/admin/users/${id}/toggle-active`);
    return res.data;
  },

  async updateUser(id: string, payload: {
    email: string;
    first_name: string;
    last_name: string;
    department_id?: string;
    position_id?: string;
    role_id?: string;
    is_active?: boolean;
  }): Promise<any> {
    const res = await api.patch(`/api/admin/users/${id}`, payload);
    return res.data;
  },

  async resetUserPassword(id: string, rawPassword: string): Promise<any> {
    const res = await api.post(`/api/admin/users/${id}/reset-password`, { password_hash: rawPassword });
    return res.data;
  },

  async getRolesList(): Promise<any[]> {
    const res = await api.get<any[]>("/api/admin/roles");
    return res.data;
  },

  // ---- Departments ----
  async getDepartments(): Promise<string[]> {
    try {
      const list = await this.getDepartmentsList();
      return list.map((d) => d.name);
    } catch {
      return ["แผนก IT", "แผนกจัดซื้อ", "แผนก HR", "แผนกผลิต"];
    }
  },

  async getDepartmentsList(): Promise<DepartmentDto[]> {
    const res = await api.get<DepartmentDto[]>("/api/admin/departments");
    return res.data;
  },

  async createDepartment(name: string): Promise<DepartmentDto> {
    const res = await api.post<DepartmentDto>("/api/admin/departments", { name });
    return res.data;
  },

  async updateDepartment(id: string, payload: { name?: string; is_active?: boolean }): Promise<DepartmentDto> {
    const res = await api.patch<DepartmentDto>(`/api/admin/departments/${id}`, payload);
    return res.data;
  },

  // ---- Positions ----
  async getPositions(): Promise<string[]> {
    try {
      const list = await this.getPositionsList();
      return list.map((p) => p.name);
    } catch {
      return ["ผู้อำนวยการ", "ผู้จัดการ", "หัวหน้าแผนก", "พนักงาน"];
    }
  },

  async getPositionsList(): Promise<PositionDto[]> {
    const res = await api.get<PositionDto[]>("/api/admin/positions");
    return res.data;
  },

  async createPosition(payload: { name: string; level?: string }): Promise<PositionDto> {
    const res = await api.post<PositionDto>("/api/admin/positions", payload);
    return res.data;
  },

  async updatePosition(id: string, payload: { name?: string; level?: string; is_active?: boolean }): Promise<PositionDto> {
    const res = await api.patch<PositionDto>(`/api/admin/positions/${id}`, payload);
    return res.data;
  },

  // ---- Document Types ----
  async getDocumentTypesList(): Promise<DocumentTypeDto[]> {
    const res = await api.get<DocumentTypeDto[]>("/api/admin/document-types");
    return res.data;
  },

  async createDocumentType(payload: { type_name: string; prefix: string }): Promise<DocumentTypeDto> {
    const res = await api.post<DocumentTypeDto>("/api/admin/document-types", payload);
    return res.data;
  },

  async updateDocumentType(id: string, payload: { type_name?: string; prefix?: string; is_active?: boolean }): Promise<DocumentTypeDto> {
    const res = await api.patch<DocumentTypeDto>(`/api/admin/document-types/${id}`, payload);
    return res.data;
  },

  // ---- Approval Matrix & Running Numbers ----
  async getApprovalMatrix() {
    try {
      const res = await api.get("/api/admin/approval-matrix");
      return res.data;
    } catch {
      return [];
    }
  },

  async createApprovalMatrixStep(payload: { document_type_id: string; step_order: number; approver_role_id: string }) {
    const res = await api.post("/api/admin/approval-matrix", payload);
    return res.data;
  },

  async updateApprovalMatrixStep(id: string, payload: { step_order?: number; approver_role_id?: string }) {
    const res = await api.patch(`/api/admin/approval-matrix/${id}`, payload);
    return res.data;
  },

  async getApprovalWorkflowsList() {
    const res = await api.get("/api/admin/workflows");
    return res.data;
  },

  async updateApprovalWorkflow(documentTypeId: string, payload: { levels: number; steps: string[] }) {
    const res = await api.patch(`/api/admin/workflows/${documentTypeId}`, payload);
    return res.data;
  },

  async getSignaturesList() {
    const res = await api.get("/api/admin/signatures");
    return res.data;
  },

  async updateRunningNumber(id: string, payload: { current_number?: number; padding_length?: number; last_reset_year?: number }) {
    const res = await api.patch(`/api/admin/running-numbers/${id}`, payload);
    return res.data;
  },

  // ---- Audit Logs ----
  async getAuditLogs(search?: string, action?: string): Promise<AuditLogDto[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (action) params.append("action", action);
    const res = await api.get<AuditLogDto[]>(`/api/admin/audit-logs?${params.toString()}`);
    return res.data;
  },
};
