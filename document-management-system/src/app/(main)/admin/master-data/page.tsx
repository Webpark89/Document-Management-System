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
  PenLine,
  Plus,
  Stamp,
  Trash2,
  User,
} from "lucide-react";

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
  isActive: boolean;
}

interface DepartmentRow {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface PositionRow {
  id: string;
  name: string;
  department: string;
  isActive: boolean;
}

interface WorkflowRow {
  id: string;
  name: string;
  levelCount: number;
  isActive: boolean;
}

interface SignatureRow {
  id: string;
  userName: string;
  position: string;
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
  { key: "doctype", label: "Document type", icon: FileType2 },
  { key: "formtype", label: "Form type", icon: FormInput },
  { key: "department", label: "Department", icon: Building2 },
  { key: "position", label: "Position", icon: Stamp },
  { key: "workflow", label: "Workflow", icon: GitBranch },
  { key: "signature", label: "Signature", icon: PenLine },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SEED: TabData = {
  doctype: [
    { id: "1", name: "Purchase request", prefix: "PR", docCount: 12, isActive: true },
    { id: "2", name: "Purchase order", prefix: "PO", docCount: 8, isActive: true },
    { id: "3", name: "Certificate", prefix: "CERT", docCount: 3, isActive: true },
  ],
  formtype: [
    { id: "1", name: "PR form", code: "PR-FRM", isActive: true },
    { id: "2", name: "PO form", code: "PO-FRM", isActive: true },
  ],
  department: [
    { id: "1", name: "IT", code: "IT", isActive: true },
    { id: "2", name: "Procurement", code: "PROC", isActive: true },
    { id: "3", name: "HR", code: "HR", isActive: true },
  ],
  position: [
    { id: "1", name: "Manager", department: "IT", isActive: true },
    { id: "2", name: "Staff", department: "Procurement", isActive: true },
  ],
  workflow: [
    { id: "1", name: "PR approval", levelCount: 3, isActive: true },
    { id: "2", name: "PO approval", levelCount: 4, isActive: true },
  ],
  signature: [
    { id: "1", userName: "Somchai Jaidee", position: "Manager", isActive: true },
    { id: "2", userName: "Wipa Rakdee", position: "Director", isActive: true },
  ],
};

type FormState = {
  name: string;
  prefix: string;
  docCount: string;
  code: string;
  department: string;
  levelCount: string;
  userName: string;
  position: string;
};

const emptyForm = (): FormState => ({
  name: "",
  prefix: "",
  docCount: "0",
  code: "",
  department: "",
  levelCount: "3",
  userName: "",
  position: "",
});

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("doctype");
  const [data, setData] = useState<TabData>(SEED);
  const [showDeleted, setShowDeleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const rows = useMemo(() => {
    const list = data[activeTab];
    return showDeleted ? list.filter((r) => !r.isActive) : list.filter((r) => r.isActive);
  }, [data, activeTab, showDeleted]);

  const tabLabel = TABS.find((t) => t.key === activeTab)?.label ?? "Master data";
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
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    const row = data[activeTab].find((r) => r.id === id);
    if (!row) return;
    setForm({
      name: "name" in row ? row.name : "",
      prefix: "prefix" in row ? row.prefix : "",
      docCount: "docCount" in row ? String(row.docCount) : "0",
      code: "code" in row ? row.code : "",
      department: "department" in row ? row.department : "",
      levelCount: "levelCount" in row ? String(row.levelCount) : "3",
      userName: "userName" in row ? row.userName : "",
      position: "position" in row ? row.position : "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const id = editingId ?? uid();

    setData((prev) => {
      const list = [...prev[activeTab]];
      const idx = list.findIndex((r) => r.id === id);

      if (activeTab === "doctype") {
        const row: DocTypeRow = {
          id,
          name: form.name.trim(),
          prefix: form.prefix.trim().toUpperCase(),
          docCount: Number(form.docCount) || 0,
          isActive: idx >= 0 ? (list[idx] as DocTypeRow).isActive : true,
        };
        if (idx >= 0) list[idx] = row;
        else list.push(row);
        return { ...prev, doctype: list as DocTypeRow[] };
      }

      if (activeTab === "formtype") {
        const row: FormTypeRow = {
          id,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          isActive: idx >= 0 ? (list[idx] as FormTypeRow).isActive : true,
        };
        if (idx >= 0) list[idx] = row;
        else list.push(row);
        return { ...prev, formtype: list as FormTypeRow[] };
      }

      if (activeTab === "department") {
        const row: DepartmentRow = {
          id,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          isActive: idx >= 0 ? (list[idx] as DepartmentRow).isActive : true,
        };
        if (idx >= 0) list[idx] = row;
        else list.push(row);
        return { ...prev, department: list as DepartmentRow[] };
      }

      if (activeTab === "position") {
        const row: PositionRow = {
          id,
          name: form.name.trim(),
          department: form.department.trim(),
          isActive: idx >= 0 ? (list[idx] as PositionRow).isActive : true,
        };
        if (idx >= 0) list[idx] = row;
        else list.push(row);
        return { ...prev, position: list as PositionRow[] };
      }

      if (activeTab === "workflow") {
        const row: WorkflowRow = {
          id,
          name: form.name.trim(),
          levelCount: Number(form.levelCount) || 3,
          isActive: idx >= 0 ? (list[idx] as WorkflowRow).isActive : true,
        };
        if (idx >= 0) list[idx] = row;
        else list.push(row);
        return { ...prev, workflow: list as WorkflowRow[] };
      }

      const row: SignatureRow = {
        id,
        userName: form.userName.trim(),
        position: form.position.trim(),
        isActive: idx >= 0 ? (list[idx] as SignatureRow).isActive : true,
      };
      if (idx >= 0) list[idx] = row;
      else list.push(row);
      return { ...prev, signature: list as SignatureRow[] };
    });

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const softDelete = (id: string) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((r) => (r.id === id ? { ...r, isActive: false } : r)),
    }));
  };

  const restore = (id: string) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((r) => (r.id === id ? { ...r, isActive: true } : r)),
    }));
  };

  const inputCls =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const thCls =
    "h-12 px-5 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
  const thRight = `${thCls} text-right`;
  const tdCls = "h-12 px-5 text-left text-sm text-slate-700";
  const tdMuted = "h-12 px-5 text-left text-sm text-slate-500";
  const tdNum = "h-12 px-5 text-right text-sm text-slate-500 tabular-nums";
  const btnGhost =
    "rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100";
  const btnDanger =
    "rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50";

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
          </>
        );
      }
      case "department": {
        const r = row as DepartmentRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.code}</td>
          </>
        );
      }
      case "position": {
        const r = row as PositionRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.department}</td>
          </>
        );
      }
      case "workflow": {
        const r = row as WorkflowRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.name}</td>
            <td className={tdMuted}>{r.levelCount}</td>
          </>
        );
      }
      default: {
        const r = row as SignatureRow;
        return (
          <>
            <td className={`${tdCls} font-medium`}>{r.userName}</td>
            <td className={tdMuted}>{r.position}</td>
          </>
        );
      }
    }
  };

  const renderFormFields = () => {
    if (activeTab === "doctype") {
      return (
        <>
          <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="Prefix" value={form.prefix} onChange={(v) => setForm((f) => ({ ...f, prefix: v }))} />
          <Field label="Doc count" value={form.docCount} onChange={(v) => setForm((f) => ({ ...f, docCount: v }))} type="number" />
        </>
      );
    }
    if (activeTab === "formtype" || activeTab === "department") {
      return (
        <>
          <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="Code" value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
        </>
      );
    }
    if (activeTab === "position") {
      return (
        <>
          <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="Department" value={form.department} onChange={(v) => setForm((f) => ({ ...f, department: v }))} />
        </>
      );
    }
    if (activeTab === "workflow") {
      return (
        <>
          <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <div className="mb-3">
            <label className="mb-1.5 block text-xs text-slate-500">Level count</label>
            <select
              className={inputCls}
              value={form.levelCount}
              onChange={(e) => setForm((f) => ({ ...f, levelCount: e.target.value }))}
            >
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
        </>
      );
    }
    return (
      <>
        <Field label="User name" value={form.userName} onChange={(v) => setForm((f) => ({ ...f, userName: v }))} />
        <Field label="Position" value={form.position} onChange={(v) => setForm((f) => ({ ...f, position: v }))} />
      </>
    );
  };

  return (
    <div className="h-fit w-full">
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-500">Master data</span>
              <span>/</span>
              <span className="font-medium text-slate-600">{tabLabel}</span>
            </nav>
            <h1 className="text-xl font-semibold text-slate-800">Master data</h1>
            <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </header>

      <div className="flex items-start gap-6 p-6 pb-8">
        <aside className="flex w-52 shrink-0 flex-col self-start rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-4">
            <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Master data
            </p>
            <nav className="space-y-1">
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
          </div>
          <div className="border-t border-gray-200 px-3 py-3">
            <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-gray-50">
              <div className="flex size-8 items-center justify-center rounded-md bg-gray-100">
                <User className="size-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700">Dev B</p>
                <p className="truncate text-xs text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
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
              Show deleted
            </label>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
                <Inbox className="size-10 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {showDeleted ? "No deleted records" : "No active records"}
                </p>
                <p className="text-xs text-slate-400">
                  {showDeleted ? "Restored items appear in the active list" : "Add a record to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      {activeTab === "doctype" && (
                        <>
                          <th className={thCls}>Name</th>
                          <th className={thCls}>Prefix</th>
                          <th className={thRight}>Doc count</th>
                        </>
                      )}
                      {(activeTab === "formtype" || activeTab === "department") && (
                        <>
                          <th className={thCls}>Name</th>
                          <th className={thCls}>Code</th>
                        </>
                      )}
                      {activeTab === "position" && (
                        <>
                          <th className={thCls}>Name</th>
                          <th className={thCls}>Department</th>
                        </>
                      )}
                      {activeTab === "workflow" && (
                        <>
                          <th className={thCls}>Name</th>
                          <th className={thCls}>Level count</th>
                        </>
                      )}
                      {activeTab === "signature" && (
                        <>
                          <th className={thCls}>User name</th>
                          <th className={thCls}>Position</th>
                        </>
                      )}
                      <th className={thCls}>Status</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50"
                      >
                        {renderCells(row)}
                        <td className="h-12 px-5 text-left">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs ${
                              row.isActive ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {row.isActive ? "Active" : "Deleted"}
                          </span>
                        </td>
                        <td className="h-12 px-5 text-right">
                          {row.isActive ? (
                            <div className="flex justify-end gap-1">
                              <button type="button" onClick={() => openEdit(row.id)} className={btnGhost}>
                                Edit
                              </button>
                              <button type="button" onClick={() => softDelete(row.id)} className={btnDanger}>
                                Delete
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => restore(row.id)} className={btnGhost}>
                              Restore
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
                <p className="text-xs text-slate-500">Total types</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-md bg-green-50">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">{tabStats.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-md bg-red-50">
                <Trash2 className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">{tabStats.deleted}</p>
                <p className="text-xs text-slate-500">Deleted</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-slate-800">
              {editingId ? "Edit" : "Add"} {tabLabel.toLowerCase()}
            </h2>
            <div className="mt-4 space-y-3">{renderFormFields()}</div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingId(null);
                  setForm(emptyForm());
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Save
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-slate-500">{label}</label>
      <input
        type={type}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
