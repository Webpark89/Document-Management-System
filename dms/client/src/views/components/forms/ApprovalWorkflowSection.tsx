"use client";

import React from "react";
import useSWR from "swr";
import { ShieldCheck, UserCheck } from "lucide-react";
import { adminService } from "@/controllers/services/admin.service";
import { AutomaticApproverVisibility } from "./AutomaticApproverVisibility";

export interface WorkflowStepInput {
  id: string;
  stepOrder: number;
  roleName: string;
  approverId?: string;
  approverName: string;
}

interface ApprovalWorkflowSectionProps {
  steps: WorkflowStepInput[];
  onChange: (steps: WorkflowStepInput[]) => void;
  visibilityType?: string;
}

export default function ApprovalWorkflowSection({
  steps,
  onChange,
  visibilityType = "CompanyWide",
}: ApprovalWorkflowSectionProps) {
  const {
    data: users = [],
    isLoading,
    error,
    mutate: reloadUsers,
  } = useSWR("/api/lookups/users", () => adminService.getUserDirectory());
  const loadError = !!error;

  const handleApproverSelect = (stepId: string, selectedUserId: string) => {
    if (
      steps.some(
        (step) => step.id !== stepId && step.approverId === selectedUserId,
      )
    )
      return;
    const selectedUser = users.find((u) => u.id === selectedUserId);
    const selectedStep = steps.find((step) => step.id === stepId);
    if (
      !selectedUser ||
      !selectedUser.can_approve ||
      selectedUser.role !== selectedStep?.roleName
    )
      return;
    const fullName =
      `${selectedUser.first_name} ${selectedUser.last_name}`.trim();

    onChange(
      steps.map((s) =>
        s.id === stepId
          ? { ...s, approverId: selectedUser.id, approverName: fullName }
          : s,
      ),
    );
  };

  // Safe guard — steps should always be array
  const safeSteps = steps || [];

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
                {safeSteps.length} Steps
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              ดึงข้อมูลสายการอนุมัติตามประเภทเอกสารจาก Master Data
              (เลือกเปลี่ยนชื่อบุคคลได้ โดยผู้อนุมัติแต่ละขั้นต้องไม่ซ้ำกัน)
            </p>
          </div>
        </div>
      </div>

      {!safeSteps.length && (
        <p role="alert" className="text-sm text-amber-700">
          ยังไม่มีสายอนุมัติสำหรับประเภทนี้ กรุณาให้ผู้ดูแลตั้งค่า Master Data
          ก่อนส่ง
        </p>
      )}
      {loadError && (
        <p role="alert" className="text-sm text-red-600">
          โหลดรายชื่อผู้อนุมัติจาก Master Data ไม่สำเร็จ{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void reloadUsers()}
          >
            ลองใหม่
          </button>
        </p>
      )}
      {visibilityType !== "CompanyWide" && (
        <AutomaticApproverVisibility steps={safeSteps} />
      )}
      <div className="space-y-3">
        {safeSteps.map((step) => {
          const currentSelectedUser = users.find(
            (u) => u.id === step.approverId,
          );
          const currentVal = currentSelectedUser?.id || step.approverId || "";
          const duplicateStep = safeSteps.find(
            (other) =>
              other.id !== step.id &&
              other.approverId === currentVal &&
              currentVal !== "",
          );

          return (
            <div
              key={step.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs"
            >
              {/* Role label (read-only, from master data) */}
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

              {/* Only eligible approvers; each person can fill one step. */}
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    ชื่อผู้อนุมัติ (Approver)
                  </label>
                  <div className="relative">
                    <select
                      aria-label={`ผู้อนุมัติขั้นที่ ${step.stepOrder}`}
                      aria-invalid={!!duplicateStep}
                      aria-describedby={
                        duplicateStep ? `approver-error-${step.id}` : undefined
                      }
                      value={currentVal}
                      disabled={isLoading || loadError}
                      onChange={(e) =>
                        handleApproverSelect(step.id, e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer"
                    >
                      {isLoading ? (
                        <option value="">กำลังโหลดรายชื่อ...</option>
                      ) : (
                        <option value="" disabled>
                          -- โปรดเลือกผู้อนุมัติ --
                        </option>
                      )}
                      {users
                        .filter((u) => {
                          return (
                            u.can_approve === true && u.role === step.roleName
                          );
                        })
                        .map((u) => {
                          const fullName =
                            `${u.first_name} ${u.last_name}`.trim();
                          const posLabel =
                            u.position && u.position !== "-"
                              ? u.position
                              : u.role || "N/A";
                          const selectedInStep = safeSteps.find(
                            (other) =>
                              other.id !== step.id && other.approverId === u.id,
                          );
                          return (
                            <option
                              key={u.id}
                              value={u.id}
                              disabled={!!selectedInStep}
                            >
                              {fullName} ({posLabel})
                              {selectedInStep
                                ? ` — เลือกแล้วในขั้นที่ ${selectedInStep.stepOrder}`
                                : ""}
                            </option>
                          );
                        })}
                    </select>
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                  {duplicateStep && (
                    <p
                      id={`approver-error-${step.id}`}
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-rose-600"
                    >
                      ผู้อนุมัติซ้ำกับขั้นที่ {duplicateStep.stepOrder}{" "}
                      กรุณาเลือกคนอื่น
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
