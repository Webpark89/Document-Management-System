"use client";

import React from "react";
import { ShieldCheck, UserCheck } from "lucide-react";

export interface WorkflowStepInput {
  id: string;
  stepOrder: number;
  roleName: string;
  approverName: string;
}

interface ApprovalWorkflowSectionProps {
  steps: WorkflowStepInput[];
  onChange: (steps: WorkflowStepInput[]) => void;
}

const DEFAULT_ROLES = [
  "หัวหน้าแผนก (Department Head)",
  "ผู้จัดการฝ่าย (Division Manager)",
  "ผู้จัดการฝ่ายจัดซื้อ (Procurement Manager)",
  "ผู้อำนวยการ (Director / VP)",
  "ประธานบริหาร (CEO)",
  "เจ้าหน้าที่ตรวจสอบ (Audit Officer)",
];

const MOCK_APPROVERS = [
  { name: "สมชาย ใจดี", role: "หัวหน้าแผนก IT" },
  { name: "วิภา รักดี", role: "ผู้จัดการฝ่ายจัดซื้อ" },
  { name: "อรทัย สุขใจ", role: "ผู้อำนวยการการเงิน" },
  { name: "ชาญชัย มีสุข", role: "ประธานบริหาร" },
  { name: "กิตติศักดิ์ พรหมมา", role: "ผู้จัดการฝ่าย HR" },
];

export default function ApprovalWorkflowSection({
  steps,
  onChange,
}: ApprovalWorkflowSectionProps) {
  const handleStepChange = (
    id: string,
    field: keyof WorkflowStepInput,
    value: string
  ) => {
    onChange(
      steps.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">
                กำหนดสายการอนุมัติ (Approval Workflow Matrix)
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {steps.length} Steps
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              ดึงข้อมูลสายการอนุมัติตามประเภทเอกสารจาก Master Data (เลือกเปลี่ยนชื่อบุคคลได้)
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          // Find chosen approvers in other steps
          const otherChosenApprovers = new Set(
            steps.filter((s) => s.id !== step.id).map((s) => s.approverName)
          );

          return (
            <div
              key={step.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-extrabold shrink-0">
                  {step.stepOrder}
                </span>
                <div className="flex-1 sm:w-60">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    ตำแหน่ง / สิทธิ์อนุมัติ
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={step.roleName}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    ชื่อผู้อนุมัติ (Approver - ห้ามเลือกซ้ำ)
                  </label>
                  <div className="relative">
                    <select
                      value={step.approverName}
                      onChange={(e) =>
                        handleStepChange(step.id, "approverName", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer"
                    >
                      {MOCK_APPROVERS.map((appr) => {
                        const isChosenInOtherStep = otherChosenApprovers.has(
                          appr.name
                        );
                        return (
                          <option
                            key={appr.name}
                            value={appr.name}
                            disabled={isChosenInOtherStep}
                          >
                            {appr.name} ({appr.role})
                            {isChosenInOtherStep ? " — เลือกแล้วในขั้นอื่น" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
