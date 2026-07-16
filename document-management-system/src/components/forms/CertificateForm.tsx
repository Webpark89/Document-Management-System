"use client";

import React, { useState } from "react";
import { Save, Send, Award } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import ApprovalWorkflowSection, {
  WorkflowStepInput,
} from "./ApprovalWorkflowSection";

export interface CertificateSubmitData {
  title: string;
  sender: string;
  department: string;
  certificateType: string;
  issuedTo: string;
  issueDate: string;
  expiryDate: string;
  detail: string;
  workflowSteps: WorkflowStepInput[];
  isDraft: boolean;
}

interface CertificateFormProps {
  onSubmit: (data: CertificateSubmitData) => void;
  onCancel: () => void;
  runningNumberPreview: string;
}

const DEPARTMENTS = [
  "ฝ่ายบริหารทรัพยากรบุคคล (HR)",
  "ฝ่ายเทคโนโลยีสารสนเทศ (IT)",
  "ฝ่ายจัดซื้อและพัสดุ",
  "ฝ่ายบัญชีและการเงิน",
  "ฝ่ายบริหารทั่วไป",
];

const CERTIFICATE_TYPES = [
  "ใบรับรองเงินเดือน (Salary Certificate)",
  "ใบรับรองการทำงาน (Employment Certificate)",
  "ใบรับรองการผ่านงาน (Service Certificate)",
  "ใบรับรองการฝึกอบรม (Training Certificate)",
];

export default function CertificateForm({
  onSubmit,
  onCancel,
  runningNumberPreview,
}: CertificateFormProps) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";
  const defaultDept = user?.department || DEPARTMENTS[0];

  const todayStr = new Date().toISOString().split("T")[0];
  const nextYearStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(defaultDept);
  const [certificateType, setCertificateType] = useState(CERTIFICATE_TYPES[0]);
  const [issuedTo, setIssuedTo] = useState(defaultRequester);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [expiryDate, setExpiryDate] = useState(nextYearStr);
  const [detail, setDetail] = useState("");

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([
    {
      id: "1",
      stepOrder: 1,
      roleName: "เจ้าหน้าที่ HR (HR Officer)",
      approverName: "กิตติศักดิ์ พรหมมา",
    },
    {
      id: "2",
      stepOrder: 2,
      roleName: "ผู้จัดการฝ่าย HR (HR Manager)",
      approverName: "สมชาย ใจดี",
    },
  ]);

  const triggerSubmit = (isDraft: boolean) => {
    if (!title.trim() || !issuedTo.trim()) {
      alert("กรุณากรอกชื่อเรื่องใบรับรองและชื่อผู้รับใบรับรอง");
      return;
    }
    onSubmit({
      title,
      sender: defaultRequester,
      department,
      certificateType,
      issuedTo,
      issueDate,
      expiryDate,
      detail,
      workflowSteps,
      isDraft,
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        triggerSubmit(false);
      }}
      className="space-y-6"
    >
      {/* HEADER METADATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Running Number (Preview)
          </label>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 font-mono text-sm font-bold text-emerald-600 shadow-xs">
            {runningNumberPreview}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Requester Name (ผู้ยื่นคำขอ)
          </label>
          <input
            type="text"
            readOnly
            value={defaultRequester}
            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-700 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Department (แผนกที่สังกัด)
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FORM FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Document Title / Subject (หัวข้อเรื่อง) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ขอออกใบรับรองเงินเดือน เพื่อยื่นขอสินเชื่อที่อยู่อาศัย"
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Certificate Type (ประเภทใบรับรอง)
          </label>
          <select
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
          >
            {CERTIFICATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Issued To (ออกใบรับรองให้แก่) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Issue Date (วันที่ออกเอกสาร)
          </label>
          <input
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Expiry Date (วันที่หมดอายุ)
          </label>
          <input
            type="date"
            required
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Additional Detail (รายละเอียดเพิ่มเติม/วัตถุประสงค์ในการนำไปใช้)
          </label>
          <textarea
            rows={3}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="โปรดระบุวัตถุประสงค์ หรือชื่อสถาบันการเงินที่ต้องการนำไปยื่น..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all resize-none"
          />
        </div>
      </div>

      {/* WORKFLOW MATRIX SELECTION */}
      <ApprovalWorkflowSection
        steps={workflowSteps}
        onChange={setWorkflowSteps}
      />

      {/* ACTION BUTTONS (Draft & Submit) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => triggerSubmit(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer border border-slate-200"
          >
            <Save className="w-4 h-4" />
            Save as Draft (บันทึกร่าง)
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-100 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            Submit Certificate (ส่งขออนุมัติ)
          </button>
        </div>
      </div>
    </form>
  );
}
