"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Search,
  Shield,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  RolePermissionPanel,
  RoleProductTypesField,
  buildPermissions,
  summarizePermissions,
  type RoleFormState,
} from "@/components/admin/role-permissions";
import {
  MOCK_ROLES,
  countUsersByRole,
  deactivateRole,
  prependRole,
  type RoleRecord,
} from "@/lib/config-mock";
import {
  ADMIN_CONTENT,
  AdminPageHeader,
  MD_ADD_BTN,
  MD_TABLE_CARD,
  MD_TD,
  MD_TD_MUTED,
  MD_TR,
  StatCards,
  StatusBadge,
} from "../../master-data/master-data-ui";

const PERMISSION_ACTION_TH: Record<string, string> = {
  View: "ดู",
  Create: "สร้าง",
  Edit: "แก้ไข",
  Delete: "ลบ",
  Approve: "อนุมัติ",
};

const permBadgeCls =
  "inline-flex h-6 shrink-0 items-center rounded-md px-2.5 text-xs font-medium leading-none";

const SENIOR_MANAGER_PRESETS: Record<string, Record<string, Partial<Record<string, boolean>>>> = {
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

const EMPTY_ROLE: RoleFormState = {
  title: "",
  productTypes: { all: false, dms: false, esign: false, reports: false, archive: false },
  permissions: buildPermissions(),
};

const EDIT_ROLE: RoleFormState = {
  title: "Senior manager",
  productTypes: { all: true, dms: true, esign: true, reports: true, archive: true },
  permissions: buildPermissions(SENIOR_MANAGER_PRESETS),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const listThCls =
  "px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const listThRightCls =
  "px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const listTheadCls = "border-b border-slate-100 bg-slate-50";
const tdCls = MD_TD;
const tdMuted = MD_TD_MUTED;
const btnGhost = "rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100";
const btnDanger =
  "rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent";
const inputCls =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const formInputCls =
  "w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const inputErrorCls =
  "w-full max-w-md rounded-md border border-red-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

function translatePermissionParts(summary: string): string[] {
  if (summary === "Full access") return ["เข้าถึงทั้งหมด"];
  if (summary === "No permissions") return ["ไม่มีสิทธิ์"];
  return summary
    .split(", ")
    .filter(Boolean)
    .map((part) => PERMISSION_ACTION_TH[part] ?? part);
}

function permissionBadges(summary: string, roleName: string) {
  const isFullAccess = summary === "Full access" || roleName === "Administrator";
  if (isFullAccess) {
    return (
      <span className={`${permBadgeCls} bg-violet-50 text-violet-700 ring-1 ring-violet-200/70`}>
        เข้าถึงทั้งหมด
      </span>
    );
  }
  const parts = translatePermissionParts(summary);
  return (
    <div className="flex max-w-xs flex-wrap gap-2">
      {parts.map((part) => (
        <span key={part} className={`${permBadgeCls} bg-blue-50 text-blue-700 ring-1 ring-blue-100`}>
          {part}
        </span>
      ))}
    </div>
  );
}

function statusBadge(active: boolean) {
  return <StatusBadge active={active} />;
}

function DeleteRoleButton({
  blocked,
  tooltip,
  onDelete,
}: {
  blocked: boolean;
  tooltip: string;
  onDelete: () => void;
}) {
  return (
    <span className="group relative inline-flex">
      <button type="button" onClick={onDelete} disabled={blocked} className={btnDanger}>
        ลบ
      </button>
      {blocked && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 hidden w-64 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg group-hover:block"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

function RolesListView({
  roles,
  onRolesChange,
  onCreate,
}: {
  roles: RoleRecord[];
  onRolesChange: (next: RoleRecord[]) => void;
  onCreate: () => void;
}) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const rows = useMemo(
    () =>
      roles.map((role) => ({
        ...role,
        userCount: countUsersByRole(role.name),
      })),
    [roles]
  );

  const stats = useMemo(
    () => ({
      total: roles.length,
      active: roles.filter((r) => r.isActive).length,
      inactive: roles.filter((r) => !r.isActive).length,
    }),
    [roles]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((role) => {
      if (!showInactive && !role.isActive) return false;
      if (showInactive && role.isActive) return false;
      if (q && !role.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, showInactive]);

  const handleDelete = (role: (typeof rows)[number]) => {
    if (role.userCount > 0) return;
    if (!confirm(`ต้องการปิดใช้งาน Role "${role.name}" หรือไม่?`)) return;
    deactivateRole(role.id);
    onRolesChange([...MOCK_ROLES]);
    showToast("ปิดใช้งาน Role สำเร็จ", "success");
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <AdminPageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <Link href="/admin/config" className="text-slate-500 hover:text-slate-600">
              Config
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-600">Roles</span>
          </nav>
        }
        title="Roles"
        subtitle="In-memory demo — resets on refresh"
        actions={
          <button type="button" onClick={onCreate} className={MD_ADD_BTN}>
            <Plus className="size-4" />
            สร้าง Role
          </button>
        }
      />

      <div className={`${ADMIN_CONTENT} mt-6`}>
        <div className={MD_TABLE_CARD}>
          <div className="space-y-3 border-b border-slate-100 bg-slate-50/40 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ Role..."
                className={`${inputCls} pl-9`}
              />
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-200 text-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              แสดง Role ที่ปิดใช้งาน
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={listTheadCls}>
                <tr>
                  <th className={listThCls}>ชื่อ Role</th>
                  <th className={listThCls}>จำนวนผู้ใช้งาน</th>
                  <th className={listThCls}>สิทธิ์หลัก</th>
                  <th className={listThCls}>สถานะ</th>
                  <th className={listThRightCls}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      {showInactive ? "ไม่มี Role ที่ปิดใช้งาน" : "ไม่พบ Role"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((role) => {
                    const deleteBlocked = role.userCount > 0;
                    const deleteTooltip = `ไม่สามารถลบได้ เนื่องจากมีผู้ใช้งาน ${role.userCount} คนใช้ Role นี้อยู่`;
                    return (
                      <tr key={role.id} className={MD_TR}>
                        <td className={`${tdCls} font-medium`}>{role.name}</td>
                        <td className={tdMuted}>{role.userCount}</td>
                        <td className={tdCls}>{permissionBadges(role.permissionSummary, role.name)}</td>
                        <td className={tdCls}>{statusBadge(role.isActive)}</td>
                        <td className={`${tdCls} text-right`}>
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/admin/config/roles?mode=edit&id=${role.id}`}
                              className={btnGhost}
                            >
                              แก้ไข
                            </Link>
                            <DeleteRoleButton
                              blocked={deleteBlocked}
                              tooltip={deleteTooltip}
                              onDelete={() => handleDelete(role)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <StatCards total={stats.total} active={stats.active} inactive={stats.inactive} icon={Shield} />
      </div>
    </div>
  );
}

function CreateRoleForm({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: (role: RoleRecord) => void;
}) {
  const { showToast } = useToast();
  const [role, setRole] = useState<RoleFormState>(EMPTY_ROLE);
  const [titleError, setTitleError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const validateTitle = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return "กรุณากรอกชื่อ Role";
    if (MOCK_ROLES.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      return "ชื่อ Role นี้ถูกใช้งานแล้ว";
    }
    return "";
  };

  const handleBack = () => {
    if (dirty && !confirm("ยังไม่ได้บันทึกข้อมูล ต้องการออกจากหน้านี้หรือไม่?")) return;
    onBack();
  };

  const handleSave = async () => {
    const err = validateTitle(role.title);
    setTitleError(err);
    if (err) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const saved: RoleRecord = {
      id: uid(),
      name: role.title.trim(),
      permissionSummary: summarizePermissions(role.permissions),
      isActive: true,
    };
    onSaved(saved);
    setSaving(false);
    showToast("สร้าง Role สำเร็จ", "success");
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <AdminPageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <Link href="/admin/config" className="text-slate-500 hover:text-slate-600">
              Config
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-600">Create role</span>
          </nav>
        }
        title="Create role"
        subtitle="In-memory demo — resets on refresh"
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBack} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={MD_ADD_BTN}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        }
      />
      <div className="mt-6 px-0">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Title</label>
              <input
                type="text"
                value={role.title}
                onChange={(e) => {
                  setDirty(true);
                  setRole((prev) => ({ ...prev, title: e.target.value }));
                  if (titleError) setTitleError(validateTitle(e.target.value));
                }}
                onBlur={() => setTitleError(validateTitle(role.title))}
                className={titleError ? inputErrorCls : formInputCls}
              />
              {titleError && <p className="mt-1 text-xs text-red-500">{titleError}</p>}
            </div>
            <RoleProductTypesField
              productTypes={role.productTypes}
              onChange={(productTypes) => {
                setDirty(true);
                setRole((prev) => ({ ...prev, productTypes }));
              }}
            />
          </div>
        </div>
        <RolePermissionPanel
          role={role}
          onChange={(next) => {
            setDirty(true);
            setRole(next);
          }}
        />
      </div>
    </div>
  );
}

function EditRoleForm() {
  const { showToast } = useToast();
  const [role, setRole] = useState<RoleFormState>(EDIT_ROLE);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    showToast("บันทึกสิทธิ์สำเร็จ", "success");
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <AdminPageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <Link href="/admin/config" className="text-slate-500 hover:text-slate-600">
              Config
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-600">User role</span>
          </nav>
        }
        title="User role"
        subtitle="In-memory demo — resets on refresh"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/config/roles" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Back
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={MD_ADD_BTN}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        }
      />
      <div className="mt-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Title</label>
              <input
                type="text"
                value={role.title}
                onChange={(e) => setRole((prev) => ({ ...prev, title: e.target.value }))}
                className={formInputCls}
              />
            </div>
            <RoleProductTypesField
              productTypes={role.productTypes}
              onChange={(productTypes) => setRole((prev) => ({ ...prev, productTypes }))}
            />
          </div>
        </div>
        <RolePermissionPanel role={role} onChange={setRole} />
      </div>
    </div>
  );
}

function RolesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const [roles, setRoles] = useState<RoleRecord[]>(MOCK_ROLES);

  if (mode === "new") {
    return (
      <CreateRoleForm
        onBack={() => router.push("/admin/config/roles")}
        onSaved={(saved) => {
          prependRole(saved);
          setRoles([...MOCK_ROLES]);
          router.push("/admin/config/roles");
        }}
      />
    );
  }

  if (mode === "edit") {
    return <EditRoleForm />;
  }

  return (
    <RolesListView
      roles={roles}
      onRolesChange={setRoles}
      onCreate={() => router.push("/admin/config/roles?mode=new")}
    />
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<div className="h-fit w-full" />}>
      <RolesPageContent />
    </Suspense>
  );
}
