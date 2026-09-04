"use client";

import React, { useState } from "react";
import { Save, Send, FileCode2, UploadCloud } from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';
import { formatThaiDate } from "@/lib/format-date";
import Step2Visibility, { VisibilityData } from "./Step2Visibility";
import ApprovalWorkflowSection, {
  WorkflowStepInput,
} from "./ApprovalWorkflowSection";


export interface BKSubmitData {
  title: string;
  sender: string;
  department: string;
  category: string;
  detail: string;
  attachmentFileName?: string;
  workflowSteps: WorkflowStepInput[];
  isDraft: boolean;
}

interface BKFormProps {
  onSubmit: (data: BKSubmitData) => void;
  onCancel: () => void;
  runningNumberPreview: string;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
}

const DEPARTMENTS = [
  "แผนกจัดซื้อ",
  "แผนกบัญชีและการเงิน",
  "แผนกคลังสินค้าและจัดส่ง",
  "แผนกเทคโนโลยีสารสนเทศ",
  "แผนกทรัพยากรบุคคล",
  "แผนกผลิต",
];

const CATEGORIES = [
  "บันทึกข้อความภายใน (Internal Memo)",
  "ข้อเสนอโครงการ (Project Proposal)",
  "หนังสือเสนออนุมัติทั่วไป (General Request)",
  "รายงานผลการดำเนินงาน (Operation Report)",
];

export default function BKForm({
  onSubmit,
  onCancel,
  runningNumberPreview,
  currentStep, onNext, onBack
}: BKFormProps) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";
  const defaultDept = user?.department || DEPARTMENTS[0];

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(defaultDept);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [detail, setDetail] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [visibility, setVisibility] = useState<VisibilityData>({ type: "CompanyWide", departments: [], users: [] });
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([]);

  React.useEffect(() => {
    async function loadWorkflow() {
      try {
        const { adminService } = await import("@/controllers/services/admin.service");
        const workflows = (await adminService.getApprovalWorkflowsList()) as any[];
        const bkFlow = Array.isArray(workflows) ? workflows.find((w: any) => w.prefix === "BK") : null;
        if (bkFlow && bkFlow.steps && bkFlow.steps.length > 0) {
          setWorkflowSteps(
            bkFlow.steps.map((role: string, idx: number) => ({
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const todayStr = formatThaiDate(new Date());

  const triggerSubmit = (isDraft: boolean) => {
    if (!title.trim()) {
      alert("กรุณากรอกหัวข้อเรื่องเอกสาร (Title)");
      return;
    }
    onSubmit({
      title,
      sender: defaultRequester,
      department,
      category,
      detail,
      attachmentFileName: uploadedFile ? uploadedFile.name : undefined,
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
      {(currentStep === 1 || currentStep === 4) && (
        <>
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="text-sm">
          <span className="font-bold text-slate-500 mr-2">Preview ID:</span> 
          <span className="font-mono text-blue-600">{runningNumberPreview}</span>
        </div>
        <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
          <FileCode2 className="w-4 h-4" />
          คลิกที่ข้อความที่มีเส้นประเพื่อพิมพ์ข้อมูลแบบออนไลน์
        </div>
      </div>

      {/* A4 WYSIWYG Editor Container */}
      <div className="bg-slate-200/50 py-10 flex justify-center overflow-auto rounded-xl border border-slate-200 shadow-inner">
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl flex flex-col p-[20mm] text-[14px] text-slate-900 leading-relaxed font-sans relative origin-top">
          
          <div className="flex items-center gap-4 mb-8">
            
            <h1 className="text-3xl font-bold text-center flex-1 mr-16">บันทึกข้อความ</h1>
          </div>

          <div className="grid grid-cols-[100px_1fr_60px_1fr] gap-x-2 mb-4 items-end">
            <span className="font-bold text-lg">ส่วนราชการ</span>
            <input 
              type="text" 
              placeholder="กรอกชื่อส่วนราชการ/แผนก..."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border-b border-dotted border-blue-400 pb-1 focus:outline-none focus:border-blue-600 focus:border-b-2 bg-blue-50/30 px-1 transition-all" 
            />
            <span className="font-bold text-lg ml-4">วันที่</span>
            <span className="border-b border-dotted border-slate-400 pb-1">{todayStr}</span>
          </div>

          <div className="grid grid-cols-[60px_1fr] gap-x-2 mb-4 items-end">
            <span className="font-bold text-lg">เรื่อง</span>
            <textarea
              rows={1}
              required
              placeholder="กรอกชื่อเรื่อง..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              className="border-b border-dotted border-blue-400 pb-1 focus:outline-none focus:border-blue-600 focus:border-b-2 bg-blue-50/30 px-1 transition-all resize-none overflow-hidden block w-full"
            />
          </div>

          <div className="grid grid-cols-[60px_1fr] gap-x-2 mb-8 items-end">
            <span className="font-bold text-lg">เรียน</span>
            <input 
              type="text" 
              defaultValue="ผู้บริหาร / ผู้เกี่ยวข้อง"
              className="border-b border-dotted border-slate-400 pb-1 focus:outline-none focus:border-slate-600 focus:border-b-2 bg-transparent px-1" 
            />
          </div>

          <div className="flex-1 mt-4">
            <textarea 
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="พิมพ์รายละเอียดบันทึกข้อความที่นี่..."
              className="w-full h-full min-h-[400px] border border-transparent hover:border-blue-200 focus:border-blue-400 rounded-lg p-2 resize-none focus:outline-none bg-blue-50/10 transition-colors indent-10 leading-loose whitespace-pre-wrap"
            />
          </div>

          {/* Signatures placeholder */}
          <div className="mt-12 flex justify-end gap-16 flex-wrap">
            <div className="flex flex-col items-center w-48">
              <div className="h-20 w-full flex items-center justify-center border-b border-dotted border-slate-400 mb-2 relative">
                <span className="text-slate-300 text-[10px] text-center">(ระบบจะดึงลายเซ็นต์อัตโนมัติ)</span>
              </div>
              <div className="text-center w-full">
                <p className="font-bold text-sm">( {defaultRequester} )</p>
                <p className="text-xs mt-1">{department || "ผู้จัดทำ"}</p>
              </div>
            </div>
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center w-48">
                <div className="h-20 w-full flex items-center justify-center border-b border-dotted border-slate-400 mb-2 relative">
                  <span className="text-slate-300 text-[10px] text-center">(รออนุมัติตามสายงาน)</span>
                </div>
                <div className="text-center w-full">
                  <p className="font-bold text-sm">( _________________ )</p>
                  <p className="text-xs mt-1 truncate" title={step.roleName}>{step.roleName}</p>
                  {currentStep === 4 && step.approverName && (
                    <p className="text-[10px] text-blue-600 font-bold mt-1 leading-tight">{step.approverName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

          {currentStep === 1 && (
            <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
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
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
              >
                Next Step (ถัดไป)
              </button>
            </div>
          )}
          {currentStep === 4 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Back (ย้อนกลับ)
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
          )}
          </>
      )}

      {currentStep === 2 && (
        <>
          <Step2Visibility
            uploadedFile={uploadedFile}
            onFileChange={handleFileChange}
            visibility={visibility}
            onVisibilityChange={setVisibility}
          />
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Back (ย้อนกลับ)
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
            >
              Next Step (ถัดไป)
            </button>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <ApprovalWorkflowSection
              steps={workflowSteps}
              onChange={setWorkflowSteps}
            />
          </div>

          {/* ACTION BUTTONS (Draft & Submit) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Back (ย้อนกลับ)
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
            >
              Next Step (Preview)
            </button>
          </div>
          </>
      )}
    </form>
  );
}
