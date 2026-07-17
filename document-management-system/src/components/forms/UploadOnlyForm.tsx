"use client";

import React, { useState } from "react";
import { Save, Send, UploadCloud } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import ApprovalWorkflowSection, {
  WorkflowStepInput,
} from "./ApprovalWorkflowSection";

export interface OtherSubmitData {
  title: string;
  sender: string;
  description: string;
  fileName: string;
  workflowSteps: WorkflowStepInput[];
  isDraft: boolean;
}

interface UploadOnlyFormProps {
  onSubmit: (data: OtherSubmitData) => void;
  onCancel: () => void;
  runningNumberPreview: string;
}

export default function UploadOnlyForm({
  onSubmit,
  onCancel,
  runningNumberPreview,
}: UploadOnlyFormProps) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([
    {
      id: "1",
      stepOrder: 1,
      roleName: "หัวหน้าแผนก (Department Head)",
      approverName: "สมชาย ใจดี",
    },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const triggerSubmit = (isDraft: boolean) => {
    if (!title.trim()) {
      alert("กรุณากรอกหัวข้อเรื่องเอกสาร");
      return;
    }
    if (!isDraft && !uploadedFile) {
      alert("กรุณาแนบไฟล์เอกสารก่อนส่งขออนุมัติ");
      return;
    }
    onSubmit({
      title,
      sender: defaultRequester,
      description,
      fileName: uploadedFile ? uploadedFile.name : "document.pdf",
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Running Number (Preview)
          </label>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 font-mono text-sm font-bold text-slate-600 shadow-xs">
            {runningNumberPreview}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Requester Name (ผู้เสนอเอกสาร)
          </label>
          <input
            type="text"
            readOnly
            value={defaultRequester}
            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-700 cursor-not-allowed"
          />
        </div>
      </div>

      {/* FORM FIELDS */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Document Subject (เรื่องที่ขอเสนออนุมัติ) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น เอกสารแจ้งนโยบายบริษัท, เอกสารชี้แจง..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Description (คำอธิบายเพิ่มเติม)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="คำอธิบาย หรือข้อความสั้นๆ ถึงผู้อนุมัติ..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all resize-none"
          />
        </div>

        {/* FILE UPLOAD ATTACHMENT */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Attach Document File (แนบไฟล์เอกสาร PDF/Word) <span className="text-rose-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {uploadedFile ? uploadedFile.name : "คลิก หรือ ลากไฟล์เอกสารมาวางที่นี่"}
              </p>
              <p className="text-xs text-slate-400">
                รองรับไฟล์ PDF, DOC, DOCX (ขนาดสูงสุดไม่เกิน 25MB)
              </p>
            </div>
          </div>
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
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-slate-200 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            Submit Document (ส่งขออนุมัติ)
          </button>
        </div>
      </div>
    </form>
  );
}
