// ============================================================
// API Functions for Workflow and Approvals
// Calls real backend API
// ============================================================

import { api, ApiError } from "@/lib";
import { formatThaiDate, formatThaiTime } from "@/lib/format-date";

export interface Approval {
  id: string;
  real_id?: string;
  department?: string;
  type?: string;
  name: string;
  amount: string;
  requester: string;
  approvers?: string[];
  submittedDate: string;
  submittedTime?: string;
  rawSubmittedDate?: number;
  currentLevel: number;
  maxLevels: number;
  status:
    | "Draft"
    | "Pending"
    | "Approved"
    | "Returned"
    | "Returned for Revision"
    | "Cancelled"
    | string;
}

export interface WorkflowStep {
  id: string;
  stepOrder: number;
  roleName: string;
  approverName?: string;
  approverId?: string | null;
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
    return docs.map((item: any) => {
      let mappedStatus = item.stepStatus;
      if (mappedStatus === "Rejected") {
        mappedStatus = "Returned for Revision";
      }

      return {
        id: item.id,
        real_id: item.real_id,
        department: item.department,
        type: item.type,
        name: item.name,
        amount: item.amount,
        requester: item.sender,
        approvers: item.approvers || [],
        submittedDate: formatThaiDate(
          item.submittedDate || item.created_at || item.createdAt,
        ),
        submittedTime: formatThaiTime(
          item.submittedDate || item.created_at || item.createdAt,
        ),
        rawSubmittedDate: new Date(
          item.submittedDate || item.created_at || item.createdAt || Date.now(),
        ).getTime(),
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

export function mapWorkflow(w: any, documentId: string): WorkflowData | null {
  if (!w) return null;
  return {
    documentId: w.document_id || documentId,
    status: w.status,
    currentStep: w.current_step,
    totalSteps: w.total_steps,
    steps: (w.steps || []).map((s: any) => ({
      id: s.id,
      stepOrder: s.step_order,
      roleName: s.approver_role || s.approver?.role?.name || "",
      approverName:
        s.approver_name ||
        (s.approver
          ? `${s.approver.first_name || ""} ${s.approver.last_name || ""}`.trim()
          : undefined),
      approverId: s.approver_id,
      status: s.status,
      actionDate: s.action_date,
      comment: s.comment,
    })),
  };
}

export async function getWorkflow(
  documentId: string,
): Promise<WorkflowData | null> {
  try {
    const res = await api.get<any>(`/api/workflows/${documentId}`);
    return mapWorkflow(res.data, documentId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
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
    expected_step: number;
    expected_version: number;
    annotation_text?: string;
    date_stamp?: boolean;
  },
): Promise<{ success: boolean; message: string }> {
  const payload = { comment, ...signatureParams };
  const res = await api.post<{ success: boolean }>(
    `/api/workflows/${documentId}/approve`,
    payload,
  );
  return { success: res.data.success, message: "อนุมัติเอกสารสำเร็จ" };
}

export async function submitReject(
  documentId: string,
  comment: string,
  rejectType: "return" | "cancel" = "return",
  returnToStep?: number,
  expectedStep?: number,
  expectedVersion?: number,
): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean }>(
    `/api/workflows/${documentId}/reject`,
    {
      comment,
      reject_type: rejectType,
      return_to_step: returnToStep,
      expected_step: expectedStep,
      expected_version: expectedVersion,
    },
  );
  return {
    success: res.data.success,
    message:
      rejectType === "return" ? "ตีกลับเอกสารสำเร็จ" : "ปฏิเสธเอกสารถาวรสำเร็จ",
  };
}
