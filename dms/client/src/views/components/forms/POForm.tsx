"use client";

import React, { useState } from "react";
import { Plus, Trash2, Save, Send, UploadCloud, Briefcase, FileSignature, HelpCircle } from "lucide-react";
import { useAuth } from '@views/components/providers/AuthProvider';
import ApprovalWorkflowSection, {
  WorkflowStepInput,
} from "./ApprovalWorkflowSection";
import { buildWorkflowStepsForMatrixKey } from '@views/features/master-data';

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
  "ฝ่ายจัดซื้อและพัสดุ",
  "ฝ่ายเทคโนโลยีสารสนเทศ (IT)",
  "ฝ่ายบัญชีและการเงิน",
  "ฝ่ายบริหารทรัพยากรบุคคล (HR)",
  "ฝ่ายบริหารทั่วไป",
  "ฝ่ายวิศวกรรมและซ่อมบำรุง",
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

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>(() =>
    buildWorkflowStepsForMatrixKey("PO")
  );

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
      {/* HEADER METADATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-linear-to-br from-purple-50 to-white p-5 rounded-3xl border border-purple-100 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div>
          <label className="block text-xs font-bold text-purple-600/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Running Number (Preview)
          </label>
          <div className="bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-purple-700 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            {runningNumberPreview}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Requester Name (ผู้สั่งซื้อ/จัดทำ)
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
            Department (แผนกที่สั่งซื้อ)
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all cursor-pointer"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent my-6"></div>

      {/* FORM FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Document Title / Subject (เรื่องใบสั่งซื้อ) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น สั่งซื้อเครื่องคอมพิวเตอร์และจอมอนิเตอร์สำหรับพนักงานใหม่"
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Vendor Name (ชื่อผู้ขาย/คู่ค้า) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder="เช่น บริษัท เดลล์ คอร์ปอเรชั่น (ประเทศไทย) จำกัด"
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Vendor Contact (เบอร์ติดต่อ/อีเมล)
          </label>
          <input
            type="text"
            value={vendorContact}
            onChange={(e) => setVendorContact(e.target.value)}
            placeholder="02-123-4567 / sales@dell.co.th"
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Delivery Date (วันที่กำหนดส่งมอบ)
          </label>
          <input
            type="date"
            required
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Payment Terms (เงื่อนไขการชำระเงิน)
          </label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
          >
            {PAYMENT_TERMS_OPTIONS.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LINE ITEMS TABLE */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Line Items (รายการสั่งซื้อ)
          </h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-4">Description (รายละเอียดสินค้า)</th>
                <th className="py-3 w-16 text-center">Qty</th>
                <th className="py-3 w-20 text-center">Unit (หน่วย)</th>
                <th className="py-3 w-28 text-right">Unit Price (฿)</th>
                <th className="py-3 w-20 text-center">VAT (%)</th>
                <th className="py-3 w-28 text-right">Total (฿)</th>
                <th className="py-3 w-32 pl-3">Remark</th>
                <th className="py-3 w-10 text-center pr-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const itemSubtotal = item.quantity * item.unitPrice;
                const itemTotal = itemSubtotal * (1 + item.vatPercent / 100);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-2.5 pl-4">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(item.id, "description", e.target.value)
                        }
                        placeholder="ชื่อสินค้า / รุ่น / สเปก..."
                        className="w-full bg-transparent border-none text-sm font-semibold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-0 p-0"
                      />
                    </td>
                    <td className="py-2.5 text-center">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            Math.max(1, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2.5 text-center">
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(item.id, "unit", e.target.value)
                        }
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "unitPrice",
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        placeholder="0"
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.vatPercent}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "vatPercent",
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-center text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2.5 text-right text-sm font-bold text-slate-800">
                      {itemTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2.5 pl-3">
                      <input
                        type="text"
                        value={item.remark}
                        onChange={(e) =>
                          handleItemChange(item.id, "remark", e.target.value)
                        }
                        placeholder="หมายเหตุ..."
                        className="w-full bg-slate-50/50 border border-slate-150 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-2.5 text-center pr-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length === 1}
                        className="text-slate-300 hover:text-rose-500 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRICE SUMMARY TABLE */}
      <div className="flex flex-col items-end gap-2 bg-slate-50 rounded-2xl p-4 border border-slate-100 max-w-sm ml-auto text-sm font-semibold text-slate-600">
        <div className="flex justify-between w-full">
          <span>Subtotal (รวมราคาก่อน VAT):</span>
          <span>฿{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between w-full border-b border-slate-200 pb-2">
          <span>Total VAT (ภาษีมูลค่าเพิ่ม):</span>
          <span>฿{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between w-full pt-2 text-lg font-black text-purple-700 items-center">
          <span>Net Total (ราคารวมสุทธิ):</span>
          <span className="bg-purple-100 px-3 py-1 rounded-xl shadow-xs">฿{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
