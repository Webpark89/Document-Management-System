"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

type ActionKey = "view" | "add" | "edit" | "delete" | "export";
type ProductKey = "all" | "dms" | "esign" | "reports" | "archive";

type PermissionMatrix = Record<string, Record<string, Partial<Record<ActionKey, boolean>>>>;

type RoleState = {
  title: string;
  productTypes: Record<ProductKey, boolean>;
  permissions: PermissionMatrix;
};

interface PermissionItem {
  key: string;
  label: string;
  available: ActionKey[];
}

interface PermissionSection {
  key: string;
  label: string;
  items: PermissionItem[];
}

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "add", label: "Add" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "export", label: "Export" },
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
      { key: "overview", label: "Overview", available: ["view", "export"] },
      { key: "registrations", label: "Registrations", available: ["view", "add", "edit", "export"] },
      { key: "closed_sales", label: "Closed sales", available: ["view", "export"] },
      { key: "my_tasks", label: "My tasks", available: ["view", "edit", "export"] },
      { key: "reports", label: "Reports", available: ["view", "export"] },
    ],
  },
  {
    key: "document_management",
    label: "Document management",
    items: [
      { key: "documents", label: "Documents", available: ["view", "add", "edit", "delete", "export"] },
      { key: "folders", label: "Folders", available: ["view", "add", "edit", "delete"] },
      { key: "document_types", label: "Document types", available: ["view", "add", "edit", "export"] },
      { key: "document_templates", label: "Document templates", available: ["view", "add", "edit", "delete", "export"] },
      { key: "document_versioning", label: "Document versioning", available: ["view", "edit", "export"] },
      { key: "document_approval", label: "Document approval", available: ["view", "edit", "export"] },
      { key: "recycle_bin", label: "Recycle bin", available: ["view", "delete", "export"] },
    ],
  },
  {
    key: "users",
    label: "Users",
    items: [
      { key: "user_list", label: "User list", available: ["view", "add", "edit", "delete", "export"] },
      { key: "roles_permissions", label: "Roles & permissions", available: ["view", "add", "edit", "export"] },
      { key: "user_groups", label: "User groups", available: ["view", "add", "edit", "delete", "export"] },
      { key: "invite_users", label: "Invite users", available: ["view", "add", "delete", "export"] },
    ],
  },
  {
    key: "workflows",
    label: "Workflows",
    items: [
      { key: "workflow_list", label: "Workflow list", available: ["view", "add", "edit", "delete", "export"] },
      { key: "workflow_designer", label: "Workflow designer", available: ["view", "add", "edit", "export"] },
      { key: "workflow_tasks", label: "Workflow tasks", available: ["view", "edit", "export"] },
      { key: "approvals", label: "Approvals", available: ["view", "edit", "export"] },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    items: [
      { key: "all_reports", label: "All reports", available: ["view", "export"] },
      { key: "custom_reports", label: "Custom reports", available: ["view", "add", "edit", "export"] },
      { key: "scheduled_reports", label: "Scheduled reports", available: ["view", "add", "edit", "delete", "export"] },
    ],
  },
  {
    key: "audit_log",
    label: "Audit log",
    items: [
      { key: "activity_log", label: "Activity log", available: ["view", "export"] },
      { key: "login_history", label: "Login history", available: ["view", "export"] },
      { key: "document_history", label: "Document history", available: ["view", "export"] },
    ],
  },
  {
    key: "system_settings",
    label: "System settings",
    items: [
      { key: "general_settings", label: "General settings", available: ["view", "edit"] },
      { key: "email_settings", label: "Email settings", available: ["view", "edit"] },
      { key: "storage_settings", label: "Storage settings", available: ["view", "edit"] },
      { key: "integrations", label: "Integrations", available: ["view", "add", "edit", "export"] },
      { key: "backup_restore", label: "Backup & restore", available: ["view", "export"] },
    ],
  },
];

const SENIOR_MANAGER_PRESETS: Record<string, Record<string, Partial<Record<ActionKey, boolean>>>> = {
  dashboard: {
    overview: { view: true, export: true },
    registrations: { view: true, edit: true, export: true },
    closed_sales: { view: true, export: true },
    my_tasks: { view: true, edit: true, export: true },
    reports: { view: true, export: true },
  },
  document_management: {
    documents: { view: true, add: true, edit: true, export: true },
    folders: { view: true, add: true, edit: true },
    document_types: { view: true, export: true },
    document_templates: { view: true, edit: true, export: true },
    document_versioning: { view: true, edit: true, export: true },
    document_approval: { view: true, edit: true, export: true },
    recycle_bin: { view: true, delete: true },
  },
  users: {
    user_list: { view: true, export: true },
    roles_permissions: { view: true },
    user_groups: { view: true, export: true },
    invite_users: { view: true, add: true },
  },
  workflows: {
    workflow_list: { view: true, export: true },
    workflow_designer: { view: true },
    workflow_tasks: { view: true, edit: true, export: true },
    approvals: { view: true, edit: true, export: true },
  },
  reports: {
    all_reports: { view: true, export: true },
    custom_reports: { view: true, export: true },
    scheduled_reports: { view: true, export: true },
  },
  audit_log: {
    activity_log: { view: true, export: true },
    login_history: { view: true },
    document_history: { view: true, export: true },
  },
  system_settings: {
    general_settings: { view: true },
    email_settings: { view: true },
    storage_settings: { view: true },
    integrations: { view: true },
    backup_restore: { view: true },
  },
};

function buildPermissions(presets?: Record<string, Record<string, Partial<Record<ActionKey, boolean>>>>): PermissionMatrix {
  const permissions: PermissionMatrix = {};
  for (const section of PERMISSION_SCHEMA) {
    permissions[section.key] = {};
    for (const item of section.items) {
      const preset = presets?.[section.key]?.[item.key] ?? {};
      const row: Partial<Record<ActionKey, boolean>> = {};
      for (const action of item.available) {
        row[action] = preset[action] ?? false;
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

const NEW_ROLE: RoleState = {
  title: "",
  productTypes: { all: false, dms: false, esign: false, reports: false, archive: false },
  permissions: buildPermissions(),
};

function allExpanded(): Record<string, boolean> {
  return Object.fromEntries(PERMISSION_SCHEMA.map((s) => [s.key, true]));
}

function UserRoleContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("mode") === "new";
  const [role, setRole] = useState<RoleState>(() => (isNew ? NEW_ROLE : SEED_ROLE));
  const [expanded, setExpanded] = useState<Record<string, boolean>>(allExpanded);
  const [saving, setSaving] = useState(false);

  const allChecked = useMemo(() => {
    for (const section of PERMISSION_SCHEMA) {
      for (const item of section.items) {
        for (const action of item.available) {
          if (!role.permissions[section.key]?.[item.key]?.[action]) return false;
        }
      }
    }
    return true;
  }, [role.permissions]);

  const toggleSection = (sectionKey: string) => {
    setExpanded((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const setPermission = (sectionKey: string, itemKey: string, action: ActionKey, value: boolean) => {
    setRole((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [sectionKey]: {
          ...prev.permissions[sectionKey],
          [itemKey]: { ...prev.permissions[sectionKey][itemKey], [action]: value },
        },
      },
    }));
  };

  const applyPermissions = (checked: boolean, sectionKey?: string) => {
    const next: PermissionMatrix = { ...role.permissions };
    const sections = sectionKey
      ? PERMISSION_SCHEMA.filter((s) => s.key === sectionKey)
      : PERMISSION_SCHEMA;

    for (const section of sections) {
      next[section.key] = { ...next[section.key] };
      for (const item of section.items) {
        const row: Partial<Record<ActionKey, boolean>> = {};
        for (const action of item.available) row[action] = checked;
        next[section.key][item.key] = row;
      }
    }
    setRole((prev) => ({ ...prev, permissions: next }));
  };

  const isSectionAllChecked = (sectionKey: string) => {
    const section = PERMISSION_SCHEMA.find((s) => s.key === sectionKey);
    if (!section) return false;
    return section.items.every((item) =>
      item.available.every((action) => role.permissions[sectionKey]?.[item.key]?.[action])
    );
  };

  const toggleProductType = (key: ProductKey, checked: boolean) => {
    if (key === "all") {
      setRole((prev) => ({
        ...prev,
        productTypes: {
          all: checked,
          dms: checked,
          esign: checked,
          reports: checked,
          archive: checked,
        },
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
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(role);
      showToast("Role saved", "success");
    } catch {
      showToast("Failed to save role", "error");
    } finally {
      setSaving(false);
    }
  };

  const checkboxCls =
    "size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-30";

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
          <span className="font-medium text-slate-600">{isNew ? "Create role" : "User role"}</span>
        </nav>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              {isNew ? "Create role" : "User role"}
            </h1>
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
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                placeholder={isNew ? "e.g. Document manager" : undefined}
                className="w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-medium text-slate-800">Permission</h2>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => applyPermissions(e.target.checked)}
                className={checkboxCls}
              />
              Select all
            </label>
          </div>

          <div className="divide-y divide-gray-100">
            {PERMISSION_SCHEMA.map((section) => (
              <div key={section.key}>
                <div className="flex items-center justify-between bg-gray-50 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    {expanded[section.key] ? (
                      <ChevronDown className="size-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="size-4 text-slate-500" />
                    )}
                    {section.label}
                  </button>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={isSectionAllChecked(section.key)}
                      onChange={(e) => applyPermissions(e.target.checked, section.key)}
                      className={checkboxCls}
                    />
                    Select all
                  </label>
                </div>

                {expanded[section.key] && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs text-slate-500">
                          <th className="h-10 px-5 text-left font-medium">Item</th>
                          {ACTIONS.map((action) => (
                            <th key={action.key} className="h-10 w-20 px-2 text-center font-medium">
                              {action.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item) => (
                          <tr
                            key={item.key}
                            className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50"
                          >
                            <td className="h-12 px-5 text-slate-700">{item.label}</td>
                            {ACTIONS.map((action) => {
                              const available = item.available.includes(action.key);
                              return (
                                <td key={action.key} className="h-12 px-2 text-center">
                                  {available ? (
                                    <input
                                      type="checkbox"
                                      checked={!!role.permissions[section.key]?.[item.key]?.[action.key]}
                                      onChange={(e) =>
                                        setPermission(section.key, item.key, action.key, e.target.checked)
                                      }
                                      className={checkboxCls}
                                    />
                                  ) : (
                                    <span className="inline-block size-4" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserRolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center bg-gray-50 text-sm text-slate-500">
          Loading...
        </div>
      }
    >
      <UserRoleContent />
    </Suspense>
  );
}
