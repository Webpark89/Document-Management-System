"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import {
  ROLE_OPTIONS,
  type ApprovalMatrixState,
  type DocumentTypeRecord,
  type RoleOption,
} from "@/lib/config-mock";
import { MD_SIDEBAR_PANEL, MD_TABLE_CARD } from "../master-data-ui";

type Props = {
  matrix: ApprovalMatrixState;
  docTypes: DocumentTypeRecord[];
  selectedKey: string;
  onSelectKey: (key: string) => void;
  onMatrixChange: (next: ApprovalMatrixState) => void;
  showToast: (message: string, type: "success" | "error") => void;
  setupNotice: string | null;
  onDismissSetupNotice: () => void;
};

function findDuplicateRoles(steps: RoleOption[]): Set<RoleOption> {
  const seen = new Set<RoleOption>();
  const dupes = new Set<RoleOption>();
  steps.forEach((role) => {
    if (seen.has(role)) dupes.add(role);
    seen.add(role);
  });
  return dupes;
}

const FIXED_STEP_TYPES: Record<string, number> = {
  PR: 3,
  PO: 4,
};

function isStepCountLocked(key: string): boolean {
  return key in FIXED_STEP_TYPES;
}

function getFixedStepCount(key: string): number | null {
  return FIXED_STEP_TYPES[key] ?? null;
}

function normalizeStepsForKey(key: string, steps: RoleOption[]): RoleOption[] {
  const fixed = getFixedStepCount(key);
  if (fixed === null) return [...steps];
  const normalized = [...steps];
  while (normalized.length < fixed) normalized.push(ROLE_OPTIONS[0]);
  return normalized.slice(0, fixed);
}

function lockedStepHelperText(key: string): string | null {
  if (key === "PR") return "PR ใช้สายการอนุมัติแบบ 3 ระดับตายตัวตามข้อกำหนดระบบ";
  if (key === "PO") return "PO ใช้สายการอนุมัติแบบ 4 ระดับตายตัวตามข้อกำหนดระบบ";
  return null;
}

function StepFlowPreview({ steps }: { steps: RoleOption[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-600/80">
        ตัวอย่างสายอนุมัติ
      </p>
      <div className="flex min-w-max flex-wrap items-center gap-1.5">
        {steps.map((role, index) => (
          <span key={`${role}-${index}`} className="flex items-center gap-1.5">
            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-800 shadow-sm">
              {role}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="size-4 shrink-0 text-blue-400" aria-hidden />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ApprovalMatrixTab({
  matrix,
  docTypes,
  selectedKey,
  onSelectKey,
  onMatrixChange,
  showToast,
  setupNotice,
  onDismissSetupNotice,
}: Props) {
  const [draftSteps, setDraftSteps] = useState<RoleOption[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeTypes = useMemo(() => docTypes, [docTypes]);

  const selectedEntry = matrix[selectedKey];
  const selectedType = docTypes.find((d) => d.key === selectedKey);
  const stepCountLocked = isStepCountLocked(selectedKey);
  const fixedStepCount = getFixedStepCount(selectedKey);
  const lockedHelperText = lockedStepHelperText(selectedKey);

  const isUnconfigured = (key: string) => (matrix[key]?.steps.length ?? 0) === 0;

  const syncDraft = (key: string) => {
    const steps = matrix[key]?.steps ?? [];
    setDraftSteps(normalizeStepsForKey(key, steps));
    setDirty(false);
  };

  useEffect(() => {
    if (selectedKey && matrix[selectedKey]) {
      syncDraft(selectedKey);
    }
  }, [selectedKey, matrix]);

  const duplicateRoles = findDuplicateRoles(draftSteps);
  const hasDuplicate = duplicateRoles.size > 0;

  const canSave = stepCountLocked
    ? draftSteps.every((s) => s) && !hasDuplicate && dirty
    : draftSteps.length >= 1 &&
      draftSteps.length <= 4 &&
      draftSteps.every((s) => s) &&
      !hasDuplicate &&
      dirty;

  const updateStep = (index: number, role: RoleOption) => {
    setDraftSteps((prev) => {
      const next = [...prev];
      next[index] = role;
      return next;
    });
    setDirty(true);
  };

  const removeStep = (index: number) => {
    if (stepCountLocked || draftSteps.length <= 1) return;
    setDraftSteps((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const addStep = () => {
    if (stepCountLocked || draftSteps.length >= 4) return;
    setDraftSteps((prev) => [...prev, ROLE_OPTIONS[0]]);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!canSave || !selectedEntry) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    onMatrixChange({
      ...matrix,
      [selectedKey]: {
        ...selectedEntry,
        steps: normalizeStepsForKey(selectedKey, draftSteps),
      },
    });

    setSaving(false);
    setDirty(false);
    showToast("บันทึกสายการอนุมัติสำเร็จ", "success");
  };

  const handleSelectKey = (key: string) => {
    onSelectKey(key);
    syncDraft(key);
  };

  if (activeTypes.length === 0) {
    return (
      <div className={`${MD_TABLE_CARD} p-12 text-center`}>
        <p className="text-sm text-slate-500">
          ไม่มีประเภทเอกสารที่ใช้งาน — เพิ่มประเภทเอกสารในแท็บแรกก่อน
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24 md:flex-row md:gap-6 md:pb-0">
      <div className="md:hidden">
        <label className="mb-1.5 block text-xs font-medium text-slate-500">ประเภทเอกสาร</label>
        <select
          value={selectedKey}
          onChange={(e) => handleSelectKey(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {activeTypes.map((type) => (
            <option key={type.key} value={type.key}>
              {type.typeName}
              {isUnconfigured(type.key) ? " — ยังไม่ตั้งค่า" : ""}
            </option>
          ))}
        </select>
      </div>

      <aside className={`hidden w-[220px] shrink-0 md:block ${MD_SIDEBAR_PANEL}`}>
        <div className="space-y-1 p-4">
        <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          ประเภทเอกสาร
        </p>
        {activeTypes.map((type) => {
          const unconfigured = isUnconfigured(type.key);
          return (
            <button
              key={type.key}
              type="button"
              onClick={() => handleSelectKey(type.key)}
              className={`flex w-full items-start gap-2 rounded-md border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                selectedKey === type.key
                  ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                  : "border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-800"
              } ${!type.isActive ? "opacity-50" : ""}`}
            >
              {unconfigured && (
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500"
                  title="ยังไม่ตั้งค่าสายอนุมัติ"
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate">{type.typeName}</span>
                  {unconfigured && (
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                      ยังไม่ตั้งค่า
                    </span>
                  )}
                </span>
                <span className="text-xs font-normal text-slate-400">{type.prefix}</span>
              </span>
            </button>
          );
        })}
        </div>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        {setupNotice && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="flex-1 text-sm text-amber-900">
              กรุณาตั้งค่าสายการอนุมัติสำหรับ <strong>{setupNotice}</strong> ก่อนใช้งาน
            </p>
            <button
              type="button"
              onClick={onDismissSetupNotice}
              className="rounded p-1 text-amber-600 transition-colors hover:bg-amber-100"
              aria-label="ปิดแจ้งเตือน"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-800">
            สายการอนุมัติ — {selectedType?.typeName ?? "—"}
          </h2>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {stepCountLocked && fixedStepCount !== null
              ? `${fixedStepCount}/${fixedStepCount} ขั้น (ตายตัว)`
              : `${draftSteps.length}/4 ขั้น`}
          </span>
        </div>

        <div className={`${MD_TABLE_CARD} space-y-3 p-4 md:p-6`}>
          {draftSteps.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">
              ยังไม่ได้กำหนดสายอนุมัติ — กด เพิ่มขั้นตอน เพื่อเริ่มต้น
            </p>
          )}
          {draftSteps.map((role, index) => {
            const isDupe = duplicateRoles.has(role);
            return (
              <div
                key={`${selectedKey}-step-${index}`}
                className={`rounded-lg border p-4 ${
                  isDupe ? "border-amber-300 bg-amber-50/50" : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs text-slate-500">บทบาทผู้อนุมัติ</label>
                    <select
                      value={role}
                      onChange={(e) => updateStep(index, e.target.value as RoleOption)}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {isDupe && (
                      <p className="mt-1 text-xs text-amber-700">
                        บทบาทซ้ำในสายเดียวกัน — กรุณาเลือกบทบาทอื่น
                      </p>
                    )}
                  </div>
                  {!stepCountLocked && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      disabled={draftSteps.length <= 1}
                      title={draftSteps.length <= 1 ? "ต้องมีอย่างน้อย 1 ขั้น" : "ลบขั้นนี้"}
                      className="mt-5 rounded-md p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!stepCountLocked && (
            <button
              type="button"
              onClick={addStep}
              disabled={draftSteps.length >= 4}
              title={draftSteps.length >= 4 ? "สูงสุด 4 ขั้น" : "เพิ่มขั้นอนุมัติ"}
              className="hidden w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 md:flex"
            >
              <Plus className="size-4" />
              เพิ่มขั้นตอน
            </button>
          )}

          {lockedHelperText && (
            <p className="text-xs text-slate-500">{lockedHelperText}</p>
          )}
        </div>

        {draftSteps.length > 0 ? (
          <StepFlowPreview steps={draftSteps} />
        ) : selectedType ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
            {selectedType.typeName} ยังไม่พร้อมใช้งาน — กำหนดสายอนุมัติอย่างน้อย 1 ขั้นก่อน
          </p>
        ) : null}

        <div className="hidden justify-end md:flex">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "กำลังบันทึก..." : "บันทึกเมทริกซ์อนุมัติ"}
          </button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
        {!stepCountLocked && (
          <button
            type="button"
            onClick={addStep}
            disabled={draftSteps.length >= 4}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-200 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            <Plus className="size-4" />
            เพิ่มขั้นตอน
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !canSave}
          className={`flex items-center justify-center gap-2 rounded-md bg-blue-600 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 ${
            stepCountLocked ? "w-full" : "flex-1"
          }`}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
