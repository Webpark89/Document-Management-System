import { api } from "@/lib";

export interface DepartmentDto {
  id: string;
  name: string;
  is_active: boolean;
}

export interface PositionDto {
  id: string;
  name: string;
  is_active: boolean;
}

export const adminService = {
  async getDepartments(): Promise<string[]> {
    try {
      const res = await api.get<DepartmentDto[]>("/api/admin/departments");
      return res.data.map((d) => d.name);
    } catch {
      return ["แผนก IT", "แผนกจัดซื้อ", "แผนก HR", "แผนกผลิต"];
    }
  },

  async getPositions(): Promise<string[]> {
    try {
      const res = await api.get<PositionDto[]>("/api/admin/positions");
      return res.data.map((p) => p.name);
    } catch {
      return ["ผู้อำนวยการ", "ผู้จัดการ", "หัวหน้าแผนก", "พนักงาน"];
    }
  },
};
