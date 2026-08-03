import useSWR from "swr";
import { api } from "@/lib";

export interface WorkflowDetail {
  id: string;
  document_id: string;
  total_steps: number;
  current_step: number;
  status: string;
  steps: Array<{
    id: string;
    step_order: number;
    approver_name: string;
    approver_role: string;
    status: string;
    action_date?: string;
    comment?: string;
    signature_applied: boolean;
  }>;
}

export function useWorkflow(documentId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR(
    documentId ? `/api/workflows/${documentId}` : null,
    async () => {
      const res = await api.get<WorkflowDetail>(`/api/workflows/${documentId}`);
      return res.data;
    }
  );

  return {
    workflow: data,
    isLoading,
    isError: error,
    mutate,
  };
}
