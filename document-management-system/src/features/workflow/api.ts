// ============================================================
// Mock API functions for workflow and approvals
// ============================================================

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

const MOCK_APPROVALS: Approval[] = [
  {
    id: "PR-2026-0001",
    name: "ขอซื้อวัสดุสำนักงาน Q3/2026",
    amount: "฿12,500",
    requester: "สมชาย ใจดี",
    submittedDate: "14 ก.ค. 2026",
    currentLevel: 1,
    maxLevels: 3,
    status: "Pending",
  },
  {
    id: "PO-2026-0001",
    name: "สั่งซื้อคอมพิวเตอร์ Dell Latitude 5440",
    amount: "฿64,000",
    requester: "วิภา รักดี",
    submittedDate: "13 ก.ค. 2026",
    currentLevel: 2,
    maxLevels: 3,
    status: "Pending",
  },
  {
    id: "PR-2026-0002",
    name: "ขอจัดซื้ออุปกรณ์ความปลอดภัย",
    amount: "฿8,200",
    requester: "อรทัย สุขใจ",
    submittedDate: "12 ก.ค. 2026",
    currentLevel: 1,
    maxLevels: 2,
    status: "Returned for Revision",
  },
];

export async function getApprovals(): Promise<Approval[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_APPROVALS;
}

// Mock Workflow Data
const MOCK_WORKFLOWS: Record<string, WorkflowData> = {
  "PR-2026-0001": {
    documentId: "PR-2026-0001",
    status: "Pending",
    currentStep: 2,
    totalSteps: 3,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "หัวหน้าแผนก",
        approverName: "สมชาย ใจดี",
        status: "Approved",
        actionDate: "14 ก.ค. 2026 10:30",
        comment: "เห็นควรอนุมัติ",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "ผู้จัดการฝ่าย",
        approverName: "วิภา รักดี",
        status: "Pending",
      },
      {
        id: "step-3",
        stepOrder: 3,
        roleName: "ผู้อำนวยการ",
        status: "Pending",
      },
    ],
  },
};

export async function getWorkflow(documentId: string): Promise<WorkflowData | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_WORKFLOWS[documentId] || null;
}

export async function submitApprove(documentId: string, comment: string): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, message: "อนุมัติเอกสารสำเร็จ" };
}

export async function submitReject(documentId: string, comment: string): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, message: "ไม่อนุมัติเอกสารสำเร็จ" };
}
