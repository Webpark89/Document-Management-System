// ============================================================
// Mock API functions — compat layer for friend's @/features/documents/api
// Ready to swap with real API calls when backend is connected
// ============================================================

import type { DashboardStats, Document } from "./types";

let MOCK_DOCS: Document[] = [
  {
    id: "PR-2026-0001",
    name: "ขอซื้อวัสดุสำนักงาน Q3/2026",
    type: "PR",
    sender: "สมชาย ใจดี",
    submittedDate: "14 ก.ค. 2026",
    status: "Pending",
    amount: "฿12,500",
    version: "v1.0",
  },
  {
    id: "PO-2026-0001",
    name: "สั่งซื้อคอมพิวเตอร์ Dell Latitude 5440",
    type: "PO",
    sender: "วิภา รักดี",
    submittedDate: "13 ก.ค. 2026",
    status: "Approved",
    amount: "฿64,000",
    version: "v1.0",
  },
  {
    id: "PR-2026-0002",
    name: "ขอจัดซื้ออุปกรณ์ความปลอดภัยโรงงาน",
    type: "PR",
    sender: "อรทัย สุขใจ",
    submittedDate: "12 ก.ค. 2026",
    status: "Returned for Revision",
    amount: "฿8,200",
    version: "v1.0",
  },
  {
    id: "MEMO-2026-0001",
    name: "บันทึกขออนุมัติเดินทางสัมมนาประจำปี 2026",
    type: "MEMO",
    sender: "ประเสริฐ มีสุข",
    submittedDate: "11 ก.ค. 2026",
    status: "Approved",
    amount: "-",
    version: "v1.0",
  },
  {
    id: "PR-2026-0003",
    name: "ขอซื้อ Software License สำหรับทีมพัฒนา",
    type: "PR",
    sender: "สมชาย ใจดี",
    submittedDate: "10 ก.ค. 2026",
    status: "Pending",
    amount: "฿8,500",
    version: "v1.0",
  },
  {
    id: "PO-2026-0002",
    name: "สั่งซื้อกระดาษ A4 และอุปกรณ์งานพิมพ์",
    type: "PO",
    sender: "ประทีป สุขเจริญ",
    submittedDate: "09 ก.ค. 2026",
    status: "Approved",
    amount: "฿5,000",
    version: "v1.0",
  },
  {
    id: "OTHER-2026-0001",
    name: "เอกสารยินยอมให้เข้าตรวจแปลงผลิตวัตถุดิบ",
    type: "OTHER",
    sender: "กิตติศักดิ์ พรหมมา",
    submittedDate: "08 ก.ค. 2026",
    status: "Approved",
    amount: "-",
    version: "v1.0",
  },
  {
    id: "PR-2026-0004",
    name: "ขอซื้อโต๊ะและเก้าอี้ทำงานฝ่ายบัญชี",
    type: "PR",
    sender: "วิภา รักดี",
    submittedDate: "07 ก.ค. 2026",
    status: "Pending",
    amount: "฿18,000",
    version: "v1.0",
  },
  {
    id: "PO-2026-0003",
    name: "สั่งซื้อเครื่องปั๊มน้ำอุตสาหกรรมสายการผลิต",
    type: "PO",
    sender: "ณัฐพล วงศ์สว่าง",
    submittedDate: "06 ก.ค. 2026",
    status: "Pending",
    amount: "฿120,000",
    version: "v1.0",
  },
  {
    id: "MEMO-2026-0002",
    name: "บันทึกรายงานผลการปรับปรุงระบบเครือข่าย",
    type: "MEMO",
    sender: "สมชาย ใจดี",
    submittedDate: "05 ก.ค. 2026",
    status: "Draft",
    amount: "-",
    version: "v1.0",
  },
];

export async function getDashboardStats(): Promise<DashboardStats> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    total: 24,
    approved: 18,
    pending: 4,
    actionRequired: 2,
    documents: MOCK_DOCS,
    trend: [
      { day: "จ.", documents: 12, approvals: 8 },
      { day: "อ.", documents: 18, approvals: 14 },
      { day: "พ.", documents: 15, approvals: 11 },
      { day: "พฤ.", documents: 22, approvals: 19 },
      { day: "ศ.", documents: 28, approvals: 24 },
      { day: "ส.", documents: 10, approvals: 8 },
      { day: "อา.", documents: 5, approvals: 3 },
    ],
    types: [
      { name: "ใบขอซื้อ (PR)", value: 12, color: "#3B82F6" },
      { name: "ใบสั่งซื้อ (PO)", value: 8, color: "#8B5CF6" },
      { name: "ใบรับรอง", value: 4, color: "#10B981" },
    ],
    goals: [
      { name: "Approval Rate", current: 75, target: 90, unit: "%", colorClass: "bg-emerald-500" },
      { name: "On-time Processing", current: 82, target: 95, unit: "%", colorClass: "bg-blue-500" },
      { name: "Digital Adoption", current: 91, target: 100, unit: "%", colorClass: "bg-indigo-500" },
    ],
    activity: [
      { id: "PR-2026-0001", timestamp: "14 ก.ค. 10:30", delta: "+1" },
      { id: "PO-2026-0001", timestamp: "13 ก.ค. 15:45", delta: "+1" },
      { id: "PR-2026-0002", timestamp: "12 ก.ค. 09:10", delta: "-1" },
    ],
  };
}

export async function getDocuments(): Promise<Document[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_DOCS;
}

export async function addDocument(newDoc: Document): Promise<Document> {
  await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate realistic network delay
  MOCK_DOCS = [newDoc, ...MOCK_DOCS];
  return newDoc;
}
