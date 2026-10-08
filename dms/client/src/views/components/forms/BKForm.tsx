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
  initialData?: any;
  onSubmit: (data: BKSubmitData) => void;
  onCancel: () => void;
  runningNumberPreview: string;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  isViewer?: boolean;
  tempSignature?: boolean;
  onSignClick?: () => void;
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
  currentStep, onNext, onBack, initialData, isViewer, tempSignature, onSignClick }: any) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";
  const defaultDept = user?.department || DEPARTMENTS[0];

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(defaultDept);

  React.useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.bk_form?.detail) setDetail(initialData.bk_form.detail);
      if (initialData.department?.name) setDepartment(initialData.department.name);
    }
  }, [initialData]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [detail, setDetail] = useState("");

  const [visibility, setVisibility] = useState<VisibilityData>({ type: "CompanyWide", departments: [], users: [] });
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([]);

  React.useEffect(() => {
    async function loadWorkflow() {
        if (isViewer && initialData?.workflow?.steps) {
          setWorkflowSteps(initialData.workflow.steps.map((s: any) => ({
            id: String(s.step_order),
            stepOrder: s.step_order,
            roleName: s.approver?.role?.name || s.role_name || s.role || "",
            approverName: s.approver ? `${s.approver.first_name} ${s.approver.last_name}` : "",
            status: s.status,
            signature_url: s.signature_url || s.approver?.signature_url || (s.approver?.id ? `/api/users/${s.approver.id}/signature` : (s.approver_id ? `/api/users/${s.approver_id}/signature` : null)), approver_id: s.approver_id || s.approver?.id,
            isCurrentStep: s.step_order === initialData.workflow.current_step,
            date: s.approved_at || null,
          })));
          return;
        }
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
          {!isViewer && (
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <div className="text-sm">
                <span className="font-bold text-slate-500 mr-2">Preview ID:</span> 
                <span className="font-mono text-blue-600">{runningNumberPreview}</span>
              </div>
              <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                <FileCode2 className="w-4 h-4" />
          คลิกที่ข้อความที่มีเส้นประเพื่อพิมพ์ข้อมูลแบบออนไลน์
              </div>
            </div>
          )}

      {/* A4 WYSIWYG Editor Container */}
      <div className={`bg-slate-200/50 py-10 flex justify-center overflow-auto rounded-xl border border-slate-200 shadow-inner ${isViewer ? 'a4-viewer pointer-events-none' : ''}`}>
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl flex flex-col p-[20mm] text-[14px] text-slate-900 leading-relaxed font-sans relative origin-top mx-auto">
          
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
            {workflowSteps.map((step: any, idx: number) => {
                  const isApproved = step.status === 'Approved';
                  const isCurrentStep = step.isCurrentStep;
                  const approverId = step.approver_id || step.approver?.id;
                  const sigSrc = step.signature_url || step.approver?.signature_url || (approverId ? `/api/users/${approverId}/signature` : (isCurrentStep && user?.id ? `/api/users/${user.id}/signature` : null));

                  return (
                  <div key={idx} className="border border-slate-800 p-1 flex flex-col h-28 relative group pointer-events-auto">
                    {isApproved || (isCurrentStep && tempSignature) ? (
                      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden w-full bg-white/50">
                        <span className="absolute top-1 left-1.5 text-[7px] font-extrabold text-emerald-600 uppercase tracking-tighter z-10 bg-emerald-50/90 px-1 rounded border border-emerald-200/60 shadow-2xs">Signed & Approved</span>
                        {sigSrc ? (
                          <img src={sigSrc} className="absolute inset-0 w-full h-full object-contain opacity-95 scale-115 p-1" alt="Signature" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
                        ) : (
                          <span className="font-['Brush_Script_MT',cursive,italic] text-base leading-tight text-center px-1 truncate max-w-[90%] text-blue-900">{step.approverName || user?.full_name || "Approver"}</span>
                        )}
                      </div>
                    ) : isCurrentStep && onSignClick ? (
                      <div 
                        className="flex-1 flex flex-col items-center justify-center w-full cursor-pointer hover:bg-blue-50/50 transition-colors"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSignClick(); }}
                      >
                        <p className="text-[10px] text-blue-500 font-bold group-hover:underline text-center px-2">คลิกเพื่อวางลายเซ็น<br/><span className="text-[8px] font-normal text-slate-400">(Click to Sign)</span></p>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400">
                        (รออนุมัติตามสายงาน)
                      </div>
                    )}

                    <div className="w-full border-t border-slate-800 pt-1 text-center bg-white z-10 shrink-0">
                      <p className="font-bold text-slate-900 text-[11px] truncate px-1" title={step.roleName || `ผู้อนุมัติลำดับที่ ${idx + 1}`}>{step.roleName || `ผู้อนุมัติลำดับที่ ${idx + 1}`}</p>
                      {(step.approverName) && (
                        <p className="text-[10px] text-blue-600 font-bold leading-tight">{step.approverName}</p>
                      )}
                      <p className="text-[10px] text-slate-700 mt-0.5">
                        วันที่ {isApproved && step.date ? new Date(step.date).toLocaleDateString('th-TH') : (isCurrentStep && tempSignature ? new Date().toLocaleDateString('th-TH') : "____/____/____")}
                      </p>
                    </div>
                  </div>
                )})}
          </div>

        </div>
      </div>

          {currentStep === 1 && !isViewer && (
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
          {currentStep === 4 && !isViewer && (
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
                  type="button"
                  onClick={() => triggerSubmit(false)}
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

