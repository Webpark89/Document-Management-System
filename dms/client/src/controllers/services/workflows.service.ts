import { api } from "@/lib";

export const workflowsService = {
  async approveStep(documentId: string, comment?: string, signatureData?: { x: number; y: number; page: number }): Promise<boolean> {
    try {
      const res = await api.post<{ success: boolean }>(`/api/workflows/${documentId}/approve`, {
        comment,
        ...signatureData,
      });
      return res.data.success;
    } catch {
      return false; // Return false on error so UI can display message
    }
  },

  async rejectStep(
    documentId: string,
    comment: string,
    rejectType: "return" | "cancel",
    returnToStep?: number
  ): Promise<boolean> {
    try {
      const res = await api.post<{ success: boolean }>(`/api/workflows/${documentId}/reject`, {
        comment,
        reject_type: rejectType,
        return_to_step: returnToStep,
      });
      return res.data.success;
    } catch {
      return false;
    }
  },

  async submitWorkflow(documentId: string, workflowSteps?: Array<{ step_order: number; approver_id?: string }>): Promise<boolean> {
    try {
      const res = await api.post<{ success: boolean }>(`/api/workflows/${documentId}/submit`, {
        workflow_steps: workflowSteps,
      });
      return res.data.success;
    } catch {
      return false;
    }
  },
};
