"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Inbox, Loader2, Plus, X } from "lucide-react";
import {
  DEFAULT_FORM_META,
  FORM_TYPE_DESCRIPTIONS,
  FORM_TYPE_OPTIONS,
  appendRunningConfig,
  type ApprovalMatrixEntry,
  type ApprovalMatrixState,
  type DocumentTypeRecord,
  type FormTypeStyle,
} from "@/lib/config-mock";

type Props = {
  matrix: ApprovalMatrixState;
  docTypes: DocumentTypeRecord[];
  onMatrixChange: (next: ApprovalMatrixState) => void;
  onDocTypesChange: (next: DocumentTypeRecord[]) => void;
  onCreated: (key: string, typeName: string) => void;
  showToast: (message: string, type: "success" | "error") => void;
};

type FormState = {
  typeName: string;
  prefix: string;
  formType: FormTypeStyle;
  formCode: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const PREFIX_RE = /^[A-Z0-9]{2,6}$/;

const thCls = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
const tdCls = "px-6 py-3 text-left text-sm text-slate-700";
const tdNum = "px-6 py-3 text-right text-sm text-slate-500 tabular-nums";
const btnGhost = "rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100";
const btnDanger =
  "rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40";
const inputCls =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const inputErrorCls =
  "w-full rounded-md border border-red-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

function formTypeBadge(formType: FormTypeStyle) {
  const colors: Record<FormTypeStyle, string> = {
    "PR-style": "bg-blue-50 text-blue-700",
    "PO-style": "bg-violet-50 text-violet-700",
    "Certificate-style": "bg-amber-50 text-amber-700",
    General: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${colors[formType]}`}>
      {formType}
    </span>
  );
}

function FormTypeTooltip({ formType }: { formType: FormTypeStyle }) {
  return (
    <span className="group relative inline-flex">
      <HelpCircle className="size-3.5 cursor-help text-slate-400" aria-label="คำอธิบาย Form Type" />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-56 -translate-x-1/2 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg group-hover:block"
      >
        {formType}: {FORM_TYPE_DESCRIPTIONS[formType]}
      </span>
    </span>
  );
}

function DeleteTooltipButton({
  row,
  onDelete,
}: {
  row: DocumentTypeRecord;
  onDelete: (row: DocumentTypeRecord) => void;
}) {
  const blocked = row.docCount > 0;
  const tooltip = blocked
    ? `ไม่สามารถลบได้ เนื่องจากมีเอกสาร ${row.docCount} ฉบับใช้ประเภทนี้อยู่ — กรุณาปิดใช้งานแทน`
    : "ลบประเภทเอกสาร";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={() => onDelete(row)}
        disabled={blocked}
        className={btnDanger}
      >
        Delete
      </button>
      {blocked && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 hidden w-64 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg group-hover:block"
        >
          {tooltip}
        </span>
      )}
      {!blocked && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

const FORM_CODE_RE = /^[A-Z0-9]+(-[A-Z0-9]+)+$/;

function validateForm(
  form: FormState,
  matrix: ApprovalMatrixState,
  editingKey: string | null
): FormErrors {
  const errors: FormErrors = {};
  const name = form.typeName.trim();
  const prefix = form.prefix.trim().toUpperCase();

  if (!name) errors.typeName = "กรุณากรอกชื่อประเภทเอกสาร";
  else if (name.length < 2) errors.typeName = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
  else if (
    Object.entries(matrix).some(
      ([key, entry]) =>
        entry.typeName.trim().toLowerCase() === name.toLowerCase() && key !== editingKey
    )
  ) {
    errors.typeName = "ชื่อประเภทเอกสารนี้ถูกใช้งานแล้ว";
  }

  if (!prefix) errors.prefix = "กรุณากรอก Prefix";
  else if (!PREFIX_RE.test(prefix)) errors.prefix = "Prefix ต้องเป็นตัวพิมพ์ใหญ่หรือตัวเลข 2-6 ตัว";
  else if (
    Object.entries(matrix).some(
      ([key, entry]) => entry.prefix.toUpperCase() === prefix && key !== editingKey
    )
  ) {
    errors.prefix = "Prefix นี้ถูกใช้งานแล้ว";
  }

  const formCode = form.formCode.trim().toUpperCase();
  if (!formCode) errors.formCode = "กรุณากรอกรหัสฟอร์ม";
  else if (!FORM_CODE_RE.test(formCode)) errors.formCode = "รูปแบบรหัสฟอร์มไม่ถูกต้อง (เช่น PR-FRM)";
  else if (
    Object.entries(matrix).some(
      ([key, entry]) => entry.formCode.toUpperCase() === formCode && key !== editingKey
    )
  ) {
    errors.formCode = "รหัสฟอร์มนี้ถูกใช้งานแล้ว";
  }

  return errors;
}

export default function DocumentTypesTab({
  matrix,
  docTypes,
  onMatrixChange,
  onDocTypesChange,
  onCreated,
  showToast,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    typeName: "",
    prefix: "",
    formType: "PR-style",
    formCode: DEFAULT_FORM_META["PR-style"].formCode,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(
    () => Object.keys(validateForm(form, matrix, editingKey)).length === 0,
    [form, matrix, editingKey]
  );

  const openAdd = () => {
    setEditingKey(null);
    setForm({ typeName: "", prefix: "", formType: "PR-style", formCode: DEFAULT_FORM_META["PR-style"].formCode });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (row: DocumentTypeRecord) => {
    setEditingKey(row.key);
    setForm({
      typeName: row.typeName,
      prefix: row.prefix,
      formType: row.formType,
      formCode: row.formCode,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingKey(null);
    setFormErrors({});
  };

  const handleSave = async () => {
    const errors = validateForm(form, matrix, editingKey);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const prefix = form.prefix.trim().toUpperCase();
    const typeName = form.typeName.trim();
    const existing = editingKey ? matrix[editingKey] : null;
    const entry: ApprovalMatrixEntry = {
      typeName,
      prefix,
      formType: form.formType,
      formCode: form.formCode.trim().toUpperCase(),
      fieldsCount: existing?.fieldsCount ?? DEFAULT_FORM_META[form.formType].fieldsCount,
      docCount: existing?.docCount ?? 0,
      isActive: existing?.isActive ?? true,
      steps: editingKey ? [...(matrix[editingKey]?.steps ?? [])] : [],
    };

    const nextMatrix = { ...matrix };
    if (editingKey && editingKey !== prefix && matrix[editingKey]) {
      delete nextMatrix[editingKey];
    }
    nextMatrix[prefix] = entry;
    onMatrixChange(nextMatrix);

    const matrixKey = editingKey ?? prefix;
    appendRunningConfig(matrixKey, entry);

    const nextDocTypes = [...docTypes];
    const idx = editingKey ? nextDocTypes.findIndex((d) => d.key === editingKey) : -1;
    const row: DocumentTypeRecord = {
      key: prefix,
      typeName: entry.typeName,
      prefix,
      formType: entry.formType,
      formCode: entry.formCode,
      fieldsCount: entry.fieldsCount,
      docCount: entry.docCount,
      isActive: entry.isActive,
    };
    if (idx >= 0) nextDocTypes[idx] = row;
    else nextDocTypes.push(row);
    onDocTypesChange(nextDocTypes);

    setSaving(false);
    closeModal();

    if (editingKey) {
      showToast("แก้ไขประเภทเอกสารสำเร็จ", "success");
    } else {
      showToast(`กรุณาตั้งค่าสายการอนุมัติสำหรับ ${typeName} ก่อนใช้งาน`, "success");
      onCreated(prefix, typeName);
    }
  };

  const toggleActive = (key: string) => {
    const nextDocTypes = docTypes.map((d) =>
      d.key === key ? { ...d, isActive: !d.isActive } : d
    );
    onDocTypesChange(nextDocTypes);
    const entry = matrix[key];
    if (entry) {
      onMatrixChange({
        ...matrix,
        [key]: { ...entry, isActive: !entry.isActive },
      });
    }
  };

  const handleDelete = (row: DocumentTypeRecord) => {
    if (row.docCount > 0) return;
    if (!confirm(`ยืนยันการลบ "${row.typeName}"?`)) return;
    const nextMatrix = { ...matrix };
    delete nextMatrix[row.key];
    onMatrixChange(nextMatrix);
    onDocTypesChange(docTypes.filter((d) => d.key !== row.key));
    showToast("ลบประเภทเอกสารสำเร็จ", "success");
  };

  return (
    <>
      {docTypes.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-800">ประเภทเอกสาร</h2>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Add Document Type
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {docTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <Inbox className="size-12 text-slate-300" />
            <p className="text-sm text-slate-500">ยังไม่มีประเภทเอกสาร</p>
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="size-4" />
              เพิ่มประเภทเอกสารแรก
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className={thCls}>Type Name</th>
                  <th className={thCls}>Prefix</th>
                  <th className={thCls}>Form Type / ฟอร์ม</th>
                  <th className={`${thCls} text-right`}>จำนวนเอกสารที่ใช้</th>
                  <th className={thCls}>สถานะ</th>
                  <th className={`${thCls} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {docTypes.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                  >
                    <td className={`${tdCls} font-medium`}>{row.typeName}</td>
                    <td className={tdCls}>{row.prefix}</td>
                    <td className={tdCls}>
                      <span className="inline-flex items-center gap-1.5">
                        {formTypeBadge(row.formType)}
                        <FormTypeTooltip formType={row.formType} />
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.formCode} · {row.fieldsCount} ฟิลด์
                      </p>
                    </td>
                    <td className={tdNum}>{row.docCount}</td>
                    <td className={tdCls}>
                      <button
                        type="button"
                        onClick={() => toggleActive(row.key)}
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
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(row)} className={btnGhost}>
                          Edit
                        </button>
                        <DeleteTooltipButton row={row} onDelete={handleDelete} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
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
                {editingKey ? "แก้ไข" : "เพิ่ม"} Document Type
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
                <label className="mb-1.5 block text-xs text-slate-500">Type Name</label>
                <input
                  type="text"
                  value={form.typeName}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, typeName: e.target.value }));
                    if (formErrors.typeName) {
                      setFormErrors(
                        validateForm({ ...form, typeName: e.target.value }, matrix, editingKey)
                      );
                    }
                  }}
                  onBlur={() => setFormErrors(validateForm(form, matrix, editingKey))}
                  className={formErrors.typeName ? inputErrorCls : inputCls}
                />
                {formErrors.typeName && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.typeName}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Prefix</label>
                <input
                  type="text"
                  value={form.prefix}
                  disabled={!!editingKey}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
                    setForm((f) => ({ ...f, prefix: value }));
                    if (formErrors.prefix) {
                      setFormErrors(validateForm({ ...form, prefix: value }, matrix, editingKey));
                    }
                  }}
                  onBlur={() => setFormErrors(validateForm(form, matrix, editingKey))}
                  className={formErrors.prefix ? inputErrorCls : inputCls}
                />
                {formErrors.prefix && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.prefix}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Form Type</label>
                <select
                  className={inputCls}
                  value={form.formType}
                  onChange={(e) => {
                    const formType = e.target.value as FormTypeStyle;
                    setForm((f) => ({
                      ...f,
                      formType,
                      formCode: DEFAULT_FORM_META[formType].formCode,
                    }));
                  }}
                >
                  {FORM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">
                  {FORM_TYPE_DESCRIPTIONS[form.formType]}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">รหัสฟอร์ม</label>
                <input
                  type="text"
                  value={form.formCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                    setForm((f) => ({ ...f, formCode: value }));
                    if (formErrors.formCode) {
                      setFormErrors(
                        validateForm({ ...form, formCode: value }, matrix, editingKey)
                      );
                    }
                  }}
                  onBlur={() => setFormErrors(validateForm(form, matrix, editingKey))}
                  className={formErrors.formCode ? inputErrorCls : inputCls}
                />
                {formErrors.formCode && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.formCode}</p>
                )}
              </div>
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
                disabled={saving || !isValid}
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
