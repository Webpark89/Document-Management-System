"use client";

import React, { useState } from "react";
import { Plus, Trash2, Save, Send, UploadCloud, Briefcase, FileSignature, HelpCircle } from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';
import ApprovalWorkflowSection, {
  WorkflowStepInput,
} from "./ApprovalWorkflowSection";


export interface POItemInput {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatPercent: number;
  remark: string;
}

export interface POSubmitData {
  title: string;
  sender: string;
  department: string;
  vendorName: string;
  vendorContact: string;
  deliveryDate: string;
  paymentTerms: string;
  amount: string;
  items: POItemInput[];
  attachmentFileName?: string;
  workflowSteps: WorkflowStepInput[];
  isDraft: boolean;
}

interface POFormProps {
  onSubmit: (data: POSubmitData) => void;
  onCancel: () => void;
  runningNumberPreview: string;
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

const PAYMENT_TERMS_OPTIONS = [
  "เครดิต 30 วัน",
  "เครดิต 45 วัน",
  "เครดิต 60 วัน",
  "ชำระเงินสดทันที",
  "มัดจำ 30% ชำระส่วนที่เหลือวันส่งมอบ",
];

export default function POForm({ onSubmit, onCancel, runningNumberPreview }: POFormProps) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";
  const defaultDept = user?.department || DEPARTMENTS[0];

  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(defaultDept);
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(nextMonthStr);
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS_OPTIONS[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [items, setItems] = useState<POItemInput[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unit: "เครื่อง",
      unitPrice: 0,
      vatPercent: 7,
      remark: "",
    },
  ]);

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([]);

  React.useEffect(() => {
    async function loadWorkflow() {
      try {
        const { adminService } = await import("@/controllers/services/admin.service");
        const workflows = (await adminService.getApprovalWorkflowsList()) as any[];
        const poFlow = Array.isArray(workflows) ? workflows.find((w: any) => w.prefix === "PO") : null;
        if (poFlow && poFlow.steps && poFlow.steps.length > 0) {
          setWorkflowSteps(
            poFlow.steps.map((role: string, idx: number) => ({
              id: String(idx + 1),
              stepOrder: idx + 1,
              roleName: role,
              approverName: "",
            }))
          );
        } else {
          setWorkflowSteps([
            { id: "1", stepOrder: 1, roleName: "ผู้จัดการฝ่ายบัญชี/การเงิน (Finance Manager)", approverName: "" },
            { id: "2", stepOrder: 2, roleName: "กรรมการผู้จัดการ (Managing Director)", approverName: "" },
          ]);
        }
      } catch (err) {
        setWorkflowSteps([
          { id: "1", stepOrder: 1, roleName: "ผู้จัดการฝ่ายบัญชี/การเงิน (Finance Manager)", approverName: "" },
          { id: "2", stepOrder: 2, roleName: "กรรมการผู้จัดการ (Managing Director)", approverName: "" },
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
        unit: "เครื่อง",
        unitPrice: 0,
        vatPercent: 7,
        remark: "",
      },
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof POItemInput,
    value: string | number
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const subTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const totalVat = items.reduce(
    (sum, item) =>
      sum + item.quantity * item.unitPrice * (item.vatPercent / 100),
    0
  );
  const netTotal = subTotal + totalVat;

  const triggerSubmit = (isDraft: boolean) => {
    if (!title.trim() || !vendorName.trim()) {
      alert("กรุณากรอกหัวข้อเอกสารและชื่อผู้ขาย (Vendor Name)");
      return;
    }
    onSubmit({
      title,
      sender: defaultRequester,
      department,
      vendorName,
      vendorContact,
      deliveryDate,
      paymentTerms,
      amount: `฿${netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      items,
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
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="text-sm">
          <span className="font-bold text-slate-500 mr-2">Preview ID:</span> 
          <span className="font-mono text-purple-600">{runningNumberPreview}</span>
        </div>
        <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          คลิกที่ข้อความที่มีเส้นประเพื่อพิมพ์ข้อมูลแบบออนไลน์
        </div>
      </div>

      {/* A4 WYSIWYG Editor Container */}
      <div className="bg-slate-200/50 py-10 flex justify-center overflow-auto rounded-xl border border-slate-200 shadow-inner">
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl flex flex-col p-[12mm] text-[12px] text-slate-800 leading-snug font-sans relative origin-top">
          
          {/* Header Block (Industrial Style) */}
          <div className="flex justify-between items-start border-b-2 border-purple-800 pb-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 border-2 border-purple-800 flex items-center justify-center font-black text-xl text-purple-900">
                LOGO
              </div>
              <div>
                <h1 className="font-bold text-lg text-purple-900">บริษัท นิสซุย (ประเทศไทย) จำกัด</h1>
                <p className="text-slate-700 mt-1 max-w-[200px] leading-tight">เลขที่ 123 อาคารนิสซุย ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110</p>
                <p className="text-slate-700 mt-1 font-semibold">เลขประจำตัวผู้เสียภาษี: 0105559000123</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="border-2 border-purple-800 px-4 py-2 mb-2 text-center w-64 bg-purple-100 text-purple-900">
                 <h2 className="text-xl font-black">ใบสั่งซื้อ/สั่งจ้าง</h2>
                 <p className="text-xs font-bold uppercase">PURCHASE ORDER</p>
              </div>
              
              <table className="border-collapse border border-slate-800 text-left text-[11px] w-64">
                <tbody>
                  <tr>
                    <th className="border border-slate-800 px-2 py-1 bg-purple-50 font-bold w-1/3">เลขที่ / No.</th>
                    <td className="border border-slate-800 px-2 py-1 font-bold text-slate-400 text-center">{runningNumberPreview}</td>
                  </tr>
                  <tr>
                    <th className="border border-slate-800 px-2 py-1 bg-purple-50 font-bold">วันที่ / Date</th>
                    <td className="border border-slate-800 px-2 py-1 text-center font-bold text-slate-900">
                      {new Date().toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
             {/* Vendor Info */}
             <div className="border border-slate-800 p-2 relative group">
                <p className="font-bold border-b border-slate-800 pb-1 mb-2 text-purple-900">ผู้ขาย / Vendor</p>
                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-[11px]">
                  <span className="text-slate-600 font-bold mt-1">ชื่อร้าน/บริษัท:</span>
                  <textarea
                    rows={1}
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                    }}
                    placeholder="ระบุชื่อผู้ขาย..."
                    className="border-b border-dotted border-purple-400 pb-1 focus:outline-none focus:border-purple-600 font-bold text-slate-900 bg-purple-50/30 px-1 w-full resize-none overflow-hidden block"
                  />
                  
                  <span className="text-slate-600 font-bold mt-1">ข้อมูลติดต่อ:</span>
                  <textarea
                    rows={1}
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                    }}
                    placeholder="ระบุเบอร์โทร/อีเมล..."
                    className="border-b border-dotted border-purple-400 pb-1 focus:outline-none focus:border-purple-600 font-bold text-slate-900 bg-purple-50/30 px-1 w-full resize-none overflow-hidden block"
                  />

                  <span className="text-slate-600 font-bold mt-1">วันที่ส่งมอบ:</span>
                  <input 
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="border-b border-dotted border-purple-400 pb-1 focus:outline-none focus:border-purple-600 font-bold text-slate-900 bg-transparent w-full"
                  />
                  
                  <span className="text-slate-600 font-bold mt-1">เงื่อนไขชำระเงิน:</span>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="border-b border-dotted border-purple-400 pb-1 focus:outline-none focus:border-purple-600 font-bold text-slate-900 bg-transparent cursor-pointer w-full"
                  >
                    {PAYMENT_TERMS_OPTIONS.map(term => <option key={term} value={term}>{term}</option>)}
                  </select>
                </div>
             </div>
             
             {/* Buyer Info */}
             <div className="border border-slate-800 p-2">
                <p className="font-bold border-b border-slate-800 pb-1 mb-2 text-purple-900">ผู้ซื้อ / Buyer</p>
                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-[11px]">
                  <span className="text-slate-600 font-bold">ชื่อ / Name:</span>
                  <span className="font-bold text-slate-900">{defaultRequester}</span>
                  <span className="text-slate-600 font-bold mt-1">แผนก / Dept:</span>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="border-b border-dotted border-purple-400 pb-1 focus:outline-none focus:border-purple-600 font-bold text-slate-900 bg-transparent cursor-pointer"
                  >
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>

                  <span className="text-slate-600 font-bold mt-1">เรื่อง:</span>
                  <textarea
                    rows={1}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                    }}
                    placeholder="ระบุเรื่อง..."
                    className="border-b border-dotted border-purple-400 pb-1 focus:outline-none focus:border-purple-600 font-bold text-slate-900 bg-purple-50/30 px-1 w-full resize-none overflow-hidden block"
                  />
                </div>
             </div>
          </div>

          {/* Items Table - Strict Borders */}
          <div className="flex-1">
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> เพิ่มรายการ
              </button>
            </div>
            <table className="w-full border-collapse border-2 border-slate-800">
              <thead>
                <tr className="bg-purple-100 border-b-2 border-slate-800 text-purple-900">
                  <th className="border-r border-slate-800 py-1 px-1 text-center w-8 font-bold">No.</th>
                  <th className="border-r border-slate-800 py-1 px-1 text-center font-bold">รายการ (Description)</th>
                  <th className="border-r border-slate-800 py-1 px-1 text-center w-14 font-bold">จำนวน</th>
                  <th className="border-r border-slate-800 py-1 px-1 text-center w-14 font-bold">หน่วย</th>
                  <th className="border-r border-slate-800 py-1 px-1 text-center w-20 font-bold">ราคา/หน่วย</th>
                  <th className="border-r border-slate-800 py-1 px-1 text-center w-12 font-bold">VAT%</th>
                  <th className="border-r border-slate-800 py-1 px-1 text-center w-24 font-bold">จำนวนเงิน</th>
                  <th className="py-1 px-1 text-center w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const itemSubtotal = item.quantity * item.unitPrice;
                  const itemTotal = itemSubtotal * (1 + item.vatPercent / 100);
                  
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
                          placeholder="ชื่อรายการ..."
                          className="w-full bg-transparent border-none text-xs font-semibold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400 p-1 resize-none overflow-hidden block"
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
                          onChange={(e) => handleItemChange(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-10 text-center bg-transparent focus:outline-none focus:bg-purple-50 p-1 font-bold text-slate-900"
                        />
                      </td>
                      <td className="border-r border-slate-800 py-1 px-1 align-middle text-center">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                          className="w-12 bg-transparent focus:outline-none focus:bg-purple-50 text-[11px] p-1 cursor-pointer font-bold text-slate-900"
                        >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="border-r border-slate-800 py-1 px-1 align-middle text-right">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice || ""}
                          onChange={(e) => handleItemChange(item.id, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="0"
                          className="w-16 text-right bg-transparent focus:outline-none focus:bg-purple-50 p-1 font-bold text-slate-900"
                        />
                      </td>
                      <td className="border-r border-slate-800 py-1 px-1 align-middle text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.vatPercent}
                          onChange={(e) => handleItemChange(item.id, "vatPercent", Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-10 text-center bg-transparent focus:outline-none focus:bg-purple-50 p-1 text-[11px]"
                        />
                      </td>
                      <td className="border-r border-slate-800 py-2 px-2 text-right align-middle font-bold text-slate-900">
                        {itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                  <p className="mt-1 text-slate-700 text-[11px]">เอกสารใบสั่งซื้อฉบับนี้จะสมบูรณ์เมื่อมีลายเซ็นต์ผู้อนุมัติครบถ้วน</p>
                </div>
             </div>
             <div className="w-[200px] flex flex-col">
                <div className="grid grid-cols-[100px_1fr] px-2 py-1 border-b border-slate-800 text-[11px]">
                  <span>รวมเป็นเงิน<br/><span className="text-[9px]">Sub Total</span></span>
                  <span className="text-right flex items-center justify-end font-bold">{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] px-2 py-1 border-b border-slate-800 text-[11px]">
                  <span>ภาษีมูลค่าเพิ่ม<br/><span className="text-[9px]">VAT</span></span>
                  <span className="text-right flex items-center justify-end font-bold">{totalVat.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] p-2 bg-purple-800 text-white font-bold flex-1 items-center">
                  <span>ยอดสุทธิ<br/><span className="text-[9px] font-normal">Grand Total</span></span>
                  <span className="text-right text-lg">{netTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
             </div>
          </div>

          {/* Signatures Placeholder */}
          <div className={`mt-6 grid grid-cols-${Math.max(2, Math.min(workflowSteps.length + 1, 4))} gap-4 text-center`}>
            <div className="border border-slate-800 p-1 flex flex-col h-28">
              <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400">
                (ระบบจะดึงลายเซ็นต์อัตโนมัติ)
              </div>
              <div className="w-full border-t border-slate-800 pt-1 text-center bg-white">
                <p className="font-bold text-slate-900 text-[11px]">ผู้จัดทำ (Prepared By)</p>
                <p className="text-[10px] text-slate-700 mt-0.5">วันที่ {new Date().toLocaleDateString('th-TH')}</p>
              </div>
            </div>
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="border border-slate-800 p-1 flex flex-col h-28">
                <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400">
                  (รออนุมัติตามสายงาน)
                </div>
                <div className="w-full border-t border-slate-800 pt-1 text-center bg-white">
                  <p className="font-bold text-slate-900 text-[11px] truncate px-1" title={step.roleName}>{step.roleName}</p>
                  <p className="text-[10px] text-slate-700 mt-0.5">วันที่ ____/____/____</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* FILE UPLOAD ATTACHMENT */}
      <div className="bg-linear-to-b from-slate-50/50 to-white p-6 rounded-3xl border border-slate-200 shadow-xs group transition-all hover:border-purple-300">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-purple-500" />
          Attach Reference Document (แนบไฟล์เอกสารอ้างอิง เช่น ใบเสนอราคา)
        </label>
        <div className="border-2 border-dashed border-slate-300 group-hover:border-purple-400 group-hover:bg-purple-50/30 rounded-2xl p-8 text-center transition-all cursor-pointer relative bg-white overflow-hidden">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          {uploadedFile ? (
            <div className="flex flex-col items-center gap-3 relative z-0">
              <div className="p-4 bg-purple-100 rounded-full text-purple-600 shadow-sm ring-4 ring-purple-50">
                <FileSignature className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">{uploadedFile.name}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 relative z-0">
              <div className="p-4 bg-slate-100 rounded-full text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600 group-hover:scale-110 transition-all duration-300">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">
                  คลิก หรือ ลากไฟล์เอกสารอ้างอิงมาวางที่นี่
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  รองรับไฟล์ PDF, DOC, DOCX (ขนาดสูงสุดไม่เกิน 25MB)
                </p>
              </div>
            </div>
          )}
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
          {/* Save as Draft Button */}
          <button
            type="button"
            onClick={() => triggerSubmit(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer border border-slate-200"
          >
            <Save className="w-4 h-4" />
            Save as Draft (บันทึกร่าง)
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-purple-100 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            Submit PO Document (ส่งขออนุมัติ)
          </button>
        </div>
      </div>
    </form>
  );
}
