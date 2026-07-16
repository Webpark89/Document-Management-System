"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Inbox,
  Layers,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import {
  RESET_CYCLE_LABELS,
  YEAR_FORMAT_LABELS,
  formatRunningPattern,
  getRunningConfigs,
  updateRunningConfig,
  type DocumentRunningConfig,
  type ResetCycle,
  type RunningDigits,
  type RunningSeparator,
  type YearFormat,
} from "@/lib/config-mock";

type Props = {
  showToast: (message: string, type: "success" | "error") => void;
};

type RunningFormState = {
  yearFormat: YearFormat;
  runningDigits: RunningDigits;
  separator: RunningSeparator;
  resetCycle: ResetCycle;
  isActive: boolean;
};

function runningFormSnapshot(form: RunningFormState): string {
  return JSON.stringify(form);
}

const thCls = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
const tdCls = "px-6 py-3 text-left text-sm text-slate-700";
const tdMuted = "px-6 py-3 text-left text-sm text-slate-500";
const tdNum = "px-6 py-3 text-right text-sm text-slate-500 tabular-nums";
const btnGhost = "rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100";
const inputCls =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

export default function DocumentRunningTab({ showToast }: Props) {
  const [configs, setConfigs] = useState<DocumentRunningConfig[]>(() => getRunningConfigs());
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<RunningFormState>({
    yearFormat: "be4",
    runningDigits: 4,
    separator: "-",
    resetCycle: "yearly",
    isActive: true,
  });
  const [baseline, setBaseline] = useState("");
  const [saving, setSaving] = useState(false);

  const editingRow = configs.find((c) => c.matrixKey === editingKey) ?? null;

  const rows = useMemo(
    () =>
      showInactive ? configs.filter((c) => !c.isActive) : configs.filter((c) => c.isActive),
    [configs, showInactive]
  );

  const stats = useMemo(
    () => ({
      total: configs.length,
      active: configs.filter((c) => c.isActive).length,
      inactive: configs.filter((c) => !c.isActive).length,
    }),
    [configs]
  );

  const preview = useMemo(() => {
    if (!editingRow) return { pattern: "", example: "" };
    return formatRunningPattern(
      {
        prefix: editingRow.prefix,
        yearFormat: form.yearFormat,
        runningDigits: form.runningDigits,
        separator: form.separator,
      },
      editingRow.currentCounter + 1
    );
  }, [editingRow, form]);

  const isDirty = modalOpen && runningFormSnapshot(form) !== baseline;
  const showPatternWarning = !!editingRow && editingRow.currentCounter > 0 && isDirty;

  const openEdit = (matrixKey: string) => {
    const row = configs.find((c) => c.matrixKey === matrixKey);
    if (!row) return;
    const nextForm: RunningFormState = {
      yearFormat: row.yearFormat,
      runningDigits: row.runningDigits,
      separator: row.separator,
      resetCycle: row.resetCycle,
      isActive: row.isActive,
    };
    setEditingKey(matrixKey);
    setForm(nextForm);
    setBaseline(runningFormSnapshot(nextForm));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isDirty && !confirm("ยังไม่ได้บันทึกข้อมูล ต้องการปิดหน้าต่างนี้หรือไม่?")) return;
    setModalOpen(false);
    setEditingKey(null);
    setBaseline("");
  };

  const toggleActive = (matrixKey: string) => {
    const row = configs.find((c) => c.matrixKey === matrixKey);
    if (!row) return;
    const next = configs.map((c) =>
      c.matrixKey === matrixKey ? { ...c, isActive: !c.isActive } : c
    );
    setConfigs(next);
    updateRunningConfig(matrixKey, { isActive: !row.isActive });
    showToast(!row.isActive ? "เปิดใช้งานรูปแบบเลขที่สำเร็จ" : "ปิดใช้งานรูปแบบเลขที่สำเร็จ", "success");
  };

  const handleSave = async () => {
    if (!editingKey || !editingRow) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const patch = {
      yearFormat: form.yearFormat,
      runningDigits: form.runningDigits,
      separator: form.separator,
      resetCycle: form.resetCycle,
      isActive: form.isActive,
    };

    updateRunningConfig(editingKey, patch);
    setConfigs((prev) =>
      prev.map((c) => (c.matrixKey === editingKey ? { ...c, ...patch } : c))
    );

    setSaving(false);
    setModalOpen(false);
    setEditingKey(null);
    setBaseline("");
    showToast("บันทึกรูปแบบเลขที่เอกสารสำเร็จ", "success");
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-slate-800">รูปแบบเลขที่เอกสาร</h2>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-200"
          />
          แสดงรายการที่ปิดใช้งาน
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <Inbox className="size-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              {showInactive ? "ไม่มีรายการที่ปิดใช้งาน" : "ไม่มีข้อมูล"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className={thCls}>ประเภทเอกสาร</th>
                  <th className={thCls}>รูปแบบ</th>
                  <th className={thCls}>รอบรีเซ็ตเลขที่</th>
                  <th className={`${thCls} text-right`}>เลขที่ปัจจุบัน</th>
                  <th className={thCls}>สถานะ</th>
                  <th className={`${thCls} text-right`}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const { pattern, example } = formatRunningPattern(row, row.currentCounter + 1);
                  return (
                    <tr
                      key={row.matrixKey}
                      className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                    >
                      <td className={`${tdCls} font-medium`}>{row.typeName}</td>
                      <td className={tdCls}>
                        <p className="font-mono text-xs text-slate-600">{pattern}</p>
                        <p className="mt-0.5 text-xs text-slate-400">ตัวอย่าง: {example}</p>
                      </td>
                      <td className={tdMuted}>{RESET_CYCLE_LABELS[row.resetCycle]}</td>
                      <td className={tdNum}>{row.currentCounter}</td>
                      <td className={tdCls}>
                        <button
                          type="button"
                          onClick={() => toggleActive(row.matrixKey)}
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                            row.isActive ? "bg-blue-600" : "bg-slate-200"
                          }`}
                          aria-label={row.isActive ? "Active" : "Inactive"}
                        >
                          <span
                            className={`inline-block size-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                              row.isActive ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span className="ml-2 text-xs text-slate-500">
                          {row.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(row.matrixKey)}
                          className={btnGhost}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex h-full min-h-[88px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Layers className="size-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500">ทั้งหมด</p>
          </div>
        </div>
        <div className="flex h-full min-h-[88px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
            <CheckCircle2 className="size-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-800">{stats.active}</p>
            <p className="text-xs text-slate-500">ใช้งาน</p>
          </div>
        </div>
        <div className="flex h-full min-h-[88px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
            <Trash2 className="size-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-800">{stats.inactive}</p>
            <p className="text-xs text-slate-500">ปิดใช้งาน</p>
          </div>
        </div>
      </div>

      {modalOpen && editingRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-medium text-slate-800">
                แก้ไขรูปแบบเลขที่ — {editingRow.typeName}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Prefix</label>
                <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-500">
                  {editingRow.prefix}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  แก้ Prefix ได้ที่แท็บประเภทเอกสารเท่านั้น
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">ส่วนปี</label>
                <select
                  className={inputCls}
                  value={form.yearFormat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, yearFormat: e.target.value as YearFormat }))
                  }
                >
                  {(Object.keys(YEAR_FORMAT_LABELS) as YearFormat[]).map((key) => (
                    <option key={key} value={key}>
                      {YEAR_FORMAT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">จำนวนหลัก Running Number</label>
                <select
                  className={inputCls}
                  value={form.runningDigits}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      runningDigits: Number(e.target.value) as RunningDigits,
                    }))
                  }
                >
                  <option value={3}>3 หลัก</option>
                  <option value={4}>4 หลัก</option>
                  <option value={5}>5 หลัก</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">ตัวคั่น (Separator)</label>
                <select
                  className={inputCls}
                  value={form.separator}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, separator: e.target.value as RunningSeparator }))
                  }
                >
                  <option value="-">- (ขีดกลาง)</option>
                  <option value="/">/ (ทับ)</option>
                  <option value="none">ไม่มี</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">รอบรีเซ็ตเลขที่</label>
                <select
                  className={inputCls}
                  value={form.resetCycle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, resetCycle: e.target.value as ResetCycle }))
                  }
                >
                  {(Object.keys(RESET_CYCLE_LABELS) as ResetCycle[]).map((key) => (
                    <option key={key} value={key}>
                      {RESET_CYCLE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">เลขที่ปัจจุบัน</label>
                <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-500 tabular-nums">
                  {editingRow.currentCounter}
                </div>
                <p className="mt-1 text-xs text-slate-400">นับอัตโนมัติจากเอกสารที่ออกเลขแล้ว</p>
              </div>

              <div>
                <p className="mb-2 text-xs text-slate-500">สถานะ</p>
                <div className="inline-flex rounded-md border border-gray-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isActive: true }))}
                    className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                      form.isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    ใช้งาน
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isActive: false }))}
                    className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                      !form.isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    ปิดใช้งาน
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-xs text-slate-500">ตัวอย่างเลขที่</p>
                <p className="mt-1 font-mono text-sm font-medium text-blue-800">{preview.example}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{preview.pattern}</p>
              </div>

              {showPatternWarning && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  การเปลี่ยนรูปแบบจะมีผลกับเอกสารใหม่เท่านั้น เอกสารเดิมจะไม่เปลี่ยนเลขที่
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-md px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
