"use client";

import React, { useState } from "react";
import { Plus, Trash2, Save, Send } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
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

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInput[]>([
    {
      id: "1",
      stepOrder: 1,
      roleName: "หัวหน้าแผนก (Department Head)",
      approverName: "สมชาย ใจดี",
    },
    {
      id: "2",
      stepOrder: 2,
      roleName: "ผู้จัดการฝ่าย (Division Manager)",
      approverName: "กิตติศักดิ์ พรหมมา",
    },
    {
      id: "3",
      stepOrder: 3,
      roleName: "ผู้จัดการฝ่ายจัดซื้อ (Procurement Manager)",
      approverName: "วิภา รักดี",
    },
    {
      id: "4",
      stepOrder: 4,
      roleName: "ผู้อำนวยการ (Director / VP)",
      approverName: "อรทัย สุขใจ",
    },
  ]);

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
          <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 font-mono text-sm font-bold text-purple-600 shadow-xs">
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

      {/* FORM FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
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
        <div className="flex justify-between w-full pt-1 text-base font-extrabold text-purple-600">
          <span>Net Total (ราคารวมสุทธิ):</span>
          <span>฿{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
