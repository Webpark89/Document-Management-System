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
    const res = await api.get<any[]>("/api/approvals");
    const docs = res.data || [];
    return docs.map((item) => {
      let mappedStatus = item.stepStatus;
      if (mappedStatus === "Rejected") {
        mappedStatus = "Returned for Revision";
      }

      return {
        id: item.id,
        name: item.name,
        amount: item.amount,
        requester: item.sender,
        submittedDate: item.submittedDate,
        currentLevel: item.stepOrder,
        maxLevels: item.totalSteps,
        status: mappedStatus,
      };
    });
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

export async function submitApprove(
  documentId: string, 
  comment: string,
  signatureParams?: {
    signature_x?: number;
    signature_y?: number;
    signature_page?: number;
    signature_width?: number;
    signature_height?: number;
  }
): Promise<{ success: boolean; message: string }> {
  const payload = { comment, ...signatureParams };
  const res = await api.post<{ success: boolean }>(`/api/workflows/${documentId}/approve`, payload);
  return { success: res.data.success, message: "อนุมัติเอกสารสำเร็จ" };
}

export async function submitReject(
  documentId: string,
  comment: string,
  rejectType: "return" | "cancel" = "return",
  returnToStep?: number
): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean }>(`/api/workflows/${documentId}/reject`, {
    comment,
    reject_type: rejectType,
    return_to_step: returnToStep,
  });
  return { success: res.data.success, message: rejectType === "return" ? "ตีกลับเอกสารสำเร็จ" : "ปฏิเสธเอกสารถาวรสำเร็จ" };
}
