"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

type ActionKey = "view" | "create" | "edit" | "delete" | "approve";
type ProductKey = "all" | "dms" | "esign" | "reports" | "archive";

type PermissionMatrix = Record<string, Record<string, Record<ActionKey, boolean>>>;

type RoleState = {
  title: string;
  productTypes: Record<ProductKey, boolean>;
  permissions: PermissionMatrix;
};

interface PermissionItem {
  key: string;
  label: string;
}

interface PermissionSection {
  key: string;
  label: string;
  items: PermissionItem[];
}

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
];

const PRODUCT_TYPES: { key: ProductKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "dms", label: "DMS" },
  { key: "esign", label: "eSign" },
  { key: "reports", label: "Reports" },
  { key: "archive", label: "Archive" },
];

const PERMISSION_SCHEMA: PermissionSection[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    items: [
      { key: "overview", label: "Overview" },
      { key: "registrations", label: "Registrations" },
      { key: "closed_sales", label: "Closed sales" },
      { key: "my_tasks", label: "My tasks" },
      { key: "reports", label: "Reports" },
    ],
  },
  {
    key: "document_management",
    label: "Document management",
    items: [
      { key: "documents", label: "Documents" },
      { key: "folders", label: "Folders" },
      { key: "upload", label: "Upload" },
      { key: "search", label: "Search" },
      { key: "version_history", label: "Version history" },
      { key: "pdf_viewer", label: "PDF viewer" },
    ],
  },
  {
    key: "approval_workflow",
    label: "Approval workflow",
    items: [
      { key: "pending_approvals", label: "Pending approvals" },
      { key: "approve_reject", label: "Approve/Reject" },
      { key: "return_for_edit", label: "Return for edit" },
      { key: "approval_matrix", label: "Approval matrix" },
    ],
  },
  {
    key: "e_signature",
    label: "E-Signature",
    items: [
      { key: "apply_signature", label: "Apply signature" },
      { key: "signature_history", label: "Signature history" },
    ],
  },
  {
    key: "master_data",
    label: "Master Data",
    items: [
      { key: "document_type", label: "Document type" },
      { key: "form_type", label: "Form type" },
      { key: "department", label: "Department" },
      { key: "position", label: "Position" },
      { key: "workflow", label: "Workflow" },
      { key: "signature_list", label: "Signature list" },
    ],
  },
  {
    key: "user_management",
    label: "User management",
    items: [
      { key: "users", label: "Users" },
      { key: "roles", label: "Roles" },
      { key: "permissions", label: "Permissions" },
      { key: "reset_password", label: "Reset password" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    items: [
      { key: "document_report", label: "Document report" },
      { key: "approval_report", label: "Approval report" },
      { key: "audit_log", label: "Audit log" },
    ],
  },
];

const SENIOR_MANAGER_PRESETS: Record<string, Record<string, Partial<Record<ActionKey, boolean>>>> = {
  dashboard: {
    overview: { view: true, approve: true },
    registrations: { view: true, edit: true, approve: true },
    closed_sales: { view: true, approve: true },
    my_tasks: { view: true, edit: true, approve: true },
    reports: { view: true, approve: true },
  },
  document_management: {
    documents: { view: true, create: true, edit: true, approve: true },
    folders: { view: true, create: true, edit: true },
    upload: { view: true, create: true },
    search: { view: true },
    version_history: { view: true, approve: true },
    pdf_viewer: { view: true },
  },
  approval_workflow: {
    pending_approvals: { view: true, edit: true, approve: true },
    approve_reject: { view: true, edit: true, approve: true },
    return_for_edit: { view: true, edit: true, approve: true },
    approval_matrix: { view: true, edit: true, approve: true },
  },
  e_signature: {
    apply_signature: { view: true, create: true, edit: true, approve: true },
    signature_history: { view: true, approve: true },
  },
  master_data: {
    document_type: { view: true, approve: true },
    form_type: { view: true, approve: true },
    department: { view: true },
    position: { view: true },
    workflow: { view: true, approve: true },
    signature_list: { view: true },
  },
  user_management: {
    users: { view: true, approve: true },
    roles: { view: true },
    permissions: { view: true },
    reset_password: { view: true, edit: true },
  },
  reports: {
    document_report: { view: true, approve: true },
    approval_report: { view: true, approve: true },
    audit_log: { view: true, approve: true },
  },
};

function emptyRow(): Record<ActionKey, boolean> {
  return { view: false, create: false, edit: false, delete: false, approve: false };
}

function buildPermissions(presets?: Record<string, Record<string, Partial<Record<ActionKey, boolean>>>>): PermissionMatrix {
  const permissions: PermissionMatrix = {};
  for (const section of PERMISSION_SCHEMA) {
    permissions[section.key] = {};
    for (const item of section.items) {
      const preset = presets?.[section.key]?.[item.key] ?? {};
      const row = emptyRow();
      for (const action of ACTIONS) {
        row[action.key] = preset[action.key] ?? false;
      }
      permissions[section.key][item.key] = row;
    }
  }
  return permissions;
}

const SEED_ROLE: RoleState = {
  title: "Senior manager",
  productTypes: { all: true, dms: true, esign: true, reports: true, archive: true },
  permissions: buildPermissions(SENIOR_MANAGER_PRESETS),
};

function countSection(sectionKey: string, permissions: PermissionMatrix): { granted: number; total: number } {
  const section = PERMISSION_SCHEMA.find((s) => s.key === sectionKey);
  if (!section) return { granted: 0, total: 0 };
  let granted = 0;
  const total = section.items.length * ACTIONS.length;
  for (const item of section.items) {
    for (const action of ACTIONS) {
      if (permissions[sectionKey]?.[item.key]?.[action.key]) granted += 1;
    }
  }
  return { granted, total };
}

function countAll(permissions: PermissionMatrix): { granted: number; total: number } {
  let granted = 0;
  let total = 0;
  for (const section of PERMISSION_SCHEMA) {
    const c = countSection(section.key, permissions);
    granted += c.granted;
    total += c.total;
  }
  return { granted, total };
}

function checkState(granted: number, total: number): "none" | "some" | "all" {
  if (granted === 0) return "none";
  if (granted === total) return "all";
  return "some";
}

function sectionCheckState(sectionKey: string, permissions: PermissionMatrix) {
  const { granted, total } = countSection(sectionKey, permissions);
  return checkState(granted, total);
}

function IndeterminateCheckbox({
  state,
  onChange,
  className,
}: {
  state: "none" | "some" | "all";
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === "all"}
      onChange={(e) => onChange(e.target.checked)}
      className={className}
    />
  );
}

export default function UserRolePage() {
  const { showToast } = useToast();
  const [role, setRole] = useState<RoleState>(SEED_ROLE);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PERMISSION_SCHEMA.map((s) => [s.key, true]))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => countAll(role.permissions), [role.permissions]);
  const pageSelectState = useMemo(
    () => checkState(summary.granted, summary.total),
    [summary]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleSections = useMemo(() => {
    if (!normalizedSearch) return PERMISSION_SCHEMA;
    return PERMISSION_SCHEMA.filter((section) =>
      section.items.some((item) => item.label.toLowerCase().includes(normalizedSearch))
    );
  }, [normalizedSearch]);

  useEffect(() => {
    if (!normalizedSearch) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const section of PERMISSION_SCHEMA) {
        if (section.items.some((item) => item.label.toLowerCase().includes(normalizedSearch))) {
          next[section.key] = true;
        }
      }
      return next;
    });
  }, [normalizedSearch]);

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setPermission = (moduleKey: string, itemKey: string, action: ActionKey, value: boolean) => {
    setRole((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [itemKey]: { ...prev.permissions[moduleKey][itemKey], [action]: value },
        },
      },
    }));
  };

  const applyPermissions = (checked: boolean, moduleKey?: string) => {
    const next: PermissionMatrix = { ...role.permissions };
    const sections = moduleKey
      ? PERMISSION_SCHEMA.filter((s) => s.key === moduleKey)
      : PERMISSION_SCHEMA;
    for (const section of sections) {
      next[section.key] = { ...next[section.key] };
      for (const item of section.items) {
        const row = emptyRow();
        for (const action of ACTIONS) row[action.key] = checked;
        next[section.key][item.key] = row;
      }
    }
    setRole((prev) => ({ ...prev, permissions: next }));
  };

  const toggleProductType = (key: ProductKey, checked: boolean) => {
    if (key === "all") {
      setRole((prev) => ({
        ...prev,
        productTypes: { all: checked, dms: checked, esign: checked, reports: checked, archive: checked },
      }));
      return;
    }
    setRole((prev) => {
      const productTypes = { ...prev.productTypes, [key]: checked };
      productTypes.all = PRODUCT_TYPES.filter((p) => p.key !== "all").every((p) => productTypes[p.key]);
      return { ...prev, productTypes };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    console.log(role);
    setSaving(false);
    showToast("บันทึกสิทธิ์สำเร็จ", "success");
  };

  const checkboxCls = "size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500";
  const inputCls =
    "w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="h-fit w-full bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <Link href="/admin/config" className="text-slate-500 hover:text-slate-600">
            Config
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-600">User role</span>
        </nav>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">User role</h1>
            <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/config"
              className="rounded-md px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-gray-100"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-slate-800">Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Title</label>
              <input
                type="text"
                value={role.title}
                onChange={(e) => setRole((prev) => ({ ...prev, title: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-slate-500">Product types</p>
              <div className="flex flex-wrap gap-4">
                {PRODUCT_TYPES.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={role.productTypes[key]}
                      onChange={(e) => toggleProductType(key, e.target.checked)}
                      className={checkboxCls}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-medium text-slate-800">Permission</h2>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {summary.granted}/{summary.total} permissions granted
              </span>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <IndeterminateCheckbox
                  state={pageSelectState}
                  onChange={(checked) => applyPermissions(checked)}
                  className={checkboxCls}
                />
                Select all
              </label>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {visibleSections.map((section) => {
              const sectionCounts = countSection(section.key, role.permissions);
              const sectionState = sectionCheckState(section.key, role.permissions);
              const filteredItems = normalizedSearch
                ? section.items.filter((item) =>
                    item.label.toLowerCase().includes(normalizedSearch)
                  )
                : section.items;

              if (filteredItems.length === 0) return null;

              return (
                <div key={section.key}>
                  <div className="flex items-center justify-between bg-gray-50 px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.key)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700"
                    >
                      <ChevronRight
                        className={`size-4 text-slate-500 transition-transform duration-200 ${
                          expanded[section.key] ? "rotate-90" : ""
                        }`}
                      />
                      <span>{section.label}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({sectionCounts.granted}/{sectionCounts.total})
                      </span>
                    </button>
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <IndeterminateCheckbox
                        state={sectionState}
                        onChange={(checked) => applyPermissions(checked, section.key)}
                        className={checkboxCls}
                      />
                      Select all
                    </label>
                  </div>

                  {expanded[section.key] && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-white text-xs text-slate-500">
                            <th className="h-10 px-5 text-left font-medium">Item</th>
                            {ACTIONS.map((action) => (
                              <th key={action.key} className="h-10 w-20 px-2 text-center font-medium">
                                {action.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((item) => (
                            <tr
                              key={item.key}
                              className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50"
                            >
                              <td className="h-12 px-5 text-slate-700">{item.label}</td>
                              {ACTIONS.map((action) => (
                                <td key={action.key} className="h-12 px-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!role.permissions[section.key]?.[item.key]?.[action.key]
                                    }
                                    onChange={(e) =>
                                      setPermission(
                                        section.key,
                                        item.key,
                                        action.key,
                                        e.target.checked
                                      )
                                    }
                                    className={checkboxCls}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
