"use client";

import React from "react";
import { Globe, Building, Users } from "lucide-react";
import useSWR from "swr";
import { adminService } from "@/controllers/services/admin.service";
import { AutomaticApproverVisibility } from "./AutomaticApproverVisibility";
import type { WorkflowStepInput } from "./ApprovalWorkflowSection";

export interface VisibilityData {
  type: "CompanyWide" | "Department" | "SpecificUsers";
  departments: string[];
  users: string[];
}

interface Step2VisibilityProps {
  visibility?: VisibilityData;
  onVisibilityChange?: (data: VisibilityData) => void;
  value?: VisibilityData;
  onChange?: (data: VisibilityData) => void;
  isRequired?: boolean;
  approvers?: WorkflowStepInput[];
}

export default function Step2Visibility({
  visibility: propVisibility,
  onVisibilityChange: propOnVisibilityChange,
  value,
  onChange,
  approvers = [],
}: Step2VisibilityProps) {
  const {
    data: departmentsList = [],
    error: departmentsError,
    isLoading: departmentsLoading,
    mutate: reloadDepartments,
  } = useSWR("/api/lookups/departments", () =>
    adminService.getDepartmentDirectory(),
  );
  const {
    data: usersList = [],
    error: usersError,
    isLoading: usersLoading,
    mutate: reloadUsers,
  } = useSWR("/api/lookups/users", () => adminService.getUserDirectory());
  const [userSearch, setUserSearch] = React.useState("");

  const currentVisibility: VisibilityData = value ||
    propVisibility || {
      type: "CompanyWide",
      departments: [],
      users: [],
    };

  const handleVisibilityChange = (data: VisibilityData) => {
    if (onChange) onChange(data);
    if (propOnVisibilityChange) propOnVisibilityChange(data);
  };

  const safeType = currentVisibility.type || "CompanyWide";
  const safeDepartments = currentVisibility.departments || [];
  const safeUsers = currentVisibility.users || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
          กำหนดสิทธิการมองเห็นเอกสาร (Document Visibility)
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() =>
              handleVisibilityChange({
                ...currentVisibility,
                type: "CompanyWide",
              })
            }
            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
              safeType === "CompanyWide"
                ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/10 text-blue-700"
                : "border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <Globe className="w-6 h-6" />
            <span className="text-sm font-bold">ทุกคนในระบบ</span>
            <span className="text-[10px] text-slate-500 font-medium">
              Company Wide
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleVisibilityChange({
                ...currentVisibility,
                type: "Department",
                departments: safeDepartments,
              })
            }
            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
              safeType === "Department"
                ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-600/10 text-purple-700"
                : "border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <Building className="w-6 h-6" />
            <span className="text-sm font-bold">ระบุแผนก</span>
            <span className="text-[10px] text-slate-500 font-medium">
              Specific Departments
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleVisibilityChange({
                ...currentVisibility,
                type: "SpecificUsers",
                users: safeUsers,
              })
            }
            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
              safeType === "SpecificUsers"
                ? "border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-600/10 text-emerald-700"
                : "border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-sm font-bold">ระบุบุคคล</span>
            <span className="text-[10px] text-slate-500 font-medium">
              Specific Users
            </span>
          </button>
        </div>

        {safeType === "Department" && (
          <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs font-bold text-slate-500 mb-2">
              เลือกแผนกที่สามารถเห็นเอกสารได้:
            </p>
            <div className="flex flex-wrap gap-2">
              {departmentsLoading && (
                <p role="status" className="text-xs text-slate-500">
                  กำลังโหลดแผนกจาก Master Data...
                </p>
              )}
              {departmentsError && (
                <div role="alert" className="text-xs text-red-600">
                  โหลดแผนกไม่สำเร็จ{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void reloadDepartments()}
                  >
                    ลองใหม่
                  </button>
                </div>
              )}
              {!departmentsLoading &&
                !departmentsError &&
                !departmentsList.length && (
                  <p className="text-xs text-slate-500">
                    ยังไม่มีแผนกที่เปิดใช้งานใน Master Data
                  </p>
                )}
              {departmentsList.map((department) => {
                const isSelected = safeDepartments.includes(department.id);
                return (
                  <button
                    key={department.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={departmentsLoading || !!departmentsError}
                    onClick={() => {
                      const newDepts = isSelected
                        ? safeDepartments.filter((d) => d !== department.id)
                        : [...safeDepartments, department.id];
                      handleVisibilityChange({
                        ...currentVisibility,
                        departments: newDepts,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-purple-100 border-purple-300 text-purple-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {department.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {safeType === "SpecificUsers" && (
          <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl relative">
            <p className="text-xs font-bold text-slate-500 mb-2">
              เลือกผู้ใช้งานที่สามารถเห็นเอกสารได้:
            </p>

            {usersLoading && (
              <p role="status" className="mb-2 text-xs text-slate-500">
                กำลังโหลดรายชื่อจาก Master Data...
              </p>
            )}
            {usersError && (
              <div role="alert" className="mb-2 text-xs text-red-600">
                โหลดรายชื่อไม่สำเร็จ{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void reloadUsers()}
                >
                  ลองใหม่
                </button>
              </div>
            )}
            {!usersLoading && !usersError && !usersList.length && (
              <p className="mb-2 text-xs text-slate-500">
                ยังไม่มีผู้ใช้งานที่เปิดใช้งานใน Master Data
              </p>
            )}
            {/* Selected Users */}
            <div className="flex flex-wrap gap-2 mb-3">
              {safeUsers.map((username) => {
                const u = usersList.find((x) => x.id === username);
                const displayName = u
                  ? `${u.first_name} ${u.last_name}`
                  : username;
                return (
                  <span
                    key={username}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200"
                  >
                    {displayName}
                    <button
                      type="button"
                      onClick={() =>
                        handleVisibilityChange({
                          ...currentVisibility,
                          users: safeUsers.filter((x) => x !== username),
                        })
                      }
                      className="hover:text-emerald-900 cursor-pointer text-base leading-none"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="พิมพ์ค้นหาชื่อผู้ใช้งานเพื่อเพิ่ม..."
                disabled={usersLoading || !!usersError}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {userSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  {usersList
                    .filter(
                      (u) =>
                        !safeUsers.includes(u.id) &&
                        (u.username
                          .toLowerCase()
                          .includes(userSearch.toLowerCase()) ||
                          `${u.first_name} ${u.last_name}`
                            .toLowerCase()
                            .includes(userSearch.toLowerCase())),
                    )
                    .map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          handleVisibilityChange({
                            ...currentVisibility,
                            users: [...safeUsers, u.id],
                          });
                          setUserSearch("");
                        }}
                        className="px-3 py-2 hover:bg-slate-50 text-xs font-bold cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
                      >
                        {u.first_name} {u.last_name}{" "}
                        <span className="text-slate-400 font-normal">
                          (@{u.username})
                        </span>
                      </div>
                    ))}
                  {usersList.filter(
                    (u) =>
                      !safeUsers.includes(u.id) &&
                      (u.username
                        .toLowerCase()
                        .includes(userSearch.toLowerCase()) ||
                        `${u.first_name} ${u.last_name}`
                          .toLowerCase()
                          .includes(userSearch.toLowerCase())),
                  ).length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center">
                      ไม่พบผู้ใช้งาน
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {safeType !== "CompanyWide" && (
          <div className="mt-4">
            <AutomaticApproverVisibility steps={approvers} />
          </div>
        )}
      </div>
    </div>
  );
}
