"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import {
  MD_TH,
  MD_TH_CENTER,
  MD_THEAD,
  MD_TR,
} from "@/app/(main)/admin/master-data/master-data-ui";

export type ActionKey = "view" | "create" | "edit" | "delete" | "approve";
export type ProductKey = "all" | "dms" | "esign" | "reports" | "archive";
export type PermissionMatrix = Record<string, Record<string, Record<ActionKey, boolean>>>;

export type RoleFormState = {
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

export const PERMISSION_ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
];

export const PRODUCT_TYPES: { key: ProductKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "dms", label: "DMS" },
  { key: "esign", label: "eSign" },
  { key: "reports", label: "Reports" },
  { key: "archive", label: "Archive" },
];

export const PERMISSION_SCHEMA: PermissionSection[] = [
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

function emptyRow(): Record<ActionKey, boolean> {
  return { view: false, create: false, edit: false, delete: false, approve: false };
}

export function buildPermissions(
  presets?: Record<string, Record<string, Partial<Record<ActionKey, boolean>>>>
): PermissionMatrix {
  const permissions: PermissionMatrix = {};
  for (const section of PERMISSION_SCHEMA) {
    permissions[section.key] = {};
    for (const item of section.items) {
      const preset = presets?.[section.key]?.[item.key] ?? {};
      const row = emptyRow();
      for (const action of PERMISSION_ACTIONS) {
        row[action.key] = preset[action.key] ?? false;
      }
      permissions[section.key][item.key] = row;
    }
  }
  return permissions;
}

export function countSection(
  sectionKey: string,
  permissions: PermissionMatrix
): { granted: number; total: number } {
  const section = PERMISSION_SCHEMA.find((s) => s.key === sectionKey);
  if (!section) return { granted: 0, total: 0 };
  let granted = 0;
  const total = section.items.length * PERMISSION_ACTIONS.length;
  for (const item of section.items) {
    for (const action of PERMISSION_ACTIONS) {
      if (permissions[sectionKey]?.[item.key]?.[action.key]) granted += 1;
    }
  }
  return { granted, total };
}

export function countAll(permissions: PermissionMatrix): { granted: number; total: number } {
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

export function summarizePermissions(permissions: PermissionMatrix): string {
  const actions = new Set<string>();
  for (const section of PERMISSION_SCHEMA) {
    for (const item of section.items) {
      for (const action of PERMISSION_ACTIONS) {
        if (permissions[section.key]?.[item.key]?.[action.key]) {
          actions.add(action.label);
        }
      }
    }
  }
  if (actions.size === 0) return "No permissions";
  return Array.from(actions).join(", ");
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

const checkboxCls =
  "size-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-100 focus:ring-offset-0";
const countPillCls =
  "inline-flex shrink-0 items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-500";
/** Matches permission table action columns (5 × w-20) for aligned Select all controls */
const ACTION_COLS_W = "w-[25rem]";
const ACTION_COL_W = "w-20";

export function RolePermissionPanel({
  role,
  onChange,
}: {
  role: RoleFormState;
  onChange: (next: RoleFormState) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PERMISSION_SCHEMA.map((s) => [s.key, true]))
  );
  const [searchQuery, setSearchQuery] = useState("");

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
    onChange({
      ...role,
      permissions: {
        ...role.permissions,
        [moduleKey]: {
          ...role.permissions[moduleKey],
          [itemKey]: { ...role.permissions[moduleKey][itemKey], [action]: value },
        },
      },
    });
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
        for (const action of PERMISSION_ACTIONS) row[action.key] = checked;
        next[section.key][item.key] = row;
      }
    }
    onChange({ ...role, permissions: next });
  };

  return (
    <>
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search item..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center border-b border-slate-100 px-6 py-4">
          <h2 className="min-w-0 flex-1 text-sm font-bold text-slate-800">Permission</h2>
          <span className={`${countPillCls} mr-4 hidden sm:inline-flex`}>
            {summary.granted}/{summary.total} permissions granted
          </span>
          <label
            className={`flex ${ACTION_COLS_W} shrink-0 items-center justify-end gap-2 text-sm font-medium text-slate-600`}
          >
            <IndeterminateCheckbox
              state={pageSelectState}
              onChange={(checked) => applyPermissions(checked)}
              className={checkboxCls}
            />
            Select all
          </label>
        </div>
        <div className="border-b border-slate-100 px-6 py-2 sm:hidden">
          <span className={countPillCls}>
            {summary.granted}/{summary.total} permissions granted
          </span>
        </div>

        <div className="divide-y divide-slate-100">
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
                <div className="flex items-center bg-slate-50/60 px-6 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-700"
                  >
                    <ChevronRight
                      className={`size-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                        expanded[section.key] ? "rotate-90" : ""
                      }`}
                    />
                    <span>{section.label}</span>
                    <span className={countPillCls}>
                      {sectionCounts.granted}/{sectionCounts.total}
                    </span>
                  </button>
                  <label
                    className={`flex ${ACTION_COLS_W} shrink-0 items-center justify-end gap-2 text-xs font-medium text-slate-500`}
                  >
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
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className={MD_THEAD}>
                        <tr>
                          <th className={`${MD_TH} min-w-[12rem]`}>Item</th>
                          {PERMISSION_ACTIONS.map((action) => (
                            <th key={action.key} className={`${MD_TH_CENTER} ${ACTION_COL_W}`}>
                              {action.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => (
                          <tr key={item.key} className={MD_TR}>
                            <td className="px-6 py-3.5 text-sm font-medium text-slate-700">
                              {item.label}
                            </td>
                            {PERMISSION_ACTIONS.map((action) => (
                              <td key={action.key} className={`${ACTION_COL_W} px-2 py-3.5`}>
                                <div className="flex items-center justify-center">
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
                                </div>
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
    </>
  );
}

export function RoleProductTypesField({
  productTypes,
  onChange,
}: {
  productTypes: Record<ProductKey, boolean>;
  onChange: (next: Record<ProductKey, boolean>) => void;
}) {
  const toggleProductType = (key: ProductKey, checked: boolean) => {
    if (key === "all") {
      onChange({ all: checked, dms: checked, esign: checked, reports: checked, archive: checked });
      return;
    }
    const next = { ...productTypes, [key]: checked };
    next.all = PRODUCT_TYPES.filter((p) => p.key !== "all").every((p) => next[p.key]);
    onChange(next);
  };

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">Product types</p>
      <div className="flex flex-wrap gap-4">
        {PRODUCT_TYPES.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={productTypes[key]}
              onChange={(e) => toggleProductType(key, e.target.checked)}
              className={checkboxCls}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
