"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Send, UploadCloud } from "lucide-react";
import { api } from "@/lib";
import { useAuth } from '@views/components/providers/AuthProvider';
import { formatThaiDate } from "@/lib/format-date";
import Step2Visibility, { VisibilityData } from "./Step2Visibility";
import ApprovalWorkflowSection, {
  WorkflowStepInput,
} from "./ApprovalWorkflowSection";

export interface PRItemInput {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  remark: string;
}

export interface PRSubmitData {
  title: string;
  sender: string;
  department: string;
  requestedDate: string;
  requiredDate: string;
  purpose: string;
  remark: string;
  amount: string;
  items: PRItemInput[];
  attachmentFileName?: string;
  workflowSteps: WorkflowStepInput[];
  isDraft: boolean;
}

interface PRFormProps {
  onSubmit: (data: PRSubmitData) => void;
  onCancel: () => void;
  runningNumberPreview: string;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  initialData?: any;
}

const DEPARTMENTS = [
  "แผนกจัดซื้อ",
  "แผนกบัญชีและการเงิน",
  "แผนกคลังสินค้าและจัดส่ง",
  "แผนกเทคโนโลยีสารสนเทศ",
  "แผนกทรัพยากรบุคคล",
  "แผนกผลิต",
];

const UNITS = ["ชิ้น", "เครื่อง", "ชุด", "กล่อง", "แพ็ค", "งวด", "งาน"];

export default function PRForm({
  onSubmit,
  onCancel,
  runningNumberPreview,
  currentStep,
  onNext,
  onBack,
  initialData,
}: PRFormProps) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";
  const defaultDept = user?.department || DEPARTMENTS[0];

  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [companySettings, setCompanySettings] = useState({
    companyName: "บริษัท นิสซุย (ประเทศไทย) จำกัด",
    companyAddress: "เลขที่ 123 อาคารนิสซุย ถนนสุขุมวิท"
  });

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(defaultDept);
  const [requestedDate, setRequestedDate] = useState(todayStr);
  const [requiredDate, setRequiredDate] = useState(nextWeekStr);
  const [purpose, setPurpose] = useState("");
  const [remark, setRemark] = useState("เอกสารใบขอซื้อฉบับนี้ใช้สำหรับขออนุมัติภายในก่อนดำเนินการจัดซื้อ");

  const [items, setItems] = useState<PRItemInput[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unit: "ชิ้น",
      unitPrice: 0,
      remark: "",
    },
  ]);

  const [visibility, setVisibility] = useState<VisibilityData>({ type: "CompanyWide", departments: [], users: [] });
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([]);

  useEffect(() => {
    api.get<any>("/api/admin/settings")
      .then(res => { if (res.data?.companyName) setCompanySettings(res.data); })
      .catch((err) => { console.error('Failed to fetch settings:', err); });
  }, []);

  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.pr_form?.purpose) setPurpose(initialData.pr_form.purpose);
      if (initialData.pr_form?.remark) setRemark(initialData.pr_form.remark);
      if (initialData.department?.name) setDepartment(initialData.department.name);
      if (initialData.pr_form?.items && Array.isArray(initialData.pr_form.items) && initialData.pr_form.items.length > 0) {
        setItems(initialData.pr_form.items.map((item: any, idx: number) => ({
          id: String(idx + 1),
          description: item.item_name || item.description || '',
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'ชิ้น',
          unitPrice: Number(item.unit_price) || 0,
          remark: item.remark || '',
        })));
      }
    }
  }, [initialData]);

  useEffect(() => {
    async function loadWorkflow() {
      try {
        const { adminService } = await import("@/controllers/services/admin.service");
        const workflows = (await adminService.getApprovalWorkflowsList()) as any[];
        const prFlow = Array.isArray(workflows) ? workflows.find((w: any) => w.prefix === "PR") : null;
        if (prFlow && prFlow.steps && prFlow.steps.length > 0) {
          setWorkflowSteps(
            prFlow.steps.map((role: string, idx: number) => ({
              id: String(idx + 1),
              stepOrder: idx + 1,
              roleName: role,
              approverName: "",
            }))
          );
        } else {
          setWorkflowSteps([
            { id: "1", stepOrder: 1, roleName: "หัวหน้าฝ่ายจัดซื้อ (Purchasing Manager)", approverName: "" },
            { id: "2", stepOrder: 2, roleName: "ผู้อนุมัติ / ผู้บริหาร (Executive/Director)", approverName: "" },
          ]);
        }
      } catch (err) {
        setWorkflowSteps([
          { id: "1", stepOrder: 1, roleName: "หัวหน้าฝ่ายจัดซื้อ (Purchasing Manager)", approverName: "" },
          { id: "2", stepOrder: 2, roleName: "ผู้อนุมัติ / ผู้บริหาร (Executive/Director)", approverName: "" },
        ]);
      }
    }
    loadWorkflow();
  }, []);

  const handleAddItem = () => {
    const newId = String(items.length + 1);
    setItems([
      ...items,
      {
        id: newId,
        description: "",
        quantity: 1,
        unit: "ชิ้น",
        unitPrice: 0,
        remark: "",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof PRItemInput, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      })
    );
  };

  const subTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vat = subTotal * 0.07;
  const grandTotal = subTotal + vat;

  const handleSubmit = (isDraft: boolean) => {
    onSubmit({
      title,
      sender: defaultRequester,
      department,
      requestedDate,
      requiredDate,
      purpose,
      remark,
      amount: grandTotal.toFixed(2),
      items,
      workflowSteps,
      isDraft,
    });
  };

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {(currentStep === 1 || currentStep === 4) && (
        <>
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-sm">
              <span className="font-bold text-slate-500 mr-2">Preview ID:</span> 
              <span className="font-mono text-blue-600">{runningNumberPreview}</span>
            </div>
            <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              คลิกที่ข้อความที่มีเส้นประเพื่อพิมพ์ข้อมูลแบบออนไลน์
            </div>
          </div>

          {/* A4 WYSIWYG Editor Container */}
          <div className="bg-slate-200/50 py-10 flex justify-center overflow-auto rounded-xl border border-slate-200 shadow-inner">
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl flex flex-col p-[12mm] text-[12px] text-slate-800 leading-snug font-sans relative origin-top">
              
              {/* Header Block (Industrial Blue Style) */}
              <div className="flex justify-between items-start border-b-2 border-blue-800 pb-4 mb-4">
                <div className="flex items-start gap-4">
                  <div>
                    <h1 className="font-bold text-lg text-blue-900">{companySettings.companyName}</h1>
                    <p className="text-slate-700 mt-1 max-w-[200px] leading-tight whitespace-pre-wrap">{companySettings.companyAddress}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="border-2 border-blue-800 px-4 py-2 mb-2 text-center w-64 bg-blue-100 text-blue-900">
                     <h2 className="text-xl font-black">ใบขออนุมัติจัดซื้อ/จัดจ้าง</h2>
                     <p className="text-xs font-bold uppercase">PURCHASE REQUEST</p>
                  </div>
                  
                  <table className="border-collapse border border-slate-800 text-left text-[11px] w-64">
                    <tbody>
                      <tr>
                        <th className="border border-slate-800 px-2 py-1 bg-blue-50 font-bold w-1/3">เลขที่ / No.</th>
                        <td className="border border-slate-800 px-2 py-1 font-bold text-slate-400 text-center">{runningNumberPreview}</td>
                      </tr>
                      <tr>
                        <th className="border border-slate-800 px-2 py-1 bg-blue-50 font-bold">วันที่ / Date</th>
                        <td className="border border-slate-800 px-2 py-1 text-center font-bold text-slate-900">
                          {formatThaiDate(new Date())}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Requester & Purpose Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                 {/* Requester Info */}
                 <div className="border border-slate-800 p-2">
                    <p className="font-bold border-b border-slate-800 pb-1 mb-2 text-blue-900">ผู้เสนอขอจัดซื้อ / Requester</p>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-[11px]">
                      <span className="text-slate-600 font-bold">ชื่อ / Name:</span>
                      <span className="font-bold text-slate-900">{defaultRequester}</span>

                      <span className="text-slate-600 font-bold mt-1">แผนก / Dept:</span>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="border-b border-dotted border-blue-400 pb-1 focus:outline-none focus:border-blue-600 font-bold text-slate-900 bg-transparent cursor-pointer"
                      >
                        {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                      </select>

                      <span className="text-slate-600 font-bold mt-1">เรื่อง / โครงการ:</span>
                      <textarea
                        rows={1}
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                        }}
                        placeholder="ระบุชื่อเรื่องที่ขอซื้อ..."
                        className="border-b border-dotted border-blue-400 pb-1 focus:outline-none focus:border-blue-600 font-bold text-slate-900 bg-blue-50/30 px-1 w-full resize-none overflow-hidden block"
                      />
                    </div>
                 </div>

                 {/* Purpose Info */}
                 <div className="border border-slate-800 p-2">
                    <p className="font-bold border-b border-slate-800 pb-1 mb-2 text-blue-900">วัตถุประสงค์ / Purpose</p>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-[11px]">
                      <span className="text-slate-600 font-bold mt-1">วัตถุประสงค์:</span>
                      <textarea
                        rows={2}
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                        }}
                        placeholder="ระบุวัตถุประสงค์/ความจำเป็น..."
                        className="border-b border-dotted border-blue-400 pb-1 focus:outline-none focus:border-blue-600 font-bold text-slate-900 bg-blue-50/30 px-1 w-full resize-none overflow-hidden block"
                      />

                      <span className="text-slate-600 font-bold mt-1">วันที่ต้องการ:</span>
                      <input 
                        type="date"
                        value={requiredDate}
                        onChange={(e) => setRequiredDate(e.target.value)}
                        className="border-b border-dotted border-blue-400 pb-1 focus:outline-none focus:border-blue-600 font-bold text-slate-900 bg-transparent w-full"
                      />
                    </div>
                 </div>
              </div>

              {/* Items Table */}
              <div className="flex-1">
                <div className="flex justify-end mb-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> เพิ่มรายการ
                  </button>
                </div>
                <table className="w-full border-collapse border-2 border-slate-800">
                  <thead>
                    <tr className="bg-blue-100 border-b-2 border-slate-800 text-blue-900">
                      <th className="border-r border-slate-800 py-1 px-1 text-center w-8 font-bold">No.</th>
                      <th className="border-r border-slate-800 py-1 px-1 text-center font-bold">รายการสินค้า / บริการ</th>
                      <th className="border-r border-slate-800 py-1 px-1 text-center w-14 font-bold">จำนวน</th>
                      <th className="border-r border-slate-800 py-1 px-1 text-center w-14 font-bold">หน่วย</th>
                      <th className="border-r border-slate-800 py-1 px-1 text-center w-24 font-bold">ราคา/หน่วย</th>
                      <th className="border-r border-slate-800 py-1 px-1 text-center w-24 font-bold">จำนวนเงิน</th>
                      <th className="py-1 px-1 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const itemTotal = item.quantity * item.unitPrice;
                      
                      return (
                        <tr key={item.id} className="border-b border-slate-400 group hover:bg-slate-50">
                          <td className="border-r border-slate-800 py-1 px-1 text-center align-middle">{idx + 1}</td>
                          <td className="border-r border-slate-800 py-1 px-1 align-top">
                            <textarea
                              rows={1}
                              required
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                              }}
                              placeholder="ระบุชื่อสินค้า/บริการ..."
                              className="w-full bg-transparent border-none text-xs font-semibold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 p-1 resize-none overflow-hidden block"
                            />
                            <textarea
                              rows={1}
                              value={item.remark}
                              onChange={(e) => handleItemChange(item.id, "remark", e.target.value)}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                              }}
                              placeholder="หมายเหตุ..."
                              className="w-full bg-transparent border-none text-[10px] text-slate-500 placeholder-slate-300 focus:outline-none mt-1 px-1 resize-none overflow-hidden block"
                            />
                          </td>
                          <td className="border-r border-slate-800 py-1 px-1 align-middle text-center">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, "quantity", Math.max(1, parseFloat(e.target.value) || 0))}
                              className="w-10 text-center bg-transparent focus:outline-none focus:bg-blue-50 p-1 font-bold text-slate-900"
                            />
                          </td>
                          <td className="border-r border-slate-800 py-1 px-1 align-middle text-center">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                              className="w-14 bg-transparent focus:outline-none focus:bg-blue-50 text-[11px] p-1 cursor-pointer font-bold text-slate-900"
                            >
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="border-r border-slate-800 py-1 px-1 align-middle text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={item.unitPrice || ""}
                              onChange={(e) => handleItemChange(item.id, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                              placeholder="0"
                              className="w-20 text-right bg-transparent focus:outline-none focus:bg-blue-50 p-1 font-bold text-slate-900"
                            />
                          </td>
                          <td className="border-r border-slate-800 py-2 px-2 text-right align-middle font-bold text-slate-900">
                            {itemTotal.toLocaleString("th-TH", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="py-1 px-1 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={items.length === 1}
                              className="text-slate-300 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Totals */}
              <div className="mt-4 grid grid-cols-[1fr_auto] border-2 border-slate-800 items-stretch">
                 <div className="p-3 border-r-2 border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-slate-900">หมายเหตุ / Remarks:</span>
                        <textarea
                          rows={2}
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          onInput={(e) => {
                            e.currentTarget.style.height = 'auto';
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                          }}
                          placeholder="เพิ่มหมายเหตุ..."
                          className="w-full mt-1 bg-transparent focus:outline-none focus:bg-blue-50 p-1 text-[11px] text-slate-700 resize-none overflow-hidden"
                        />
                      </div>
                 </div>
                 <div className="w-[200px] flex flex-col">
                    <div className="grid grid-cols-[100px_1fr] px-2 py-1 border-b border-slate-800 text-[11px]">
                      <span>ยอดรวม<br/><span className="text-[9px]">Sub Total</span></span>
                      <span className="text-right flex items-center justify-end font-bold">{subTotal.toLocaleString("th-TH", {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] px-2 py-1 border-b border-slate-800 text-[11px]">
                      <span>ภาษีมูลค่าเพิ่ม 7%<br/><span className="text-[9px]">VAT 7%</span></span>
                      <span className="text-right flex items-center justify-end font-bold">{vat.toLocaleString("th-TH", {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] p-2 bg-blue-800 text-white font-bold flex-1 items-center">
                      <span>ยอดสุทธิ<br/><span className="text-[9px] font-normal">Grand Total</span></span>
                      <span className="text-right text-lg">฿{grandTotal.toLocaleString("th-TH", {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>
              </div>

              {/* Signatures Placeholder */}
              <div className={`mt-6 grid grid-cols-${Math.max(2, Math.min(workflowSteps.length + 1, 4))} gap-4 text-center`}>
                <div className="border border-slate-800 p-1 flex flex-col h-28">
                  <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400">
                    (ผู้ขอซื้อ)
                  </div>
                  <div className="w-full border-t border-slate-800 pt-1 text-center bg-white">
                    <p className="font-bold text-slate-900 text-[11px]">ผู้จัดทำ (Prepared By)</p>
                    <p className="text-[10px] text-slate-700 mt-0.5">วันที่ {formatThaiDate(new Date())}</p>
                  </div>
                </div>
                {workflowSteps.map((step, idx) => (
                  <div key={idx} className="border border-slate-800 p-1 flex flex-col h-28">
                    <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400">
                      (รออนุมัติตามสายงาน)
                    </div>
                    <div className="w-full border-t border-slate-800 pt-1 text-center bg-white">
                      <p className="font-bold text-slate-900 text-[11px] truncate px-1" title={step.roleName}>{step.roleName}</p>
                      {currentStep === 4 && step.approverName && (
                        <p className="text-[10px] text-blue-600 font-bold leading-tight">{step.approverName}</p>
                      )}
                      <p className="text-[10px] text-slate-700 mt-0.5">วันที่ ____/____/____</p>
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
                  onClick={() => handleSubmit(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer border border-slate-200"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft (บันทึกร่าง)
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  Submit PR Document (ส่งขออนุมัติ)
                </button>
              </div>
            </div>
          )}
        </>
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


    </form>
  );
}
