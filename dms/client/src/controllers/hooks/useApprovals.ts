import useSWR from "swr";
import { api } from "@/lib";

export interface ApprovalItem {
  id: string;
  real_id: string;
  docId: string;
  docName: string;
  name: string;
  type: string;
  sender: string;
  submittedDate: string;
  amount: string;
  status: string;
  stepOrder: number;
  totalSteps: number;
  comment?: string;
}

export function useApprovals() {
  const { data, error, mutate, isLoading } = useSWR(
    "/api/approvals",
    async () => {
      const res = await api.get<ApprovalItem[]>("/api/approvals");
      return res.data;
    }
  );

  return {
    approvals: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
