"use client";

import { useEffect, useMemo, useState } from "react";
import { FileType2, HelpCircle, Inbox, Loader2, Plus, X, Lock, Trash2 } from "lucide-react";
import { useSidebar } from "@/components/providers/SidebarProvider";
import {
  DEFAULT_FORM_META,
  DEFAULT_FORM_FIELDS,
  FORM_TYPE_DESCRIPTIONS,
  FORM_TYPE_OPTIONS,
  appendRunningConfig,
  appendWorkflowRecord,
  type FormFieldConfig,
  type ApprovalMatrixEntry,
  type ApprovalMatrixState,
  type DocumentTypeRecord,
  type FormTypeStyle,
} from "@/features/master-data";
import {
  MasterDataMobileCardList,
  MasterDataTableWrap,
  MD_TD,
  MD_TD_ACTION,
  MD_TD_NUM_RIGHT,
  MD_TD_STICKY,
  MD_TD_STATUS,
  MD_TH,
  MD_TH_ACTION,
  MD_TH_RIGHT,
  MD_TH_STICKY,
  MD_TH_STATUS,
  MD_TABLE,
  MD_THEAD,
  MD_TR,
  RowActions,
  StatCards,
  StatusBadge,
  StatusFormToggle,
} from "@/components/ui/admin";

type Props = {
  matrix: ApprovalMatrixState;
  docTypes: DocumentTypeRecord[];
  onMatrixChange: (next: ApprovalMatrixState) => void;
  onDocTypesChange: (next: DocumentTypeRecord[]) => void;
  onCreated: (key: string, typeName: string) => void;
  showToast: (message: string, type: "success" | "error") => void;
  addRequest?: number;
};

type FormState = {
  typeName: string;
  prefix: string;
  formType: FormTypeStyle;
  formCode: string;
  isActive: boolean;
  fields: FormFieldConfig[];
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const PREFIX_RE = /^[A-Z0-9]{2,6}$/;

const thCls = MD_TH;
const tdCls = MD_TD;
const tdNum = MD_TD_NUM_RIGHT;
const inputCls =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const inputErrorCls =
  "w-full rounded-md border border-red-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

function formTypeBadge(formType: FormTypeStyle) {
  const colors: Record<FormTypeStyle, string> = {
    "PR-style": "bg-blue-50 text-blue-700",
    "PO-style": "bg-violet-50 text-violet-700",
    "MEMO-style": "bg-amber-50 text-amber-700",
    "OTHER-style": "bg-slate-100 text-slate-600",
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

function DeleteGuardActions({
  row,
  onEdit,
  onDelete,
}: {
  row: DocumentTypeRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const blocked = row.docCount > 0;
  const tooltip = blocked
    ? `ไม่สามารถลบได้ เนื่องจากมีเอกสาร ${row.docCount} ฉบับใช้ประเภทนี้อยู่ — กรุณาปิดใช้งานแทน`
    : "ลบ";

  return (
    <RowActions
      onEdit={onEdit}
      onDelete={onDelete}
      deleteBlocked={blocked}
      deleteTooltip={tooltip}
    />
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

  return errors;
}

export default function DocumentTypesTab({
  matrix,
  docTypes,
  onMatrixChange,
  onDocTypesChange,
  onCreated,
  showToast,
  addRequest = 0,
}: Props) {
  const { isOpen } = useSidebar();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    typeName: "",
    prefix: "",
    formType: "PR-style",
    formCode: DEFAULT_FORM_META["PR-style"].formCode,
    isActive: true,
    fields: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(
    () => Object.keys(validateForm(form, matrix, editingKey)).length === 0,
    [form, matrix, editingKey]
  );

  const stats = useMemo(
    () => ({
      total: docTypes.length,
      active: docTypes.filter((d) => d.isActive).length,
      inactive: docTypes.filter((d) => !d.isActive).length,
    }),
    [docTypes]
  );

  const openAdd = () => {
    setEditingKey(null);
    setForm({
      typeName: "",
      prefix: "",
      formType: "PR-style",
      formCode: DEFAULT_FORM_META["PR-style"].formCode,
      isActive: true,
      fields: JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS["PR-style"])),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  useEffect(() => {
    if (addRequest > 0) openAdd();
  }, [addRequest]);

  const openEdit = (row: DocumentTypeRecord) => {
    setEditingKey(row.key);
    const existing = matrix[row.key];
    const fields = existing?.fields && existing.fields.length > 0
      ? JSON.parse(JSON.stringify(existing.fields))
      : JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS[row.formType] || []));
    
    setForm({
      typeName: row.typeName,
      prefix: row.prefix,
      formType: row.formType,
      formCode: row.formCode,
      isActive: row.isActive,
      fields,
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
    const docTypeId = existing?.id ?? `doc-type-${prefix.toLowerCase()}`;
    const formCode = `${prefix}-FRM`;

    const entry: ApprovalMatrixEntry = {
      id: docTypeId,
      typeName,
      prefix,
      formType: form.formType,
      formCode,
      fieldsCount: form.fields.length,
      docCount: existing?.docCount ?? 0,
      isActive: existing?.isActive ?? form.isActive,
      steps: editingKey ? [...(matrix[editingKey]?.steps ?? [])] : [],
      fields: form.fields,
    };

    const nextMatrix = { ...matrix };
    if (editingKey && editingKey !== prefix && matrix[editingKey]) {
      delete nextMatrix[editingKey];
    }
    nextMatrix[prefix] = entry;
    onMatrixChange(nextMatrix);

    const matrixKey = editingKey ?? prefix;
    appendRunningConfig(matrixKey, entry);
    
    // Auto-cascade Workflow Config creation
    appendWorkflowRecord({
      id: docTypeId,
      typeName,
      prefix,
      isActive: entry.isActive,
      steps: entry.steps,
    });

    const nextDocTypes = [...docTypes];
    const idx = editingKey ? nextDocTypes.findIndex((d) => d.key === editingKey) : -1;
    const row: DocumentTypeRecord = {
      id: docTypeId,
      key: prefix,
      typeName: entry.typeName,
      prefix,
      formType: entry.formType,
      formCode: entry.formCode,
      fieldsCount: entry.fieldsCount,
      docCount: entry.docCount,
      isActive: entry.isActive,
      fields: entry.fields,
    };
    if (idx >= 0) nextDocTypes[idx] = row;
    else nextDocTypes.push(row);
    onDocTypesChange(nextDocTypes);

    setSaving(false);
    closeModal();

    if (editingKey) {
      showToast("แก้ไขประเภทเอกสารสำเร็จ", "success");
    } else {
      showToast(`สร้างประเภทเอกสาร ${typeName} สำเร็จ`, "success");
      onCreated(prefix, typeName);
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

  const mobileRows = useMemo(
    () =>
      docTypes.map((row) => ({
        id: row.key,
        title: row.typeName,
        badge: <StatusBadge active={row.isActive} />,
        fields: [
          { label: "Prefix", value: row.prefix },
          {
            label: "Form Type / ฟอร์ม",
            value: (
              <>
                <span className="inline-flex items-center gap-1.5">
                  {formTypeBadge(row.formType)}
                  <FormTypeTooltip formType={row.formType} />
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  {row.formCode} · {row.fieldsCount} ฟิลด์
                </p>
              </>
            ),
          },
          { label: "จำนวนเอกสารที่ใช้", value: row.docCount },
        ],
        actions: (
          <DeleteGuardActions
            row={row}
            onEdit={() => openEdit(row)}
            onDelete={() => handleDelete(row)}
          />
        ),
      })),
    [docTypes]
  );

  return (
    <div className="space-y-6">
      {modalOpen ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {editingKey ? "แก้ไข" : "เพิ่ม"}ประเภทเอกสาร
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ระบุรายละเอียดและปรับแต่งโครงสร้างฟิลด์ในแบบฟอร์มเอกสารได้อย่างอิสระ
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              aria-label="ปิด"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* TWO-COLUMN GRID FOR FORM GENERAL INFO & FIELDS CUSTOMIZATION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (5/12) - General Configuration */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ข้อมูลทั่วไป (General Info)</h4>
              
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">ชื่อประเภทเอกสาร</label>
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
                <label className="mb-1.5 block text-xs text-slate-500">Form Type (แพทเทิร์นเริ่มต้น)</label>
                <select
                  className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
                  value={form.formType}
                  disabled={!!editingKey}
                  onChange={(e) => {
                    const formType = e.target.value as FormTypeStyle;
                    setForm((f) => ({
                      ...f,
                      formType,
                      formCode: DEFAULT_FORM_META[formType].formCode,
                      fields: JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS[formType] || [])),
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

              {editingKey && (
                <StatusFormToggle
                  active={form.isActive}
                  onChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
                />
              )}
            </div>

            {/* Right Column (7/12) - Fields List Preview (Read-only) */}
            <div className="lg:col-span-7 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    โครงสร้างฟิลด์มาตรฐาน ({form.fields.length} ฟิลด์)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    * ฟิลด์มาตรฐานกำหนดตามประเภทฟอร์มเอกสารของระบบ (ไม่สามารถแก้ไขได้)
                  </p>
                </div>
              </div>

              {/* FIELDS LIST CONTAINER */}
              <div className="flex-1 max-h-[360px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/40 divide-y divide-slate-100">
                {form.fields.length === 0 ? (
                  <div className="py-12 text-center text-xs font-semibold text-slate-400">
                    ไม่มีข้อมูลฟิลด์
                  </div>
                ) : (
                  form.fields.map((field) => (
                    <div key={field.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      
                      <div className="flex items-center gap-2.5">
                        {/* Lock Icon */}
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400" title="ฟิลด์มาตรฐานระบบ">
                          <Lock className="size-3" />
                        </span>
                        
                        {/* Field Name */}
                        <span className="text-xs font-bold text-slate-700">
                          {field.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Field Type Badge */}
                        <span className="rounded bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {field.type}
                        </span>

                        {/* Is Required Badge */}
                        {field.isRequired ? (
                          <span className="rounded bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            จำเป็น
                          </span>
                        ) : (
                          <span className="rounded bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                            ไม่บังคับ
                          </span>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isValid}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-medium text-slate-800">ประเภทเอกสาร</h2>

          <MasterDataTableWrap
            empty={docTypes.length === 0}
            emptyContent={
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
            }
            mobile={<MasterDataMobileCardList rows={mobileRows} />}
          >
            <table className={MD_TABLE}>
              <thead className={MD_THEAD}>
                <tr>
                  <th className={MD_TH_STICKY}>ชื่อประเภทเอกสาร</th>
                  <th className={thCls}>Prefix</th>
                  <th className={thCls}>Form Type / ฟอร์ม</th>
                  <th className={MD_TH_RIGHT}>จำนวนเอกสารที่ใช้</th>
                  <th className={MD_TH_STATUS}>สถานะ</th>
                  <th className={MD_TH_ACTION}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {docTypes.map((row) => (
                  <tr
                    key={row.key}
                    className={`group ${MD_TR}`}
                  >
                    <td className={MD_TD_STICKY}>{row.typeName}</td>
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
                    <td className={MD_TD_STATUS}>
                      <StatusBadge active={row.isActive} />
                    </td>
                    <td className={MD_TD_ACTION}>
                      <DeleteGuardActions
                        row={row}
                        onEdit={() => openEdit(row)}
                        onDelete={() => handleDelete(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MasterDataTableWrap>

          {docTypes.length > 0 && (
            <StatCards
              total={stats.total}
              active={stats.active}
              inactive={stats.inactive}
              icon={FileType2}
            />
          )}
        </>
      )}
    </div>
  );
}
