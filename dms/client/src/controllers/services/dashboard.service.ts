import { api } from "@/lib";

export interface DashboardStats {
  total: number;
  approved: number;
  pending: number;
  actionRequired: number;
  activity: Array<{
    id: string;
    action: string;
    module: string;
    date: string;
  }>;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>("/api/dashboard/stats");
    return res.data;
  },
};
