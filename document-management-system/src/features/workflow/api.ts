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
    maxLevels: 4,
    status: "Pending",
  },
  {
    id: "PR-2026-0002",
    name: "ขอจัดซื้ออุปกรณ์ความปลอดภัยโรงงาน",
    amount: "฿8,200",
    requester: "อรทัย สุขใจ",
    submittedDate: "12 ก.ค. 2026",
    currentLevel: 1,
    maxLevels: 3,
    status: "Returned for Revision",
  },
  {
    id: "PR-2026-0003",
    name: "ขอซื้อ Software License สำหรับทีมพัฒนา",
    amount: "฿8,500",
    requester: "สมชาย ใจดี",
    submittedDate: "10 ก.ค. 2026",
    currentLevel: 1,
    maxLevels: 3,
    status: "Pending",
  },
  {
    id: "PR-2026-0004",
    name: "ขอซื้อโต๊ะและเก้าอี้ทำงานฝ่ายบัญชี",
    amount: "฿18,000",
    requester: "วิภา รักดี",
    submittedDate: "07 ก.ค. 2026",
    currentLevel: 2,
    maxLevels: 3,
    status: "Pending",
  },
  {
    id: "PO-2026-0003",
    name: "สั่งซื้อเครื่องปั๊มน้ำอุตสาหกรรมสายการผลิต",
    amount: "฿120,000",
    requester: "ณัฐพล วงศ์สว่าง",
    submittedDate: "06 ก.ค. 2026",
    currentLevel: 3,
    maxLevels: 4,
    status: "Pending",
  },
  {
    id: "MEMO-2026-0001",
    name: "บันทึกขออนุมัติเดินทางสัมมนาประจำปี 2026",
    amount: "-",
    requester: "ประเสริฐ มีสุข",
    submittedDate: "11 ก.ค. 2026",
    currentLevel: 2,
    maxLevels: 2,
    status: "Approved",
  },
  {
    id: "PO-2026-0002",
    name: "สั่งซื้อกระดาษ A4 และอุปกรณ์งานพิมพ์",
    amount: "฿5,000",
    requester: "ประทีป สุขเจริญ",
    submittedDate: "09 ก.ค. 2026",
    currentLevel: 4,
    maxLevels: 4,
    status: "Approved",
  },
  {
    id: "OTHER-2026-0001",
    name: "เอกสารยินยอมให้เข้าตรวจแปลงผลิตวัตถุดิบ",
    amount: "-",
    requester: "กิตติศักดิ์ พรหมมา",
    submittedDate: "08 ก.ค. 2026",
    currentLevel: 1,
    maxLevels: 1,
    status: "Approved",
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
        comment: "เห็นควรจัดซื้อตามความเหมาะสม",
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
        approverName: "ประเสริฐ มีสุข",
        status: "Pending",
      },
    ],
  },
  "PO-2026-0001": {
    documentId: "PO-2026-0001",
    status: "Approved",
    currentStep: 4,
    totalSteps: 4,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "เจ้าหน้าที่ไอที",
        approverName: "นภา สุขใจ",
        status: "Approved",
        actionDate: "13 ก.ค. 2026 09:15",
        comment: "สเปกเครื่อง Dell Latitude เหมาะสมกับการใช้งาน",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "หัวหน้าแผนกจัดซื้อ",
        approverName: "สมชาย ใจดี",
        status: "Approved",
        actionDate: "13 ก.ค. 2026 11:20",
        comment: "อนุมัติสั่งซื้อตามงบประมาณไอที",
      },
      {
        id: "step-3",
        stepOrder: 3,
        roleName: "ผู้จัดการฝ่าย",
        approverName: "วิภา รักดี",
        status: "Approved",
        actionDate: "13 ก.ค. 2026 14:00",
        comment: "ดำเนินการจัดซื้อได้เลย",
      },
      {
        id: "step-4",
        stepOrder: 4,
        roleName: "ผู้อำนวยการ",
        approverName: "ประเสริฐ มีสุข",
        status: "Approved",
        actionDate: "13 ก.ค. 2026 16:30",
        comment: "อนุมัติ โครงการ Dell Laptop สำหรับพนักงานใหม่",
      },
    ],
  },
  "PR-2026-0002": {
    documentId: "PR-2026-0002",
    status: "Rejected",
    currentStep: 2,
    totalSteps: 3,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "หัวหน้าแผนกโรงงาน",
        approverName: "สมชาย ใจดี",
        status: "Approved",
        actionDate: "12 ก.ค. 2026 10:00",
        comment: "เห็นชอบตามมาตรการความปลอดภัย",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "ผู้จัดการฝ่ายจัดซื้อ",
        approverName: "วิภา รักดี",
        status: "Rejected",
        actionDate: "12 ก.ค. 2026 14:30",
        comment: "ขอปฏิเสธเบื้องต้นเพื่อขอเอกสารใบเสนอราคาเปรียบเทียบจากคู่ค้าอย่างน้อย 3 รายเพิ่มเติม",
      },
      {
        id: "step-3",
        stepOrder: 3,
        roleName: "ผู้อำนวยการ",
        approverName: "ประเสริฐ มีสุข",
        status: "Pending",
      },
    ],
  },
  "MEMO-2026-0001": {
    documentId: "MEMO-2026-0001",
    status: "Approved",
    currentStep: 2,
    totalSteps: 2,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "ผู้จัดการฝ่าย",
        approverName: "วิภา รักดี",
        status: "Approved",
        actionDate: "11 ก.ค. 2026 13:45",
        comment: "อนุมัติให้เข้าร่วมสัมมนาเพื่อการพัฒนาบุคลากร",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "ผู้อำนวยการ",
        approverName: "ประเสริฐ มีสุข",
        status: "Approved",
        actionDate: "11 ก.ค. 2026 16:00",
        comment: "อนุมัติค่าเดินทางและที่พักตามระเบียบบริษัท",
      },
    ],
  },
  "PR-2026-0003": {
    documentId: "PR-2026-0003",
    status: "Pending",
    currentStep: 2,
    totalSteps: 3,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "หัวหน้าแผนกไอที",
        approverName: "สมชาย ใจดี",
        status: "Approved",
        actionDate: "10 ก.ค. 2026 11:00",
        comment: "จำเป็นต้องใช้งานเพื่อพัฒนาโปรเจกต์ใหม่ของบริษัท",
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
        approverName: "ประเสริฐ มีสุข",
        status: "Pending",
      },
    ],
  },
  "PO-2026-0002": {
    documentId: "PO-2026-0002",
    status: "Approved",
    currentStep: 3,
    totalSteps: 3,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "หัวหน้าแผนกจัดซื้อ",
        approverName: "สมชาย ใจดี",
        status: "Approved",
        actionDate: "09 ก.ค. 2026 10:15",
        comment: "ตรวจสอบราคากลางถูกต้องและราคาดีที่สุดแล้ว",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "ผู้จัดการคลังสินค้า",
        approverName: "วิภา รักดี",
        status: "Approved",
        actionDate: "09 ก.ค. 2026 13:00",
        comment: "เตรียมพื้นที่จัดเก็บคลังสินค้าเรียบร้อย",
      },
      {
        id: "step-3",
        stepOrder: 3,
        roleName: "ผู้อำนวยการ",
        approverName: "ประเสริฐ มีสุข",
        status: "Approved",
        actionDate: "09 ก.ค. 2026 15:30",
        comment: "อนุมัติสั่งซื้อตามเงื่อนไขส่งมอบงานพิมพ์",
      },
    ],
  },
  "OTHER-2026-0001": {
    documentId: "OTHER-2026-0001",
    status: "Approved",
    currentStep: 2,
    totalSteps: 2,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "ผู้จัดการควบคุมคุณภาพ",
        approverName: "นภา สุขใจ",
        status: "Approved",
        actionDate: "08 ก.ค. 2026 11:20",
        comment: "ผ่านเกณฑ์การตรวจสอบสุขอนามัยเบื้องต้น",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "ผู้จัดการฝ่ายโรงงาน",
        approverName: "วิภา รักดี",
        status: "Approved",
        actionDate: "08 ก.ค. 2026 15:00",
        comment: "อนุญาตให้เข้าปฏิบัติงานตรวจเช็คแปลงการผลิตวัตถุดิบได้",
      },
    ],
  },
  "PR-2026-0004": {
    documentId: "PR-2026-0004",
    status: "Pending",
    currentStep: 2,
    totalSteps: 3,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "หัวหน้าแผนกบัญชี",
        approverName: "สุดา วงศ์ศรี",
        status: "Approved",
        actionDate: "07 ก.ค. 2026 10:30",
        comment: "ขออนุมัติเพื่อทดแทนเก้าอี้และโต๊ะเก่าที่ชำรุดมาก",
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
        approverName: "ประเสริฐ มีสุข",
        status: "Pending",
      },
    ],
  },
  "PO-2026-0003": {
    documentId: "PO-2026-0003",
    status: "Pending",
    currentStep: 3,
    totalSteps: 4,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "หัวหน้าแผนกช่างซ่อม",
        approverName: "สุดา วงศ์ศรี",
        status: "Approved",
        actionDate: "06 ก.ค. 2026 10:00",
        comment: "ระบบปั๊มน้ำหลักรั่วไหล รักษาระดับแรงดันไม่ได้ กระทบกระบวนการผลิต",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "ผู้จัดการฝ่ายวิศวกรรม",
        approverName: "นภา สุขใจ",
        status: "Approved",
        actionDate: "06 ก.ค. 2026 14:00",
        comment: "ยืนยันความเร่งด่วนตามรายงานวิศวกรรมซ่อมบำรุง",
      },
      {
        id: "step-3",
        stepOrder: 3,
        roleName: "ผู้จัดการฝ่ายจัดซื้อ",
        approverName: "สมชาย ใจดี",
        status: "Pending",
      },
      {
        id: "step-4",
        stepOrder: 4,
        roleName: "ผู้อำนวยการ",
        approverName: "ประเสริฐ มีสุข",
        status: "Pending",
      },
    ],
  },
  "MEMO-2026-0002": {
    documentId: "MEMO-2026-0002",
    status: "Pending",
    currentStep: 1,
    totalSteps: 2,
    steps: [
      {
        id: "step-1",
        stepOrder: 1,
        roleName: "ผู้จัดการไอที",
        approverName: "สมชาย ใจดี",
        status: "Pending",
      },
      {
        id: "step-2",
        stepOrder: 2,
        roleName: "ผู้อำนวยการเทคโนโลยี",
        approverName: "ประเสริฐ มีสุข",
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
