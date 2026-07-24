// ============================================================
// API Functions for Workflow and Approvals
// Calls real backend API
// ============================================================

import { api } from "@/lib";

export interface Approval {
  id: string;
  name: string;
  amount: string;
  requester: string;
  submittedDate: string;
  currentLevel: number;
  maxLevels: number;
  status: "Draft" | "Pending" | "Approved" | "Returned for Revision" | "Cancelled";
}

export interface WorkflowStep {
  id: string;
  stepOrder: number;
  roleName: string;
  approverName?: string;
  status: "Pending" | "Approved" | "Rejected";
  actionDate?: string;
  comment?: string;
}

export interface WorkflowData {
  documentId: string;
  status: "Pending" | "Approved" | "Rejected";
  currentStep: number;
  totalSteps: number;
  steps: WorkflowStep[];
}

export async function getApprovals(): Promise<Approval[]> {
  try {
    const res = await api.get<any[]>("/api/documents");
    const docs = res.data || [];
    const pendingDocs = docs.filter((item) => item.status === "Pending");
    return pendingDocs.map((item) => ({
      id: item.doc_number || item.id,
      name: item.name || item.title,
      amount: item.amount || "-",
      requester: item.sender || item.creator_name || "ไม่ระบุ",
      submittedDate: item.submittedDate || "",
      currentLevel: item.workflow?.current_step || 1,
      maxLevels: item.workflow?.total_steps || 1,
      status: item.status || "Pending",
    }));
  } catch (err) {
    console.warn("[getApprovals] Failed to fetch approvals", err);
    return [];
  }
}

export async function getWorkflow(documentId: string): Promise<WorkflowData | null> {
  try {
    const res = await api.get<any>(`/api/workflows/${documentId}`);
    const w = res.data;
    if (!w) return null;
    return {
      documentId: w.document_id || documentId,
      status: w.status,
      currentStep: w.current_step,
      totalSteps: w.total_steps,
      steps: (w.steps || []).map((s: any) => ({
        id: s.id,
        stepOrder: s.step_order,
        roleName: s.approver_role,
        approverName: s.approver_name,
        status: s.status,
        actionDate: s.action_date,
        comment: s.comment,
      })),
    };
  } catch (err) {
    console.warn(`[getWorkflow] No workflow found for document ${documentId}`);
    return null;
  }
}

export async function submitApprove(documentId: string, comment: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean }>(`/api/workflows/${documentId}/approve`, { comment });
  return { success: res.data.success, message: "อนุมัติเอกสารสำเร็จ" };
}

export async function submitReject(documentId: string, comment: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean }>(`/api/workflows/${documentId}/reject`, { comment });
  return { success: res.data.success, message: "ไม่อนุมัติเอกสารสำเร็จ" };
}
