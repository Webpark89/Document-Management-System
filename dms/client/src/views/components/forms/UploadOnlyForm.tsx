"use client";

import React, { useState, useEffect } from "react";
import { DocumentPreview } from "@views/components/documents/DocumentPreview";
import { Save, Send, UploadCloud, FileText, Trash2, Eye } from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';
import Step2Visibility, { VisibilityData } from "./Step2Visibility";
import ApprovalWorkflowSection, {
  WorkflowStepInput,
} from "./ApprovalWorkflowSection";

export interface OtherSubmitData {
  title: string;
  sender: string;
  description: string;
  file: File | null;
  visibility: VisibilityData;
  workflowSteps: WorkflowStepInput[];
  isDraft: boolean;
}

interface UploadOnlyFormProps {
  onSubmit: (data: OtherSubmitData) => void;
  onCancel: () => void;
  runningNumberPreview: string;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  initialData?: any;
}

export default function UploadOnlyForm({
  onSubmit,
  onCancel,
  runningNumberPreview,
  currentStep,
  onNext,
  onBack,
  initialData,
}: UploadOnlyFormProps) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showInlinePreview, setShowInlinePreview] = useState(false);

  const [visibility, setVisibility] = useState<VisibilityData>({ type: "CompanyWide", departments: [], users: [] });
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([]);

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl(null);
    }
  }, [uploadedFile]);

  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.purpose) setDescription(initialData.purpose);
    }
  }, [initialData]);

  useEffect(() => {
    async function loadWorkflow() {
      try {
        const { adminService } = await import("@/controllers/services/admin.service");
        const workflows = (await adminService.getApprovalWorkflowsList()) as any[];
        const docFlow = Array.isArray(workflows) ? workflows.find((w: any) => w.prefix === "OTHER" || w.prefix === "DOC") : null;
        if (docFlow && docFlow.steps && docFlow.steps.length > 0) {
          setWorkflowSteps(
            docFlow.steps.map((role: string, idx: number) => ({
              id: String(idx + 1),
              stepOrder: idx + 1,
              roleName: role,
              approverName: "",
            }))
          );
        } else {
          setWorkflowSteps([
            { id: "1", stepOrder: 1, roleName: "ผู้จัดการแผนก (Department Manager)", approverName: "" },
            { id: "2", stepOrder: 2, roleName: "ผู้อนุมัติ / ผู้บริหาร (Executive/Director)", approverName: "" },
          ]);
        }
      } catch (err) {
        setWorkflowSteps([
          { id: "1", stepOrder: 1, roleName: "ผู้จัดการแผนก (Department Manager)", approverName: "" },
          { id: "2", stepOrder: 2, roleName: "ผู้อนุมัติ / ผู้บริหาร (Executive/Director)", approverName: "" },
        ]);
      }
    }
    loadWorkflow();
  }, []);

  const handleSubmit = (isDraft: boolean) => {
    onSubmit({
      title,
      sender: defaultRequester,
      description,
      file: uploadedFile,
      visibility,
      workflowSteps,
      isDraft,
    });
  };

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">
              ข้อมูลเอกสารทั่วไป (General Document Details)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              กรอกข้อมูลหัวข้อเอกสาร รายละเอียด และอัปโหลดไฟล์ PDF
            </p>
          </div>

          {/* Section 1: Document Metadata */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
              1. หัวข้อและผู้เสนอเอกสาร
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เลขที่เอกสาร (Preview)
                </label>
                <input
                  type="text"
                  disabled
                  value={runningNumberPreview}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อเรื่องเอกสาร <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ระบุชื่อเรื่องเอกสาร เช่น สัญญาว่าจ้าง หรือ ประกาศบริษัท"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รายละเอียดเพิ่มเติม / คำอธิบายวัตถุประสงค์
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับเอกสารนี้..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: PDF File Upload Area */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex justify-between items-center">
              <span>2. แนบไฟล์ PDF (File Attachment)</span>
              <span className="text-[11px] text-slate-400 font-normal">รองรับไฟล์ .PDF ขนาดสูงสุด 20MB</span>
            </h4>

            {!uploadedFile ? (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-white hover:bg-slate-50/50 transition-colors">
                <UploadCloud className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์ PDF หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {initialData?.versions?.[0]?.file_data ? "มีไฟล์เดิมอยู่ในระบบ สามารถเลือกไฟล์ใหม่เพื่อเปลี่ยนได้" : "เฉพาะไฟล์นามสกุล .pdf เท่านั้น"}
                </p>
                <input
                  type="file"
                  id="file-upload-only"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="file-upload-only"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  เลือกไฟล์ PDF
                </label>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-md">{uploadedFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • พร้อมสำหรับสร้างเอกสาร
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInlinePreview(!showInlinePreview)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      {showInlinePreview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่างไฟล์"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); setShowInlinePreview(false); }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="ลบไฟล์"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showInlinePreview && filePreviewUrl && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-3 h-[85vh] min-h-[850px]">
                    <iframe src={`${filePreviewUrl}#view=FitH`} className="w-full h-full border-none" title="PDF Inline Preview" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                บันทึกแบบร่าง (Draft)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form && !form.checkValidity()) {
                    form.reportValidity();
                  } else {
                    onNext();
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                ถัดไป (กำหนดการมองเห็น)
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <Step2Visibility value={visibility} onChange={setVisibility} />
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <button type="button" onClick={onBack} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer">ย้อนกลับ</button>
            <button type="button" onClick={(e) => {
                const form = e.currentTarget.closest('form');
                if (form && !form.checkValidity()) {
                  form.reportValidity();
                } else {
                  onNext();
                }
              }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer">ถัดไป (กำหนดสายอนุมัติ)</button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <ApprovalWorkflowSection steps={workflowSteps} onChange={setWorkflowSteps} />
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <button type="button" onClick={onBack} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer">ย้อนกลับ</button>
            <button type="button" onClick={(e) => {
                const form = e.currentTarget.closest('form');
                if (form && !form.checkValidity()) {
                  form.reportValidity();
                } else {
                  onNext();
                }
              }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer">ถัดไป (ตรวจสอบพรีวิว)</button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <DocumentPreview 
              doc={{
                type: "DOC",
                status: "Draft",
                submittedDate: new Date().toISOString().split("T")[0],
                department: user?.department || "",
                sender: defaultRequester,
                title: title,
                purpose: description,
                fileUrl: filePreviewUrl || initialData?.versions?.[0]?.file_path,
                workflow: { steps: workflowSteps.map(s => ({ role_name: s.roleName, approver_name: s.approverName, step_order: s.stepOrder, status: "Pending" })) }
              }} 
              tempSignature={true}
            />
          </div>
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <button type="button" onClick={onBack} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer">ย้อนกลับ</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleSubmit(true)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"><Save className="w-3.5 h-3.5" /> บันทึกแบบร่าง (Draft)</button>
              <button type="button" onClick={() => handleSubmit(false)} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"><Send className="w-3.5 h-3.5" /> ส่งขออนุมัติเอกสาร</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
