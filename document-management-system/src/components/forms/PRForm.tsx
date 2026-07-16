"use client";

import React, { useState } from "react";
import { Plus, Trash2, Save, Send, UploadCloud } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
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
}

const DEPARTMENTS = [
  "ฝ่ายเทคโนโลยีสารสนเทศ (IT)",
  "ฝ่ายจัดซื้อและพัสดุ",
  "ฝ่ายบัญชีและการเงิน",
  "ฝ่ายบริหารทรัพยากรบุคคล (HR)",
  "ฝ่ายบริหารทั่วไป",
  "ฝ่ายวิศวกรรมและซ่อมบำรุง",
];

const UNITS = ["ชิ้น", "เครื่อง", "ชุด", "กล่อง", "แพ็ค", "งวด", "งาน"];

export default function PRForm({ onSubmit, onCancel, runningNumberPreview }: PRFormProps) {
  const { user } = useAuth();
  const defaultRequester = user?.full_name || user?.username || "Administrator";
  const defaultDept = user?.department || DEPARTMENTS[0];

  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(defaultDept);
  const [requestedDate, setRequestedDate] = useState(todayStr);
  const [requiredDate, setRequiredDate] = useState(nextWeekStr);
  const [purpose, setPurpose] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
      roleName: "ผู้จัดการฝ่ายจัดซื้อ (Procurement Manager)",
      approverName: "วิภา รักดี",
    },
    {
      id: "3",
      stepOrder: 3,
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
        unit: "ชิ้น",
        unitPrice: 0,
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
    field: keyof PRItemInput,
    value: string | number
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const triggerSubmit = (isDraft: boolean) => {
    if (!title.trim()) {
      alert("กรุณากรอกหัวข้อ/เรื่องเอกสาร");
      return;
    }
    onSubmit({
      title,
      sender: defaultRequester,
      department,
      requestedDate,
      requiredDate,
      purpose,
      amount: `฿${grandTotal.toLocaleString()}`,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Running Number (Preview)
          </label>
          <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 font-mono text-sm font-bold text-blue-600 shadow-xs">
            {runningNumberPreview}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Requester Name (ผู้ขออนุมัติ)
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
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Document Title / Subject (เรื่องขอซื้อ) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ขอซื้อวัสดุอุปกรณ์สำนักงาน ประจำไตรมาส 3/2026"
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Requested Date (วันที่ขอซื้อ)
          </label>
          <input
            type="date"
            required
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Required Date (วันที่ต้องการใช้สินค้า)
          </label>
          <input
            type="date"
            required
            value={requiredDate}
            onChange={(e) => setRequiredDate(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Purpose / Justification (วัตถุประสงค์)
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="เพื่อใช้ในโครงการระบบทดสอบ..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* LINE ITEMS TABLE */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Line Items (รายการขอซื้อ)
          </h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-4">Description (รายละเอียด)</th>
                <th className="py-3 w-20 text-center">Qty</th>
                <th className="py-3 w-24 text-center">Unit (หน่วย)</th>
                <th className="py-3 w-28 text-right">Unit Price (฿)</th>
                <th className="py-3 w-28 text-right">Total (฿)</th>
                <th className="py-3 w-36 pl-3">Remark (หมายเหตุ)</th>
                <th className="py-3 w-10 text-center pr-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const total = item.quantity * item.unitPrice;
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
                        placeholder="ชื่อพัสดุ / อุปกรณ์..."
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
                        className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2.5 text-center">
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(item.id, "unit", e.target.value)
                        }
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2.5 text-right text-sm font-bold text-slate-800">
                      {total.toLocaleString()}
                    </td>
                    <td className="py-2.5 pl-3">
                      <input
                        type="text"
                        value={item.remark}
                        onChange={(e) =>
                          handleItemChange(item.id, "remark", e.target.value)
                        }
                        placeholder="หมายเหตุ..."
                        className="w-full bg-slate-50/50 border border-slate-150 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none focus:border-blue-500"
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

      {/* GRAND TOTAL */}
      <div className="flex justify-end items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Grand Total (ราคารวมสุทธิ)
        </span>
        <span className="text-2xl font-extrabold text-blue-600">
          ฿{grandTotal.toLocaleString()}
        </span>
      </div>

      {/* FILE UPLOAD ATTACHMENT */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Attach Reference Document (แนบไฟล์เอกสารอ้างอิง เช่น ใบเสนอราคา)
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors cursor-pointer relative bg-white">
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
              {uploadedFile ? uploadedFile.name : "คลิก หรือ ลากไฟล์เอกสารอ้างอิงมาวางที่นี่"}
            </p>
            <p className="text-xs text-slate-400">
              รองรับไฟล์ PDF, DOC, DOCX (ขนาดสูงสุดไม่เกิน 25MB)
            </p>
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
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            Submit for Approval (ส่งขออนุมัติ)
          </button>
        </div>
      </div>
    </form>
  );
}
