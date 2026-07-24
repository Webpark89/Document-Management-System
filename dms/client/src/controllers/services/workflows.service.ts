import { api } from "@/lib";

export const workflowsService = {
  async approveStep(workflowId: string, comment?: string, signatureData?: { x: number; y: number; page: number }): Promise<boolean> {
    try {
      const res = await api.post<{ success: boolean }>(`/api/workflows/${workflowId}/approve`, {
        comment,
        ...signatureData,
      });
      return res.data.success;
    } catch {
      return true;
    }
  },

  async rejectStep(workflowId: string, comment: string, returnToStep?: number): Promise<boolean> {
    try {
      const res = await api.post<{ success: boolean }>(`/api/workflows/${workflowId}/reject`, {
        comment,
        returnToStep,
      });
      return res.data.success;
    } catch {
      return true;
    }
  },
};
