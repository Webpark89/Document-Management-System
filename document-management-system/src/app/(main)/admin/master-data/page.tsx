"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileStack,
  GitBranch,
  Hash,
  Inbox,
  Loader2,
  PenLine,
  Plus,
  Stamp,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  countActivePositionsInDepartment,
  countUsersInDepartment,
  countUsersWithPosition,
  countWorkflowsUsingApprover,
  createInitialMasterTabData,
  formatApproverLabel,
  getApproverUsers,
  LEVEL_OPTIONS,
  type DepartmentRecord,
  type MasterDocumentTypeRecord,
  type PositionRecord,
  type SignatureRecord,
  type WorkflowRecord,
} from "@/lib/config-mock";
import DocumentRunningTab from "./DocumentRunningTab";
import WorkflowTab from "./WorkflowTab";
import { useSignatures } from "@/components/providers/SignatureProvider";
import {
  InactiveFilterCheckbox,
  MD_ADD_BTN,
  MD_SECTION,
  MD_SIDEBAR_NAV,
  MD_TD,
  MD_TD_ACTION,
  MD_TD_MUTED,
  MD_TD_NUM,
  MD_TD_NUM_RIGHT,
  MD_TD_STATUS,
  MD_TD_STICKY,
  MD_TH,
  MD_TH_ACTION,
  MD_TH_RIGHT,
  MD_TH_STATUS,
  MD_TH_STICKY,
  MD_TABLE,
  MasterDataLayout,
  MasterDataMobileCardList,
  MasterDataTableWrap,
  RowActions,
  StatCards,
  StatusBadge,
  StatusFormToggle,
} from "./master-data-ui";

type TabKey = "doctype" | "department" | "position" | "workflow" | "signature" | "running";
type DataTabKey = Exclude<TabKey, "running">;

interface DocTypeRow extends MasterDocumentTypeRecord {}
interface DepartmentRow extends DepartmentRecord {}
interface PositionRow extends PositionRecord {}
interface WorkflowRow extends WorkflowRecord {}
interface SignatureRow extends SignatureRecord {}

type TabData = {
  doctype: DocTypeRow[];
  department: DepartmentRow[];
  position: PositionRow[];
  workflow: WorkflowRow[];
  signature: SignatureRow[];
};

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "department", label: "แผนก", icon: Building2 },
  { key: "position", label: "ตำแหน่ง", icon: Stamp },
  { key: "workflow", label: "Workflow", icon: GitBranch },
  { key: "signature", label: "ลายเซ็น", icon: PenLine },
  { key: "running", label: "รูปแบบเลขที่เอกสาร", icon: Hash },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SEED = createInitialMasterTabData();

const APPROVER_USERS = getApproverUsers();

type FormState = {
  name: string;
  prefix: string;
  docCount: string;
  code: string;
  fieldsCount: string;
  employeeCount: string;
  level: string;
  department: string;
  levels: string;
  approverCount: string;
  approverName: string;
  position: string;
  signedCount: string;
  isActive: boolean;
  workflowApprovers: string[];
};

type FormErrors = Record<string, string>;

const PREFIX_RE = /^[A-Z0-9]{2,5}$/;
const DEPT_CODE_RE = /^[A-Z]{2,6}$/;

function syncApproverRows(levelCount: number, current: string[]): string[] {
  if (current.length === levelCount) return current;
  if (current.length > levelCount) return current.slice(0, levelCount);
  return [...current, ...Array(levelCount - current.length).fill("")];
}

function validateDoctypeName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกชื่อประเภทเอกสาร";
  if (trimmed.length < 2) return "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
  if (trimmed.length > 50) return "ชื่อต้องไม่เกิน 50 ตัวอักษร";
  return undefined;
}

function validateDoctypePrefix(
  prefix: string,
  rows: DocTypeRow[],
  editingId: string | null
): string | undefined {
  const normalized = prefix.trim().toUpperCase();
  if (!normalized) return "กรุณากรอก Prefix";
  if (!PREFIX_RE.test(normalized)) return "Prefix ต้องเป็นตัวอักษรหรือตัวเลข 2-5 ตัว";
  if (rows.some((r) => r.prefix.toUpperCase() === normalized && r.id !== editingId)) {
    return "รหัสนี้ถูกใช้งานแล้ว";
  }
  return undefined;
}

function validateDoctypeForm(
  form: FormState,
  rows: DocTypeRow[],
  editingId: string | null
): FormErrors {
  const errors: FormErrors = {};
  const nameError = validateDoctypeName(form.name);
  const prefixError = validateDoctypePrefix(form.prefix, rows, editingId);
  if (nameError) errors.name = nameError;
  if (prefixError) errors.prefix = prefixError;
  return errors;
}

function doctypeFormSnapshot(form: FormState) {
  return JSON.stringify({
    name: form.name,
    prefix: form.prefix,
    isActive: form.isActive,
  });
}

function modalFormSnapshot(form: FormState, tab: TabKey): string {
  switch (tab) {
    case "doctype":
      return doctypeFormSnapshot(form);
    case "department":
      return JSON.stringify({ name: form.name, code: form.code, isActive: form.isActive });
    case "position":
      return JSON.stringify({
        name: form.name,
        level: form.level,
        department: form.department,
        isActive: form.isActive,
      });
    case "workflow": {
      const levelCount = Number(form.levels) === 4 ? 4 : 3;
      return JSON.stringify({
        name: form.name,
        levels: form.levels,
        workflowApprovers: form.workflowApprovers.slice(0, levelCount),
        isActive: form.isActive,
      });
    }
    case "signature":
      return JSON.stringify({ approverName: form.approverName, isActive: form.isActive });
    default:
      return "";
  }
}

function validateDepartmentName(
  name: string,
  rows: DepartmentRow[],
  editingId: string | null
): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกชื่อแผนก";
  if (trimmed.length < 2) return "ชื่อแผนกต้องมีอย่างน้อย 2 ตัวอักษร";
  if (trimmed.length > 50) return "ชื่อแผนกต้องไม่เกิน 50 ตัวอักษร";
  if (rows.some((r) => r.name === trimmed && r.id !== editingId)) {
    return "ชื่อแผนกนี้ถูกใช้แล้ว";
  }
  return undefined;
}

function validateDepartmentCode(
  code: string,
  rows: DepartmentRow[],
  editingId: string | null
): string | undefined {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return "กรุณากรอกรหัส";
  if (!DEPT_CODE_RE.test(normalized)) return "รหัสต้องเป็นตัวพิมพ์ใหญ่ 2-6 ตัว";
  if (rows.some((r) => r.code.toUpperCase() === normalized && r.id !== editingId)) {
    return "รหัสนี้ถูกใช้งานแล้ว";
  }
  return undefined;
}

function validateDepartmentForm(
  form: FormState,
  rows: DepartmentRow[],
  editingId: string | null
): FormErrors {
  const errors: FormErrors = {};
  const nameError = validateDepartmentName(form.name, rows, editingId);
  const codeError = validateDepartmentCode(form.code, rows, editingId);
  if (nameError) errors.name = nameError;
  if (codeError) errors.code = codeError;
  return errors;
}

function validatePositionName(
  name: string,
  rows: PositionRow[],
  editingId: string | null
): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกชื่อตำแหน่ง";
  if (trimmed.length < 2) return "ชื่อตำแหน่งต้องมีอย่างน้อย 2 ตัวอักษร";
  if (rows.some((r) => r.name === trimmed && r.id !== editingId)) {
    return "ชื่อตำแหน่งนี้ถูกใช้แล้ว";
  }
  return undefined;
}

function validatePositionForm(form: FormState, rows: PositionRow[], editingId: string | null): FormErrors {
  const errors: FormErrors = {};
  const nameError = validatePositionName(form.name, rows, editingId);
  if (nameError) errors.name = nameError;
  if (!form.level) errors.level = "กรุณาเลือกระดับ";
  if (!form.department) errors.department = "กรุณาเลือกแผนก";
  return errors;
}

function validateWorkflowForm(
  form: FormState,
  rows: WorkflowRow[],
  editingId: string | null
): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  const levelCount = Number(form.levels) === 4 ? 4 : 3;

  if (!name) errors.name = "กรุณากรอกชื่อ Workflow";
  else if (name.length < 2) errors.name = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
  else if (rows.some((r) => r.name === name && r.id !== editingId)) {
    errors.name = "ชื่อ Workflow นี้ถูกใช้แล้ว";
  }

  const selected = form.workflowApprovers.slice(0, levelCount);
  selected.forEach((approver, idx) => {
    if (!approver) {
      errors[`approver_${idx}`] = "กรุณาเลือกผู้อนุมัติ";
      return;
    }
    if (selected.findIndex((a, i) => i !== idx && a === approver) !== -1) {
      errors[`approver_${idx}`] = "ผู้อนุมัติซ้ำ";
    }
  });

  return errors;
}

function validateSignatureForm(
  form: FormState,
  rows: SignatureRow[],
  editingId: string | null
): FormErrors {
  const errors: FormErrors = {};

  if (!form.approverName) errors.approverName = "กรุณาเลือกผู้อนุมัติ";
  else if (rows.some((r) => r.approverName === form.approverName && r.id !== editingId)) {
    errors.approverName = "ผู้อนุมัตินี้มีลายเซ็นในระบบแล้ว";
  }

  return errors;
}

const emptyForm = (): FormState => ({
  name: "",
  prefix: "",
  docCount: "0",
  code: "",
  fieldsCount: "0",
  employeeCount: "0",
  level: "L1",
  department: "",
  levels: "3",
  approverCount: "1",
  approverName: "",
  position: "",
  signedCount: "0",
  isActive: true,
  workflowApprovers: ["", "", ""],
});

function buildEmptyForm(departments: DepartmentRow[]): FormState {
  const base = emptyForm();
  const firstDept = departments.find((d) => d.isActive);
  return {
    ...base,
    department: firstDept?.name ?? "",
    workflowApprovers: syncApproverRows(3, []),
  };
}

function getDeleteGuard(
  tab: DataTabKey,
  row: TabData[DataTabKey][number],
  data: TabData
): { blocked: boolean; tooltip: string } {
  if (tab === "department") {
    const r = row as DepartmentRow;
    const n = Math.max(r.employeeCount, countUsersInDepartment(r.name));
    if (n > 0) {
      return {
        blocked: true,
        tooltip: `ไม่สามารถลบได้ เนื่องจากมีพนักงาน ${n} คนอยู่ในแผนกนี้ — กรุณาปิดใช้งานแทน`,
      };
    }
  }
  if (tab === "position") {
    const r = row as PositionRow;
    const n = countUsersWithPosition(r.name);
    if (n > 0) {
      return {
        blocked: true,
        tooltip: `ไม่สามารถลบได้ เนื่องจากมีพนักงาน ${n} คนใช้ตำแหน่งนี้อยู่ — กรุณาปิดใช้งานแทน`,
      };
    }
  }
  if (tab === "signature") {
    const r = row as SignatureRow;
    const n = countWorkflowsUsingApprover(r.approverName, data.workflow);
    if (n > 0) {
      return {
        blocked: true,
        tooltip: `ไม่สามารถลบได้ เนื่องจากถูกใช้ในสายอนุมัติ ${n} รายการ`,
      };
    }
  }
  return { blocked: false, tooltip: "ลบรายการ" };
}

export default function MasterDataPage() {
  return (
    <Suspense fallback={<div className="h-fit w-full bg-gray-50" />}>
      <MasterDataPageContent />
    </Suspense>
  );
}

function MasterDataPageContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { signatures } = useSignatures();
  const [activeTab, setActiveTab] = useState<TabKey>("department");
  const [data, setData] = useState<TabData>(SEED);
  const [showDeleted, setShowDeleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [modalBaseline, setModalBaseline] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const valid: TabKey[] = ["department", "position", "workflow", "signature", "running"];
    if (tab === "formtype") {
      setActiveTab("department");
    } else if (tab && valid.includes(tab as TabKey)) {
      setActiveTab(tab as TabKey);
    }
  }, [searchParams]);

  const rows = useMemo(() => {
    if (activeTab === "running") return [];
    const list =
      activeTab === "signature" ? signatures : data[activeTab as DataTabKey];
    return showDeleted ? list.filter((r) => !r.isActive) : list.filter((r) => r.isActive);
  }, [data, activeTab, showDeleted, signatures]);

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label ?? "Master Data";
  const tabStats = useMemo(() => {
    if (activeTab === "running") return { total: 0, active: 0, deleted: 0 };
    const list =
      activeTab === "signature" ? signatures : data[activeTab as DataTabKey];
    return {
      total: list.length,
      active: list.filter((r) => r.isActive).length,
      deleted: list.filter((r) => !r.isActive).length,
    };
  }, [data, activeTab, signatures]);

  const openAdd = () => {
    setEditingId(null);
    const nextForm = buildEmptyForm(data.department);
    setForm(nextForm);
    setFormErrors({});
    setModalBaseline(modalFormSnapshot(nextForm, activeTab));
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    const row = data[activeTab as DataTabKey].find((r) => r.id === id);
    if (!row) return;

    let nextForm: FormState;

    if (activeTab === "workflow") {
      const wf = row as WorkflowRow;
      nextForm = {
        name: wf.name,
        prefix: "",
        docCount: "0",
        code: "",
        fieldsCount: "0",
        employeeCount: "0",
        level: "L1",
        department: "",
        levels: String(wf.levels),
        approverCount: String(wf.approverCount),
        approverName: "",
        position: "",
        signedCount: "0",
        isActive: wf.isActive,
        workflowApprovers: syncApproverRows(wf.levels, [...wf.approvers]),
      };
    } else if (activeTab === "signature") {
      const sig = row as SignatureRow;
      nextForm = {
        name: "",
        prefix: "",
        docCount: "0",
        code: "",
        fieldsCount: "0",
        employeeCount: "0",
        level: "L1",
        department: "",
        levels: "3",
        approverCount: "1",
        approverName: sig.approverName,
        position: sig.position,
        signedCount: String(sig.signedCount),
        isActive: sig.isActive,
        workflowApprovers: ["", "", ""],
      };
    } else {
      nextForm = {
        name: "name" in row ? row.name : "",
        prefix: "prefix" in row ? row.prefix : "",
        docCount: "docCount" in row ? String(row.docCount) : "0",
        code: "code" in row ? row.code : "",
        fieldsCount: "fieldsCount" in row ? String(row.fieldsCount) : "0",
        employeeCount: "employeeCount" in row ? String(row.employeeCount) : "0",
        level: "level" in row ? row.level : "L1",
        department: "department" in row ? row.department : "",
        levels: "levels" in row ? String(row.levels) : "3",
        approverCount: "approverCount" in row ? String(row.approverCount) : "1",
        approverName: "approverName" in row ? row.approverName : "",
        position: "position" in row ? row.position : "",
        signedCount: "signedCount" in row ? String(row.signedCount) : "0",
        isActive: row.isActive,
        workflowApprovers: ["", "", ""],
      };
    }

    setForm(nextForm);
    setModalBaseline(modalFormSnapshot(nextForm, activeTab));
    setFormErrors({});
    setModalOpen(true);
  };

  const isModalDirty = useMemo(() => {
    if (!modalOpen) return false;
    return modalFormSnapshot(form, activeTab) !== modalBaseline;
  }, [modalOpen, form, activeTab, modalBaseline]);

  const isModalValid = useMemo(() => {
    switch (activeTab) {
      case "doctype":
        return Object.keys(validateDoctypeForm(form, data.doctype, editingId)).length === 0;
      case "department":
        return Object.keys(validateDepartmentForm(form, data.department, editingId)).length === 0;
      case "position":
        return Object.keys(validatePositionForm(form, data.position, editingId)).length === 0;
      case "workflow":
        return Object.keys(validateWorkflowForm(form, data.workflow, editingId)).length === 0;
      case "signature":
        return Object.keys(validateSignatureForm(form, data.signature, editingId)).length === 0;
      default:
        return true;
    }
  }, [activeTab, form, data, editingId]);

  const closeModal = () => {
    if (isModalDirty) {
      if (!confirm("ยังไม่ได้บันทึกข้อมูล ต้องการปิดหน้าต่างนี้หรือไม่?")) return;
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(buildEmptyForm(data.department));
    setFormErrors({});
    setModalBaseline("");
  };

  const validateCurrentTab = (): FormErrors => {
    switch (activeTab) {
      case "doctype":
        return validateDoctypeForm(form, data.doctype, editingId);
      case "department":
        return validateDepartmentForm(form, data.department, editingId);
      case "position":
        return validatePositionForm(form, data.position, editingId);
      case "workflow":
        return validateWorkflowForm(form, data.workflow, editingId);
      case "signature":
        return validateSignatureForm(form, data.signature, editingId);
      default:
        return {};
    }
  };

  const handleSave = async () => {
    const errors = validateCurrentTab();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const wasEditing = !!editingId;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const id = editingId ?? uid();

    setData((prev) => {
      switch (activeTab) {
        case "doctype": {
          const list = [...prev.doctype];
          const idx = list.findIndex((r) => r.id === id);
          const row: DocTypeRow = {
            id,
            name: form.name.trim(),
            prefix: form.prefix.trim().toUpperCase(),
            docCount: idx >= 0 ? list[idx].docCount : 0,
            isActive: form.isActive,
          };
          if (idx >= 0) list[idx] = row;
          else list.push(row);
          return { ...prev, doctype: list };
        }
        case "department": {
          const list = [...prev.department];
          const idx = list.findIndex((r) => r.id === id);
          const row: DepartmentRow = {
            id,
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            employeeCount: idx >= 0 ? list[idx].employeeCount : 0,
            isActive: form.isActive,
          };
          if (idx >= 0) list[idx] = row;
          else list.push(row);
          return { ...prev, department: list };
        }
        case "position": {
          const list = [...prev.position];
          const idx = list.findIndex((r) => r.id === id);
          const row: PositionRow = {
            id,
            name: form.name.trim(),
            level: form.level,
            department: form.department,
            isActive: form.isActive,
          };
          if (idx >= 0) list[idx] = row;
          else list.push(row);
          return { ...prev, position: list };
        }
        case "workflow": {
          const list = [...prev.workflow];
          const idx = list.findIndex((r) => r.id === id);
          const levels = (Number(form.levels) === 4 ? 4 : 3) as 3 | 4;
          const approvers = form.workflowApprovers.slice(0, levels);
          const row: WorkflowRow = {
            id,
            name: form.name.trim(),
            levels,
            approverCount: approvers.length,
            approvers,
            isActive: form.isActive,
          };
          if (idx >= 0) list[idx] = row;
          else list.push(row);
          return { ...prev, workflow: list };
        }
        case "signature": {
          const list = [...prev.signature];
          const idx = list.findIndex((r) => r.id === id);
          const row: SignatureRow = {
            id,
            approverName: form.approverName,
            position: form.position,
            signedCount: idx >= 0 ? list[idx].signedCount : 0,
            isActive: form.isActive,
          };
          if (idx >= 0) list[idx] = row;
          else list.push(row);
          return { ...prev, signature: list };
        }
        default:
          return prev;
      }
    });

    setSaving(false);
    setModalOpen(false);
    setEditingId(null);
    setForm(buildEmptyForm(data.department));
    setFormErrors({});
    setModalBaseline("");
    showToast(
      wasEditing ? `แก้ไข${tabLabel}สำเร็จ` : `เพิ่ม${tabLabel}สำเร็จ`,
      "success"
    );
  };

  const softDelete = (id: string) => {
    if (activeTab === "running") return;
    const row = data[activeTab as DataTabKey].find((r) => r.id === id);
    if (!row) return;
    const guard = getDeleteGuard(activeTab as DataTabKey, row, data);
    if (guard.blocked) return;
    if (!confirm("ยืนยันการลบรายการนี้?")) return;
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab as DataTabKey].map((r) => (r.id === id ? { ...r, isActive: false } : r)),
    }));
    showToast("ลบข้อมูลสำเร็จ", "success");
  };

  const restore = (id: string) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab as DataTabKey].map((r) => (r.id === id ? { ...r, isActive: true } : r)),
    }));
    showToast("กู้คืนข้อมูลสำเร็จ", "success");
  };

  const signatureGuardData = useMemo(
    () => ({ ...data, signature: signatures }),
    [data, signatures]
  );

  const mobileRows = useMemo(() => {
    if (activeTab === "running" || activeTab === "workflow") return [];

    return rows.map((row) => {
      const guard = getDeleteGuard(activeTab as DataTabKey, row, signatureGuardData);
      const actions =
        activeTab === "signature" ? undefined : row.isActive ? (
        <RowActions
          onEdit={() => openEdit(row.id)}
          onDelete={() => softDelete(row.id)}
          deleteBlocked={guard.blocked}
          deleteTooltip={guard.tooltip}
        />
      ) : (
        <RowActions onRestore={() => restore(row.id)} />
      );

      switch (activeTab) {
        case "doctype": {
          const r = row as DocTypeRow;
          return {
            id: r.id,
            title: r.name,
            badge: <StatusBadge active={r.isActive} />,
            fields: [
              { label: "Prefix", value: r.prefix },
              { label: "จำนวนเอกสาร", value: r.docCount },
            ],
            actions,
          };
        }
        case "department": {
          const r = row as DepartmentRow;
          return {
            id: r.id,
            title: r.name,
            badge: <StatusBadge active={r.isActive} />,
            fields: [
              { label: "รหัส", value: r.code },
              { label: "จำนวนพนักงาน", value: r.employeeCount },
            ],
            actions,
          };
        }
        case "position": {
          const r = row as PositionRow;
          return {
            id: r.id,
            title: r.name,
            badge: <StatusBadge active={r.isActive} />,
            fields: [
              { label: "ระดับ", value: r.level },
              { label: "แผนก", value: r.department },
            ],
            actions,
          };
        }
        default: {
          const r = row as SignatureRow;
          return {
            id: r.id,
            title: r.approverName,
            badge: <StatusBadge active={r.isActive} />,
            fields: [
              { label: "ตำแหน่ง", value: r.position },
              { label: "จำนวนลงนาม", value: r.signedCount },
            ],
            actions,
          };
        }
      }
    });
  }, [rows, activeTab, signatureGuardData]);

  const inputCls =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const thCls = MD_TH;
  const thSticky = MD_TH_STICKY;
  const thRight = MD_TH_RIGHT;
  const thAction = MD_TH_ACTION;
  const tdCls = MD_TD;
  const tdSticky = MD_TD_STICKY;
  const tdMuted = MD_TD_MUTED;
  const tdNum = MD_TD_NUM_RIGHT;

  const renderCells = (row: TabData[DataTabKey][number]) => {
    switch (activeTab) {
      case "doctype": {
        const r = row as DocTypeRow;
        return (
          <>
            <td className={tdSticky}>{r.name}</td>
            <td className={tdMuted}>{r.prefix}</td>
            <td className={tdNum}>{r.docCount}</td>
          </>
        );
      }
      case "department": {
        const r = row as DepartmentRow;
        return (
          <>
            <td className={tdSticky}>{r.name}</td>
            <td className={tdMuted}>{r.code}</td>
            <td className={tdNum}>{r.employeeCount}</td>
          </>
        );
      }
      case "position": {
        const r = row as PositionRow;
        return (
          <>
            <td className={tdSticky}>{r.name}</td>
            <td className={tdMuted}>{r.level}</td>
            <td className={tdMuted}>{r.department}</td>
          </>
        );
      }
      case "workflow": {
        const r = row as WorkflowRow;
        return (
          <>
            <td className={tdSticky}>{r.name}</td>
            <td className={MD_TD_NUM}>{r.levels}</td>
            <td className={tdNum}>{r.approverCount}</td>
          </>
        );
      }
      default: {
        const r = row as SignatureRow;
        return (
          <>
            <td className={tdSticky}>{r.approverName}</td>
            <td className={tdMuted}>{r.position}</td>
            <td className={tdNum}>{r.signedCount}</td>
          </>
        );
      }
    }
  };

  const renderHeaders = () => {
    switch (activeTab) {
      case "doctype":
        return (
          <>
            <th className={thSticky}>ชื่อ</th>
            <th className={thCls}>Prefix</th>
            <th className={thRight}>จำนวนเอกสาร</th>
          </>
        );
      case "department":
        return (
          <>
            <th className={thSticky}>ชื่อแผนก</th>
            <th className={thCls}>รหัส</th>
            <th className={thRight}>จำนวนพนักงาน</th>
          </>
        );
      case "position":
        return (
          <>
            <th className={thSticky}>ชื่อตำแหน่ง</th>
            <th className={thCls}>ระดับ</th>
            <th className={thCls}>แผนก</th>
          </>
        );
      case "workflow":
        return (
          <>
            <th className={thSticky}>ชื่อ Workflow</th>
            <th className={`${thCls} text-center`}>จำนวน Level</th>
            <th className={thRight}>ผู้อนุมัติ</th>
          </>
        );
      default:
        return (
          <>
            <th className={thSticky}>ชื่อผู้อนุมัติ</th>
            <th className={thCls}>ตำแหน่ง</th>
            <th className={thRight}>จำนวนลงนาม</th>
          </>
        );
    }
  };

  const inputErrorCls =
    "w-full rounded-md border border-red-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

  const activeDepartments = useMemo(
    () => data.department.filter((d) => d.isActive),
    [data.department]
  );

  const setFieldError = (key: string, err: string | undefined) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      if (err) next[key] = err;
      else delete next[key];
      return next;
    });
  };

  const clearError = (key: string) => {
    if (formErrors[key]) {
      setFormErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  };

  const renderStatusToggle = () => (
    <StatusFormToggle active={form.isActive} onChange={(isActive) => setForm((f) => ({ ...f, isActive }))} />
  );

  const renderReadOnlyCount = (label: string, value: string, hint: string) => (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-slate-500">{label}</label>
      <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-500">
        {value}
      </div>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );

  const renderFormFields = () => {
    if (activeTab === "doctype") {
      const prefixPreview = form.prefix.trim().toUpperCase() || "XX";
      return (
        <>
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">ชื่อ</label>
            <div className="relative">
              <input
                type="text"
                value={form.name}
                maxLength={50}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  setForm((f) => ({ ...f, name: value }));
                  if (formErrors.name) {
                    const err = validateDoctypeName(value);
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      if (err) next.name = err;
                      else delete next.name;
                      return next;
                    });
                  }
                }}
                onBlur={() => {
                  const err = validateDoctypeName(form.name);
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    if (err) next.name = err;
                    else delete next.name;
                    return next;
                  });
                }}
                className={`${formErrors.name ? inputErrorCls : inputCls} pr-14`}
              />
              <span className="pointer-events-none absolute bottom-2 right-2 text-xs text-slate-400">
                {form.name.length}/50
              </span>
            </div>
            {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">Prefix</label>
            <input
              type="text"
              value={form.prefix}
              maxLength={5}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
                setForm((f) => ({ ...f, prefix: value }));
                if (formErrors.prefix) {
                  const err = validateDoctypePrefix(value, data.doctype, editingId);
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    if (err) next.prefix = err;
                    else delete next.prefix;
                    return next;
                  });
                }
              }}
              onBlur={() => {
                const err = validateDoctypePrefix(form.prefix, data.doctype, editingId);
                setFormErrors((prev) => {
                  const next = { ...prev };
                  if (err) next.prefix = err;
                  else delete next.prefix;
                  return next;
                });
              }}
              className={formErrors.prefix ? inputErrorCls : inputCls}
            />
            <p className="mt-1 text-xs text-slate-400">
              ตัวอย่าง: {prefixPreview}-2569-0001
            </p>
            {formErrors.prefix && <p className="mt-1 text-xs text-red-500">{formErrors.prefix}</p>}
          </div>
          {editingId && renderReadOnlyCount("จำนวนเอกสาร", form.docCount, "นับอัตโนมัติจากเอกสารที่ใช้ประเภทนี้")}
          {renderStatusToggle()}
        </>
      );
    }
    if (activeTab === "department") {
      return (
        <>
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">ชื่อแผนก</label>
            <div className="relative">
              <input
                type="text"
                value={form.name}
                maxLength={50}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  setForm((f) => ({ ...f, name: value }));
                  if (formErrors.name) {
                    setFieldError("name", validateDepartmentName(value, data.department, editingId));
                  }
                }}
                onBlur={() =>
                  setFieldError("name", validateDepartmentName(form.name, data.department, editingId))
                }
                className={`${formErrors.name ? inputErrorCls : inputCls} pr-14`}
              />
              <span className="pointer-events-none absolute bottom-2 right-2 text-xs text-slate-400">
                {form.name.length}/50
              </span>
            </div>
            {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">รหัส</label>
            <input
              type="text"
              value={form.code}
              maxLength={6}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
                setForm((f) => ({ ...f, code: value }));
                if (formErrors.code) {
                  setFieldError("code", validateDepartmentCode(value, data.department, editingId));
                }
              }}
              onBlur={() =>
                setFieldError("code", validateDepartmentCode(form.code, data.department, editingId))
              }
              className={formErrors.code ? inputErrorCls : inputCls}
            />
            {formErrors.code && <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>}
          </div>
          {editingId && renderReadOnlyCount("จำนวนพนักงาน", form.employeeCount, "นับอัตโนมัติจากพนักงานในแผนก")}
          {renderStatusToggle()}
        </>
      );
    }
    if (activeTab === "position") {
      return (
        <>
          <Field
            label="ชื่อตำแหน่ง"
            value={form.name}
            onChange={(v) => {
              setForm((f) => ({ ...f, name: v }));
              if (formErrors.name) {
                setFieldError("name", validatePositionName(v, data.position, editingId));
              }
            }}
            onBlur={() =>
              setFieldError("name", validatePositionName(form.name, data.position, editingId))
            }
            inputClassName={formErrors.name ? inputErrorCls : inputCls}
            error={formErrors.name}
          />
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">ระดับ</label>
            <select
              className={formErrors.level ? inputErrorCls : inputCls}
              value={form.level}
              onChange={(e) => {
                setForm((f) => ({ ...f, level: e.target.value }));
                clearError("level");
              }}
              onBlur={() => {
                if (!form.level) setFieldError("level", "กรุณาเลือกระดับ");
              }}
            >
              {LEVEL_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
            {formErrors.level && <p className="mt-1 text-xs text-red-500">{formErrors.level}</p>}
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">แผนก</label>
            <select
              className={formErrors.department ? inputErrorCls : inputCls}
              value={form.department}
              onChange={(e) => {
                setForm((f) => ({ ...f, department: e.target.value }));
                clearError("department");
              }}
              onBlur={() => {
                if (!form.department) setFieldError("department", "กรุณาเลือกแผนก");
              }}
            >
              <option value="">เลือกแผนก</option>
              {activeDepartments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            {formErrors.department && <p className="mt-1 text-xs text-red-500">{formErrors.department}</p>}
          </div>
          {renderStatusToggle()}
        </>
      );
    }
    if (activeTab === "workflow") {
      const levelCount = Number(form.levels) === 4 ? 4 : 3;
      const syncApproverErrors = (approvers: string[]) => {
        const selected = approvers.slice(0, levelCount);
        const nextErrors = { ...formErrors };
        for (let i = 0; i < levelCount; i += 1) {
          delete nextErrors[`approver_${i}`];
        }
        selected.forEach((approver, idx) => {
          if (!approver) nextErrors[`approver_${idx}`] = "กรุณาเลือกผู้อนุมัติ";
          else if (selected.findIndex((a, i) => i !== idx && a === approver) !== -1) {
            nextErrors[`approver_${idx}`] = "ผู้อนุมัติซ้ำ";
          }
        });
        setFormErrors(nextErrors);
      };

      return (
        <>
          <Field
            label="ชื่อ Workflow"
            value={form.name}
            onChange={(v) => {
              setForm((f) => ({ ...f, name: v }));
              if (formErrors.name) {
                const err = validateWorkflowForm(
                  { ...form, name: v },
                  data.workflow,
                  editingId
                ).name;
                setFieldError("name", err);
              }
            }}
            onBlur={() => {
              setFieldError(
                "name",
                validateWorkflowForm(form, data.workflow, editingId).name
              );
            }}
            inputClassName={formErrors.name ? inputErrorCls : inputCls}
            error={formErrors.name}
          />
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">จำนวน Level</label>
            <select
              className={inputCls}
              value={form.levels}
              onChange={(e) => {
                const levels = e.target.value;
                const nextApprovers = syncApproverRows(Number(levels), form.workflowApprovers);
                setForm((f) => ({
                  ...f,
                  levels,
                  workflowApprovers: nextApprovers,
                }));
                syncApproverErrors(nextApprovers);
              }}
            >
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">ผู้อนุมัติ</label>
            <div className="space-y-2">
              {form.workflowApprovers.slice(0, levelCount).map((approver, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-xs font-medium text-slate-400">{idx + 1}</span>
                    <select
                      className={formErrors[`approver_${idx}`] ? inputErrorCls : inputCls}
                      value={approver}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((f) => {
                          const next = [...f.workflowApprovers];
                          next[idx] = value;
                          syncApproverErrors(next);
                          return { ...f, workflowApprovers: next };
                        });
                      }}
                      onBlur={() => syncApproverErrors(form.workflowApprovers)}
                    >
                      <option value="">เลือกผู้อนุมัติ</option>
                      {APPROVER_USERS.map((user) => (
                        <option key={user.name} value={user.name}>
                          {formatApproverLabel(user)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formErrors[`approver_${idx}`] && (
                    <p className="ml-10 mt-1 text-xs text-red-500">{formErrors[`approver_${idx}`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {renderReadOnlyCount("จำนวนผู้อนุมัติ", String(levelCount), "อัปเดตอัตโนมัติตามจำนวน Level")}
          {renderStatusToggle()}
        </>
      );
    }
    return (
      <>
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-slate-500">ชื่อผู้อนุมัติ</label>
          <select
            className={formErrors.approverName ? inputErrorCls : inputCls}
            value={form.approverName}
            onChange={(e) => {
              const name = e.target.value;
              const user = APPROVER_USERS.find((u) => u.name === name);
              setForm((f) => ({
                ...f,
                approverName: name,
                position: user?.position ?? "",
              }));
              if (formErrors.approverName) {
                setFieldError(
                  "approverName",
                  validateSignatureForm(
                    { ...form, approverName: name, position: user?.position ?? "" },
                    data.signature,
                    editingId
                  ).approverName
                );
              }
            }}
            onBlur={() =>
              setFieldError(
                "approverName",
                validateSignatureForm(form, data.signature, editingId).approverName
              )
            }
          >
            <option value="">เลือกผู้อนุมัติ</option>
            {APPROVER_USERS.map((user) => (
              <option key={user.name} value={user.name}>
                {formatApproverLabel(user)}
              </option>
            ))}
          </select>
          {formErrors.approverName && <p className="mt-1 text-xs text-red-500">{formErrors.approverName}</p>}
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-slate-500">ตำแหน่ง</label>
          <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-500">
            {form.position || "—"}
          </div>
        </div>
        {editingId && renderReadOnlyCount("จำนวนลงนาม", form.signedCount, "นับอัตโนมัติจากการใช้ลายเซ็น")}
        {renderStatusToggle()}
      </>
    );
  };

  const TabIcon = TABS.find((t) => t.key === activeTab)?.icon ?? Building2;

  return (
    <>
    <MasterDataLayout
      breadcrumb={
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <span className="text-slate-500">Master Data</span>
          <span>/</span>
          <span className="font-medium text-slate-600">{tabLabel}</span>
        </nav>
      }
      title="Master Data"
      subtitle="In-memory demo — resets on refresh"
      actions={
        activeTab === "running" || activeTab === "signature" ? undefined : (
          <button type="button" onClick={openAdd} className={MD_ADD_BTN}>
            <Plus className="size-4" />
            เพิ่ม
          </button>
        )
      }
      sidebar={
        <nav className={MD_SIDEBAR_NAV}>
          <Link
            href="/admin/master-data/doc-forms"
            className="flex w-full items-center gap-2 rounded-md border-l-2 border-transparent px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-gray-50 hover:text-slate-800"
          >
            <FileStack className="size-4 shrink-0" />
            จัดการฟอร์มเอกสาร
          </Link>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex w-full items-center gap-2 rounded-md border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                activeTab === key
                  ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                  : "border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-800"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      }
    >
      <section className={MD_SECTION}>
          {activeTab === "running" ? (
            <DocumentRunningTab showToast={showToast} />
          ) : activeTab === "workflow" ? (
            <WorkflowTab
              rows={rows as WorkflowRow[]}
              showDeleted={showDeleted}
              onShowDeletedChange={setShowDeleted}
              stats={tabStats}
              onEdit={openEdit}
              onDelete={softDelete}
              onRestore={restore}
            />
          ) : (
            <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-slate-800">{tabLabel}</h2>
            <InactiveFilterCheckbox checked={showDeleted} onChange={setShowDeleted} />
          </div>

          <MasterDataTableWrap
            empty={rows.length === 0}
            emptyContent={
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <Inbox className="size-10 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {showDeleted ? "ไม่มีรายการที่ปิดใช้งาน" : "ไม่มีข้อมูล"}
                </p>
                <p className="text-xs text-slate-400">
                  {showDeleted
                    ? "รายการที่กู้คืนจะแสดงในรายการปกติ"
                    : activeTab === "signature"
                      ? "เพิ่มลายเซ็นได้ที่หน้าโปรไฟล์"
                      : "กดปุ่ม เพิ่ม เพื่อสร้างรายการใหม่"}
                </p>
              </div>
            }
            mobile={<MasterDataMobileCardList rows={mobileRows} />}
          >
            <table className={MD_TABLE}>
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  {renderHeaders()}
                  <th className={MD_TH_STATUS}>สถานะ</th>
                  {activeTab !== "signature" ? <th className={thAction}>จัดการ</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-gray-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                  >
                    {renderCells(row)}
                    <td className={MD_TD_STATUS}>
                      <StatusBadge active={row.isActive} />
                    </td>
                    {activeTab !== "signature" ? (
                      <td className={MD_TD_ACTION}>
                        {row.isActive ? (
                          (() => {
                            const guard = getDeleteGuard(
                              activeTab as DataTabKey,
                              row,
                              signatureGuardData
                            );
                            return (
                              <RowActions
                                onEdit={() => openEdit(row.id)}
                                onDelete={() => softDelete(row.id)}
                                deleteBlocked={guard.blocked}
                                deleteTooltip={guard.tooltip}
                              />
                            );
                          })()
                        ) : (
                          <RowActions onRestore={() => restore(row.id)} />
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </MasterDataTableWrap>

          <StatCards
            total={tabStats.total}
            active={tabStats.active}
            inactive={tabStats.deleted}
            icon={TabIcon}
          />
            </>
          )}
        </section>
    </MasterDataLayout>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
          onClick={closeModal}
        >
          <div
            className={`relative w-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${activeTab === "workflow" ? "max-w-lg" : "max-w-md"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-medium text-slate-800">
                {editingId ? "แก้ไข" : "เพิ่ม"} {tabLabel}
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
            <div className="mt-4 space-y-3">{renderFormFields()}</div>
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
                disabled={saving || !isModalValid}
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputClassName,
  error,
  maxLength,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputClassName?: string;
  error?: string;
  maxLength?: number;
  onBlur?: () => void;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-slate-500">{label}</label>
      <input
        type={type}
        className={
          inputClassName ??
          "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        }
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
