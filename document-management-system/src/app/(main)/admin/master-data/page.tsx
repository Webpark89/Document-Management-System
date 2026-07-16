"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileType2,
  FormInput,
  GitBranch,
  Inbox,
  Layers,
  Loader2,
  PenLine,
  Plus,
  Stamp,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

type TabKey = "doctype" | "formtype" | "department" | "position" | "workflow" | "signature";

interface DocTypeRow {
  id: string;
  name: string;
  prefix: string;
  docCount: number;
  isActive: boolean;
}

interface FormTypeRow {
  id: string;
  name: string;
  code: string;
  fieldsCount: number;
  isActive: boolean;
}

interface DepartmentRow {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  isActive: boolean;
}

interface PositionRow {
  id: string;
  name: string;
  level: string;
  department: string;
  isActive: boolean;
}

interface WorkflowRow {
  id: string;
  name: string;
  levels: 3 | 4;
  approverCount: number;
  approvers: string[];
  isActive: boolean;
}

interface SignatureRow {
  id: string;
  approverName: string;
  position: string;
  signedCount: number;
  isActive: boolean;
}

type TabData = {
  doctype: DocTypeRow[];
  formtype: FormTypeRow[];
  department: DepartmentRow[];
  position: PositionRow[];
  workflow: WorkflowRow[];
  signature: SignatureRow[];
};

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "doctype", label: "ประเภทเอกสาร", icon: FileType2 },
  { key: "formtype", label: "ประเภทฟอร์ม", icon: FormInput },
  { key: "department", label: "แผนก", icon: Building2 },
  { key: "position", label: "ตำแหน่ง", icon: Stamp },
  { key: "workflow", label: "Workflow", icon: GitBranch },
  { key: "signature", label: "ลายเซ็น", icon: PenLine },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SEED: TabData = {
  doctype: [
    { id: "1", name: "ใบขอซื้อ (PR)", prefix: "PR", docCount: 24, isActive: true },
    { id: "2", name: "ใบสั่งซื้อ (PO)", prefix: "PO", docCount: 18, isActive: true },
    { id: "3", name: "ใบรับรอง", prefix: "CERT", docCount: 5, isActive: true },
  ],
  formtype: [
    { id: "1", name: "ฟอร์ม PR", code: "PR-FRM", fieldsCount: 12, isActive: true },
    { id: "2", name: "ฟอร์ม PO", code: "PO-FRM", fieldsCount: 15, isActive: true },
    { id: "3", name: "ฟอร์มใบรับรอง", code: "CERT-FRM", fieldsCount: 8, isActive: true },
  ],
  department: [
    { id: "1", name: "แผนกจัดซื้อ", code: "PROC", employeeCount: 12, isActive: true },
    { id: "2", name: "แผนกบัญชี", code: "ACC", employeeCount: 8, isActive: true },
    { id: "3", name: "แผนกคลังสินค้า", code: "WH", employeeCount: 15, isActive: true },
    { id: "4", name: "แผนก IT", code: "IT", employeeCount: 6, isActive: true },
  ],
  position: [
    { id: "1", name: "ผู้จัดการ", level: "L3", department: "แผนกจัดซื้อ", isActive: true },
    { id: "2", name: "เจ้าหน้าที่", level: "L1", department: "แผนกบัญชี", isActive: true },
    { id: "3", name: "หัวหน้าแผนก", level: "L2", department: "แผนกคลังสินค้า", isActive: true },
  ],
  workflow: [
    {
      id: "1",
      name: "อนุมัติ PR",
      levels: 3,
      approverCount: 3,
      approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข"],
      isActive: true,
    },
    {
      id: "2",
      name: "อนุมัติ PO",
      levels: 4,
      approverCount: 4,
      approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข", "นภา สุขใจ"],
      isActive: true,
    },
    {
      id: "3",
      name: "อนุมัติใบรับรอง",
      levels: 3,
      approverCount: 3,
      approvers: ["สมชาย ใจดี", "วิภา รักดี", "ประเสริฐ มีสุข"],
      isActive: true,
    },
  ],
  signature: [
    { id: "1", approverName: "สมชาย ใจดี", position: "ผู้จัดการแผนกจัดซื้อ", signedCount: 42, isActive: true },
    { id: "2", approverName: "วิภา รักดี", position: "หัวหน้าแผนกบัญชี", signedCount: 28, isActive: true },
    { id: "3", approverName: "ประเสริฐ มีสุข", position: "ผู้อำนวยการ", signedCount: 15, isActive: true },
  ],
};

const MOCK_APPROVERS = [
  { name: "สมชาย ใจดี", position: "ผู้จัดการแผนกจัดซื้อ" },
  { name: "วิภา รักดี", position: "หัวหน้าแผนกบัญชี" },
  { name: "ประเสริฐ มีสุข", position: "ผู้อำนวยการ" },
  { name: "นภา สุขใจ", position: "เจ้าหน้าที่แผนก IT" },
] as const;

const LEVEL_OPTIONS = ["L1", "L2", "L3", "L4", "Executive"] as const;

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
const FORM_CODE_RE = /^[A-Z0-9]+(-[A-Z0-9]+)+$/;
const DEPT_CODE_RE = /^[A-Z0-9]{2,10}$/;

function syncApproverRows(levelCount: number, current: string[]): string[] {
  if (current.length === levelCount) return current;
  if (current.length > levelCount) return current.slice(0, levelCount);
  return [...current, ...Array(levelCount - current.length).fill("")];
}

function validateDoctypeForm(
  form: FormState,
  rows: DocTypeRow[],
  editingId: string | null
): Partial<Record<"name" | "prefix", string>> {
  const errors: Partial<Record<"name" | "prefix", string>> = {};
  const name = form.name.trim();
  const prefix = form.prefix.trim().toUpperCase();

  if (!name) errors.name = "กรุณากรอกชื่อ";
  else if (name.length < 2) errors.name = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";

  if (!prefix) errors.prefix = "กรุณากรอก Prefix";
  else if (!PREFIX_RE.test(prefix)) errors.prefix = "Prefix ต้องเป็นตัวอักษรหรือตัวเลข 2-5 ตัว";
  else if (rows.some((r) => r.prefix.toUpperCase() === prefix && r.id !== editingId)) {
    errors.prefix = "Prefix นี้ถูกใช้แล้ว";
  }

  return errors;
}

function validateFormtypeForm(
  form: FormState,
  rows: FormTypeRow[],
  editingId: string | null
): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  const code = form.code.trim().toUpperCase();

  if (!name) errors.name = "กรุณากรอกชื่อ";
  else if (name.length < 2) errors.name = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";

  if (!code) errors.code = "กรุณากรอกรหัส";
  else if (!FORM_CODE_RE.test(code)) errors.code = "รูปแบบรหัสต้องเป็นตัวพิมพ์ใหญ่คั่นด้วย - เช่น PR-FRM";
  else if (rows.some((r) => r.code.toUpperCase() === code && r.id !== editingId)) {
    errors.code = "รหัสนี้ถูกใช้แล้ว";
  }

  return errors;
}

function validateDepartmentForm(
  form: FormState,
  rows: DepartmentRow[],
  editingId: string | null
): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  const code = form.code.trim().toUpperCase();

  if (!name) errors.name = "กรุณากรอกชื่อแผนก";
  else if (name.length < 2) errors.name = "ชื่อแผนกต้องมีอย่างน้อย 2 ตัวอักษร";

  if (!code) errors.code = "กรุณากรอกรหัส";
  else if (!DEPT_CODE_RE.test(code)) errors.code = "รหัสต้องเป็นตัวพิมพ์ใหญ่หรือตัวเลข 2-10 ตัว";
  else if (rows.some((r) => r.code.toUpperCase() === code && r.id !== editingId)) {
    errors.code = "รหัสนี้ถูกใช้แล้ว";
  }

  return errors;
}

function validatePositionForm(form: FormState, rows: PositionRow[], editingId: string | null): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();

  if (!name) errors.name = "กรุณากรอกชื่อตำแหน่ง";
  else if (name.length < 2) errors.name = "ชื่อตำแหน่งต้องมีอย่างน้อย 2 ตัวอักษร";
  else if (rows.some((r) => r.name === name && r.id !== editingId)) {
    errors.name = "ชื่อตำแหน่งนี้ถูกใช้แล้ว";
  }

  if (!form.level) errors.level = "กรุณาเลือกระดับ";
  if (!form.department) errors.department = "กรุณาเลือกแผนก";

  return errors;
}

function validateWorkflowForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  const levelCount = Number(form.levels) === 4 ? 4 : 3;

  if (!name) errors.name = "กรุณากรอกชื่อ Workflow";
  else if (name.length < 2) errors.name = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";

  form.workflowApprovers.slice(0, levelCount).forEach((approver, idx) => {
    if (!approver) errors[`approver_${idx}`] = "กรุณาเลือกผู้อนุมัติ";
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

export default function MasterDataPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("doctype");
  const [data, setData] = useState<TabData>(SEED);
  const [showDeleted, setShowDeleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const list = data[activeTab];
    return showDeleted ? list.filter((r) => !r.isActive) : list.filter((r) => r.isActive);
  }, [data, activeTab, showDeleted]);

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label ?? "Master Data";
  const tabStats = useMemo(() => {
    const list = data[activeTab];
    return {
      total: list.length,
      active: list.filter((r) => r.isActive).length,
      deleted: list.filter((r) => !r.isActive).length,
    };
  }, [data, activeTab]);

  const openAdd = () => {
    setEditingId(null);
    setForm(buildEmptyForm(data.department));
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    const row = data[activeTab].find((r) => r.id === id);
    if (!row) return;

    if (activeTab === "workflow") {
      const wf = row as WorkflowRow;
      setForm({
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
      });
    } else if (activeTab === "signature") {
      const sig = row as SignatureRow;
      setForm({
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
      });
    } else {
      setForm({
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
      });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const validateCurrentTab = (): FormErrors => {
    switch (activeTab) {
      case "doctype":
        return validateDoctypeForm(form, data.doctype, editingId);
      case "formtype":
        return validateFormtypeForm(form, data.formtype, editingId);
      case "department":
        return validateDepartmentForm(form, data.department, editingId);
      case "position":
        return validatePositionForm(form, data.position, editingId);
      case "workflow":
        return validateWorkflowForm(form);
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
        case "formtype": {
          const list = [...prev.formtype];
          const idx = list.findIndex((r) => r.id === id);
          const row: FormTypeRow = {
            id,
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            fieldsCount: idx >= 0 ? list[idx].fieldsCount : 0,
            isActive: form.isActive,
          };
          if (idx >= 0) list[idx] = row;
          else list.push(row);
          return { ...prev, formtype: list };
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
      }
    });

    setSaving(false);
    setModalOpen(false);
    setEditingId(null);
    setForm(buildEmptyForm(data.department));
    setFormErrors({});
    showToast(editingId ? "บันทึกข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ", "success");
  };

  const softDelete = (id: string) => {
    if (!confirm("ยืนยันการลบรายการนี้?")) return;
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((r) => (r.id === id ? { ...r, isActive: false } : r)),
    }));
    showToast("ลบข้อมูลสำเร็จ", "success");
  };

  const restore = (id: string) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((r) => (r.id === id ? { ...r, isActive: true } : r)),
    }));
    showToast("กู้คืนข้อมูลสำเร็จ", "success");
  };

  const inputCls =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const thCls = "h-12 px-5 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
  const thRight = `${thCls} text-right`;
  const tdCls = "h-12 px-5 text-left text-sm text-slate-700";
  const tdMuted = "h-12 px-5 text-left text-sm text-slate-500";
  const tdNum = "h-12 px-5 text-right text-sm text-slate-500 tabular-nums";
  const btnGhost = "rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100";
  const btnDanger = "rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50";

  const statusPill = (active: boolean) => (
    <span
      className={`rounded-md px-2 py-0.5 text-xs ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {active ? "ใช้งาน" : "ลบแล้ว"}
    </span>
  );

  const renderCells = (row: TabData[TabKey][number]) => {
    switch (activeTab) {
      case "doctype": {
        const r = row as DocTypeRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.prefix}</td>
            <td className={tdNum}>{r.docCount}</td>
          </>
        );
      }
      case "formtype": {
        const r = row as FormTypeRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.code}</td>
            <td className={tdNum}>{r.fieldsCount}</td>
          </>
        );
      }
      case "department": {
        const r = row as DepartmentRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.code}</td>
            <td className={tdNum}>{r.employeeCount}</td>
          </>
        );
      }
      case "position": {
        const r = row as PositionRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.level}</td>
            <td className={tdMuted}>{r.department}</td>
          </>
        );
      }
      case "workflow": {
        const r = row as WorkflowRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.levels}</td>
            <td className={tdNum}>{r.approverCount}</td>
          </>
        );
      }
      default: {
        const r = row as SignatureRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.approverName}</td>
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
            <th className={thCls}>ชื่อ</th>
            <th className={thCls}>Prefix</th>
            <th className={thRight}>จำนวนเอกสาร</th>
          </>
        );
      case "formtype":
        return (
          <>
            <th className={thCls}>ชื่อ</th>
            <th className={thCls}>รหัส</th>
            <th className={thRight}>จำนวนฟิลด์</th>
          </>
        );
      case "department":
        return (
          <>
            <th className={thCls}>ชื่อแผนก</th>
            <th className={thCls}>รหัส</th>
            <th className={thRight}>จำนวนพนักงาน</th>
          </>
        );
      case "position":
        return (
          <>
            <th className={thCls}>ชื่อตำแหน่ง</th>
            <th className={thCls}>ระดับ</th>
            <th className={thCls}>แผนก</th>
          </>
        );
      case "workflow":
        return (
          <>
            <th className={thCls}>ชื่อ Workflow</th>
            <th className={thCls}>จำนวน Level</th>
            <th className={thRight}>ผู้อนุมัติ</th>
          </>
        );
      default:
        return (
          <>
            <th className={thCls}>ชื่อผู้อนุมัติ</th>
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
    <div className="mb-3">
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
      return (
        <>
          <Field
            label="ชื่อ"
            value={form.name}
            onChange={(v) => {
              setForm((f) => ({ ...f, name: v }));
              if (formErrors.name) clearError("name");
            }}
            inputClassName={formErrors.name ? inputErrorCls : inputCls}
            error={formErrors.name}
          />
          <Field
            label="Prefix"
            value={form.prefix}
            onChange={(v) => {
              setForm((f) => ({
                ...f,
                prefix: v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5),
              }));
              if (formErrors.prefix) clearError("prefix");
            }}
            inputClassName={formErrors.prefix ? inputErrorCls : inputCls}
            error={formErrors.prefix}
            maxLength={5}
          />
          {editingId && renderReadOnlyCount("จำนวนเอกสาร", form.docCount, "นับอัตโนมัติจากเอกสารที่ใช้ประเภทนี้")}
          {renderStatusToggle()}
        </>
      );
    }
    if (activeTab === "formtype") {
      return (
        <>
          <Field
            label="ชื่อ"
            value={form.name}
            onChange={(v) => {
              setForm((f) => ({ ...f, name: v }));
              clearError("name");
            }}
            inputClassName={formErrors.name ? inputErrorCls : inputCls}
            error={formErrors.name}
          />
          <Field
            label="รหัส"
            value={form.code}
            onChange={(v) => {
              setForm((f) => ({
                ...f,
                code: v.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
              }));
              clearError("code");
            }}
            inputClassName={formErrors.code ? inputErrorCls : inputCls}
            error={formErrors.code}
          />
          {editingId && renderReadOnlyCount("จำนวนฟิลด์", form.fieldsCount, "นับอัตโนมัติจากฟิลด์ที่กำหนดในฟอร์ม")}
          {renderStatusToggle()}
        </>
      );
    }
    if (activeTab === "department") {
      return (
        <>
          <Field
            label="ชื่อแผนก"
            value={form.name}
            onChange={(v) => {
              setForm((f) => ({ ...f, name: v }));
              clearError("name");
            }}
            inputClassName={formErrors.name ? inputErrorCls : inputCls}
            error={formErrors.name}
          />
          <Field
            label="รหัส"
            value={form.code}
            onChange={(v) => {
              setForm((f) => ({
                ...f,
                code: v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
              }));
              clearError("code");
            }}
            inputClassName={formErrors.code ? inputErrorCls : inputCls}
            error={formErrors.code}
            maxLength={10}
          />
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
              clearError("name");
            }}
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
      return (
        <>
          <Field
            label="ชื่อ Workflow"
            value={form.name}
            onChange={(v) => {
              setForm((f) => ({ ...f, name: v }));
              clearError("name");
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
                setForm((f) => ({
                  ...f,
                  levels,
                  workflowApprovers: syncApproverRows(Number(levels), f.workflowApprovers),
                }));
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
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-xs font-medium text-slate-400">{idx + 1}</span>
                  <select
                    className={formErrors[`approver_${idx}`] ? inputErrorCls : inputCls}
                    value={approver}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((f) => {
                        const next = [...f.workflowApprovers];
                        next[idx] = value;
                        return { ...f, workflowApprovers: next };
                      });
                      clearError(`approver_${idx}`);
                    }}
                  >
                    <option value="">เลือกผู้อนุมัติ</option>
                    {MOCK_APPROVERS.map((user) => (
                      <option key={user.name} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {Object.keys(formErrors).some((k) => k.startsWith("approver_")) && (
                <p className="text-xs text-red-500">กรุณาเลือกผู้อนุมัติทุกลำดับ</p>
              )}
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
              const user = MOCK_APPROVERS.find((u) => u.name === name);
              setForm((f) => ({
                ...f,
                approverName: name,
                position: user?.position ?? "",
              }));
              clearError("approverName");
            }}
          >
            <option value="">เลือกผู้อนุมัติ</option>
            {MOCK_APPROVERS.map((user) => (
              <option key={user.name} value={user.name}>
                {user.name}
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

  return (
    <div className="h-fit w-full bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-500">Master Data</span>
              <span>/</span>
              <span className="font-medium text-slate-600">{tabLabel}</span>
            </nav>
            <h1 className="text-xl font-semibold text-slate-800">Master Data</h1>
            <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            เพิ่ม
          </button>
        </div>
      </header>

      <div className="flex items-start gap-6 p-6 pb-8">
        <aside className="flex w-52 shrink-0 flex-col self-start rounded-lg border border-gray-200 bg-white shadow-sm">
          <nav className="space-y-1 p-3">
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
        </aside>

        <section className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-slate-800">{tabLabel}</h2>
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="rounded border-gray-200"
              />
              แสดงรายการที่ลบ
            </label>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
                <Inbox className="size-10 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {showDeleted ? "ไม่มีรายการที่ลบ" : "ไม่มีข้อมูล"}
                </p>
                <p className="text-xs text-slate-400">
                  {showDeleted ? "รายการที่กู้คืนจะแสดงในรายการปกติ" : "กดปุ่ม เพิ่ม เพื่อสร้างรายการใหม่"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      {renderHeaders()}
                      <th className={thCls}>สถานะ</th>
                      <th className={`${thCls} text-right`}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50">
                        {renderCells(row)}
                        <td className="h-12 px-5 text-left">{statusPill(row.isActive)}</td>
                        <td className="h-12 px-5 text-right">
                          {row.isActive ? (
                            <div className="flex justify-end gap-1">
                              <button type="button" onClick={() => openEdit(row.id)} className={btnGhost}>
                                แก้ไข
                              </button>
                              <button type="button" onClick={() => softDelete(row.id)} className={btnDanger}>
                                ลบ
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => restore(row.id)} className={btnGhost}>
                              กู้คืน
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-md bg-blue-50">
                <Layers className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">{tabStats.total}</p>
                <p className="text-xs text-slate-500">ทั้งหมด</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-md bg-green-50">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">{tabStats.active}</p>
                <p className="text-xs text-slate-500">ใช้งาน</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-md bg-red-50">
                <Trash2 className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">{tabStats.deleted}</p>
                <p className="text-xs text-slate-500">ลบแล้ว</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className={`w-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${activeTab === "workflow" ? "max-w-lg" : "max-w-md"}`}>
            <h2 className="text-sm font-medium text-slate-800">
              {editingId ? "แก้ไข" : "เพิ่ม"} {tabLabel}
            </h2>
            <div className="mt-4 space-y-3">{renderFormFields()}</div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingId(null);
                  setForm(buildEmptyForm(data.department));
                  setFormErrors({});
                }}
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
    </div>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputClassName?: string;
  error?: string;
  maxLength?: number;
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
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
