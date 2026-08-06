"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, UserCheck } from "lucide-react";
import { adminService } from "@/controllers/services/admin.service";

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
}

export default function ApprovalWorkflowSection({
  steps,
  onChange,
}: ApprovalWorkflowSectionProps) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    adminService
      .getUsersList()
      .then((res) => {
        const activeUsers = (res || []).filter((u: any) => u.is_active);
        setUsers(activeUsers);
      })
      .catch(() => {});
  }, []);

  // Auto-fill empty or unassigned steps when users load or steps change
  useEffect(() => {
    if (users.length === 0) return;

    let currentSteps = steps;
    if (!currentSteps || currentSteps.length === 0) {
      currentSteps = [
        { id: "1", stepOrder: 1, roleName: "ผู้จัดการแผนก (Department Manager)", approverName: "" },
        { id: "2", stepOrder: 2, roleName: "ผู้อนุมัติ / ผู้บริหาร (Executive/Director)", approverName: "" },
      ];
    }

    let changed = currentSteps.length !== steps.length;
    const updated = currentSteps.map((step, idx) => {
      const match = users.find(
        (u) =>
          u.id === step.approverId ||
          `${u.first_name} ${u.last_name}`.trim().toLowerCase() === step.approverName.trim().toLowerCase() ||
          u.username === step.approverName
      );

      if (!match || !step.approverName || !step.approverId) {
        changed = true;
        const userToAssign = users[idx % users.length];
        return {
          ...step,
          approverId: userToAssign.id,
          approverName: `${userToAssign.first_name} ${userToAssign.last_name}`,
        };
      }
      return step;
    });

    if (changed) {
      onChange(updated);
    }
  }, [users, steps, onChange]);

  const handleApproverSelect = (id: string, selectedUserId: string) => {
    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser) return;
    const fullName = `${selectedUser.first_name} ${selectedUser.last_name}`;

    onChange(
      steps.map((s) =>
        s.id === id
          ? { ...s, approverId: selectedUser.id, approverName: fullName }
          : s
      )
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
          // Find chosen approver IDs in other steps
          const otherChosenIds = new Set(
            steps
              .filter((s) => s.id !== step.id && s.approverId)
              .map((s) => s.approverId)
          );

          const currentSelectedUser = users.find(
            (u) =>
              u.id === step.approverId ||
              `${u.first_name} ${u.last_name}`.trim().toLowerCase() === step.approverName.trim().toLowerCase()
          );

          const currentVal = currentSelectedUser?.id || step.approverId || "";

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
                      value={currentVal}
                      onChange={(e) =>
                        handleApproverSelect(step.id, e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer"
                    >
                      {users.length === 0 && (
                        <option value="">กำลังโหลดรายชื่อ...</option>
                      )}
                      {users.map((u) => {
                        const fullName = `${u.first_name} ${u.last_name}`;
                        const isChosenInOtherStep = otherChosenIds.has(u.id);
                        return (
                          <option
                            key={u.id}
                            value={u.id}
                            disabled={isChosenInOtherStep}
                          >
                            {fullName} ({u.role?.name || "N/A"})
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
