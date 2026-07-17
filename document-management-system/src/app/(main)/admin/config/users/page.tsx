"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  User,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/providers/ToastProvider";
import {
  DEPARTMENTS,
  POSITIONS,
} from "@/features/master-data";
import {
  MOCK_USERS,
  prependConfigUser,
  syncMockUsers,
  updateConfigUser,
  USER_ROLE_OPTIONS,
  type ConfigUser,
} from "@/features/roles-users";
import {
  ADMIN_CONTENT,
  ADMIN_PAGE_SHELL,
  AdminPageHeader,
  MD_ADD_BTN,
  MD_TABLE_CARD,
  MD_TD,
  MD_TD_ACTION,
  MD_TD_MUTED,
  MD_TD_STATUS,
  MD_TH,
  MD_TH_CENTER,
  MD_TH_RIGHT,
  MD_TH_STATUS,
  MD_THEAD,
  MD_TR,
  StatCards,
  StatusBadge,
  StatusFormToggle,
} from "@/components/ui/admin";
import { APP_CARD_LG } from "@/components/ui/design-system";

const CARD = APP_CARD_LG;
const CARD_HEADER_LABEL = "text-[11px] font-bold uppercase tracking-wider text-slate-400";
const BTN_SECONDARY =
  "inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50";

const ROLE_BADGE: Record<string, string> = {
  Administrator: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  Executive: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  Manager: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  Employee: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserForm = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  joinedAt: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof UserForm, string>>;

const DEPARTMENT_OPTIONS = DEPARTMENTS.filter((d) => d.isActive).map((d) => d.name);

const EMPTY_USER: UserForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  joinedAt: "",
  department: DEPARTMENT_OPTIONS[0] ?? "",
  position: "",
  role: USER_ROLE_OPTIONS[0],
  isActive: true,
};

const inputClsCreate =
  "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const inputErrorClsCreate =
  "w-full rounded-xl border border-red-300 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100";

const thCls = MD_TH;
const tdCls = MD_TD;
const tdMuted = MD_TD_MUTED;
const btnIcon =
  "rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50";
const btnIconDanger =
  "rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50";
const inputCls =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const inputErrorCls =
  "w-full rounded-md border border-red-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function userToForm(user: ConfigUser): UserForm {
  return {
    fullName: user.fullName,
    email: user.email,
    password: "",
    phone: user.phone ?? "",
    joinedAt: user.joinedAt ?? "",
    department: user.department,
    position: user.position,
    role: user.role,
    isActive: user.isActive,
  };
}

function CardSectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  description,
}: {
  icon: typeof User;
  iconBg: string;
  iconColor: string;
  label: string;
  description?: string;
}) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-5">
      <div className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        <span className={CARD_HEADER_LABEL}>{label}</span>
      </div>
      {description ? <p className="mt-3 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

function CreateUserPreview({ form }: { form: UserForm }) {
  const displayName = form.fullName.trim() || "ชื่อผู้ใช้งาน";
  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    return parts
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  const joinedLabel = form.joinedAt
    ? new Date(form.joinedAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="flex min-h-[280px] flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-start gap-4">
        <Avatar className="size-16 shrink-0 ring-2 ring-white">
          <AvatarFallback className="bg-indigo-100 text-lg font-semibold text-indigo-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold tracking-tight text-slate-900">{displayName}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {form.email.trim() || "อีเมล@company.com"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium ${
                ROLE_BADGE[form.role] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
              }`}
            >
              {form.role}
            </span>
            <StatusBadge active={form.isActive} />
          </div>
        </div>
      </div>

      <dl className="mt-5 space-y-3 border-t border-slate-200/80 pt-5 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-slate-500">แผนก</dt>
          <dd className="text-right font-medium text-slate-800">{form.department || "—"}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-slate-500">ตำแหน่ง</dt>
          <dd className="text-right font-medium text-slate-800">{form.position || "—"}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-slate-500">เบอร์โทร</dt>
          <dd className="text-right font-medium text-slate-800">{form.phone.trim() || "—"}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-slate-500">วันที่เริ่มงาน</dt>
          <dd className="text-right font-medium text-slate-800">{joinedLabel}</dd>
        </div>
      </dl>

      <p className="mt-auto pt-4 text-xs text-slate-400">
        ตัวอย่างการแสดงผล — อัปเดตตามข้อมูลที่กรอก
      </p>
    </div>
  );
}

function isCreateFormComplete(form: UserForm): boolean {
  return (
    !!form.fullName.trim() &&
    !!form.email.trim() &&
    EMAIL_RE.test(form.email.trim()) &&
    form.password.length >= 8 &&
    !!form.department &&
    !!form.position &&
    !!form.role
  );
}

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    Administrator: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    Executive: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    Manager: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    Employee: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
  };
  return (
    <span
      className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
        colors[role] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
      }`}
    >
      {role}
    </span>
  );
}

function UsersListView({
  users,
  onUsersChange,
  onCreate,
}: {
  users: ConfigUser[];
  onUsersChange: (next: ConfigUser[]) => void;
  onCreate: () => void;
}) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editUser, setEditUser] = useState<ConfigUser | null>(null);
  const [resetUser, setResetUser] = useState<ConfigUser | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (!showInactive && !u.isActive) return false;
      if (showInactive && u.isActive) return false;
      if (deptFilter && u.department !== deptFilter) return false;
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      if (q && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, deptFilter, roleFilter, statusFilter, showInactive]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    return { total: users.length, active, inactive: users.length - active };
  }, [users]);

  const handleToggleStatus = async (user: ConfigUser) => {
    const next = !user.isActive;
    if (!confirm(`${next ? "เปิดใช้งาน" : "ปิดใช้งาน"} ${user.fullName}?`)) return;
    setTogglingId(user.id);
    await new Promise((r) => setTimeout(r, 500));
    updateConfigUser(user.id, { isActive: next });
    onUsersChange([...MOCK_USERS]);
    setTogglingId(null);
    showToast(next ? "เปิดใช้งานผู้ใช้สำเร็จ" : "ปิดใช้งานผู้ใช้สำเร็จ", "success");
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <AdminPageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <Link href="/admin/config" className="text-slate-500 hover:text-slate-600">
              Config
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-600">Users</span>
          </nav>
        }
        title="Users"
        subtitle="In-memory demo — resets on refresh"
        actions={
          <button type="button" onClick={onCreate} className={MD_ADD_BTN}>
            <Plus className="size-4" />
            สร้างผู้ใช้งาน
          </button>
        }
      />

      <div className={`${ADMIN_CONTENT} mt-6 space-y-6`}>
        <StatCards total={stats.total} active={stats.active} inactive={stats.inactive} icon={Users} />

        <div className={MD_TABLE_CARD}>
          <div className="space-y-3 border-b border-slate-100 bg-slate-50/40 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อหรืออีเมล..."
                className={`${inputCls} pl-9`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <select className={inputCls} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  <option value="">ทุกแผนก</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select className={inputCls} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">ทุก Role</option>
                  {USER_ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">ทุกสถานะ</option>
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ปิดใช้งาน</option>
                </select>
              </div>
              <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-200"
                />
                แสดงรายการที่ปิดใช้งาน
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={MD_THEAD}>
                <tr>
                  <th className={thCls}>ชื่อ-สกุล</th>
                  <th className={thCls}>อีเมล</th>
                  <th className={thCls}>แผนก</th>
                  <th className={thCls}>ตำแหน่ง</th>
                  <th className={MD_TH_CENTER}>Role</th>
                  <th className={MD_TH_STATUS}>สถานะ</th>
                  <th className={MD_TH_RIGHT}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      ไม่พบผู้ใช้งาน
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className={MD_TR}>
                      <td className={`${tdCls} font-medium`}>{user.fullName}</td>
                      <td className={tdMuted}>{user.email}</td>
                      <td className={tdMuted}>{user.department}</td>
                      <td className={tdMuted}>{user.position}</td>
                      <td className={`${tdCls} text-center`}>{roleBadge(user.role)}</td>
                      <td className={MD_TD_STATUS}>
                        <StatusBadge active={user.isActive} />
                      </td>
                      <td className={MD_TD_ACTION}>
                        <div className="inline-flex items-center divide-x divide-gray-200 rounded-md border border-transparent">
                          <button
                            type="button"
                            title="แก้ไข"
                            onClick={() => setEditUser(user)}
                            className={btnIcon}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            title="รีเซ็ตรหัสผ่าน"
                            onClick={() => setResetUser(user)}
                            className={btnIcon}
                          >
                            <KeyRound className="size-4" />
                          </button>
                          <button
                            type="button"
                            title={user.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                            onClick={() => handleToggleStatus(user)}
                            disabled={togglingId === user.id}
                            className={btnIconDanger}
                          >
                            {togglingId === user.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : user.isActive ? (
                              <UserX className="size-4" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={(updated) => {
            updateConfigUser(updated.id, updated);
            onUsersChange([...MOCK_USERS]);
            setEditUser(null);
            showToast("แก้ไขผู้ใช้งานสำเร็จ", "success");
          }}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSaved={() => {
            onUsersChange([...MOCK_USERS]);
            setResetUser(null);
            showToast("เปลี่ยนรหัสผ่านสำเร็จ", "success");
          }}
        />
      )}
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: ConfigUser;
  onClose: () => void;
  onSaved: (user: ConfigUser) => void;
}) {
  const [form, setForm] = useState<UserForm>(() => userToForm(user));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = "กรุณากรอกชื่อ-สกุล";
    if (!form.email.trim()) next.email = "กรุณากรอกอีเมล";
    else if (!EMAIL_RE.test(form.email.trim())) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!form.department) next.department = "กรุณาเลือกแผนก";
    if (!form.position) next.position = "กรุณาเลือกตำแหน่ง";
    if (!form.role) next.role = "กรุณาเลือก Role";
    return next;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    onSaved({
      ...user,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      department: form.department,
      position: form.position,
      role: form.role,
      isActive: form.isActive,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-medium text-slate-800">แก้ไขผู้ใช้งาน</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>
        <UserFormFields form={form} setForm={setForm} errors={errors} setErrors={setErrors} includePassword={false} />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ResetPasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

type ResetPasswordErrors = Partial<Record<keyof ResetPasswordForm, string>>;

function ResetPasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: ConfigUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ResetPasswordForm>({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const validate = (): ResetPasswordErrors => {
    const next: ResetPasswordErrors = {};
    if (!form.newPassword) next.newPassword = "กรุณากรอกรหัสผ่านใหม่";
    else if (form.newPassword.length < 8) next.newPassword = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (!form.confirmPassword) next.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่";
    else if (form.newPassword !== form.confirmPassword) {
      next.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }
    return next;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    updateConfigUser(user.id, { password: form.newPassword });
    setSaving(false);
    onSaved();
  };

  const labelCls = "mb-1.5 block text-xs text-slate-500";

  const renderPasswordField = (
    key: keyof ResetPasswordForm,
    label: string,
    show: boolean,
    onToggle: () => void
  ) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={form[key]}
          onChange={(e) => {
            setForm((p) => ({ ...p, [key]: e.target.value }));
            if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
          }}
          className={`${errors[key] ? inputErrorCls : inputCls} pr-10`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-slate-800">ตั้งรหัสผ่านใหม่</h2>
            <p className="mt-1 text-xs text-slate-500">{user.fullName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {renderPasswordField("newPassword", "รหัสผ่านใหม่", showNew, () => setShowNew((v) => !v))}
          {renderPasswordField(
            "confirmPassword",
            "ยืนยันรหัสผ่านใหม่",
            showConfirm,
            () => setShowConfirm((v) => !v)
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={MD_ADD_BTN}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserFormFields({
  form,
  setForm,
  errors,
  setErrors,
  includePassword,
  layout = "default",
}: {
  form: UserForm;
  setForm: React.Dispatch<React.SetStateAction<UserForm>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  includePassword: boolean;
  layout?: "default" | "create";
}) {
  const [showPassword, setShowPassword] = useState(false);

  const positionsForDept = useMemo(
    () =>
      POSITIONS.filter((p) => p.isActive && p.department === form.department).map(
        (p) => p.name
      ),
    [form.department]
  );

  const positionOptions =
    positionsForDept.length > 0 ? positionsForDept : POSITIONS.filter((p) => p.isActive).map((p) => p.name);

  const isCreateLayout = layout === "create";
  const fieldStackCls = isCreateLayout ? "flex flex-col gap-5" : "mt-4 space-y-3";
  const labelCls = "mb-1.5 block text-xs font-medium text-slate-500";
  const fieldInputCls = (key: keyof UserForm) =>
    isCreateLayout
      ? errors[key]
        ? inputErrorClsCreate
        : inputClsCreate
      : errors[key]
        ? inputErrorCls
        : inputCls;

  const fullNameField = (
    <div>
      <label className={labelCls}>ชื่อ-สกุล</label>
      <input
        type="text"
        value={form.fullName}
        onChange={(e) => {
          setForm((p) => ({ ...p, fullName: e.target.value }));
          if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }));
        }}
        className={fieldInputCls("fullName")}
      />
      {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
    </div>
  );

  const emailField = (
    <div>
      <label className={labelCls}>อีเมล</label>
      <input
        type="email"
        value={form.email}
        onChange={(e) => {
          setForm((p) => ({ ...p, email: e.target.value }));
          if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
        }}
        className={fieldInputCls("email")}
      />
      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
    </div>
  );

  const passwordField = includePassword ? (
    <div>
      <label className={labelCls}>รหัสผ่าน</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => {
            setForm((p) => ({ ...p, password: e.target.value }));
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          className={`${fieldInputCls("password")} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {isCreateLayout && !errors.password ? (
        <p className="mt-1.5 text-xs text-slate-400">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
      ) : null}
      {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
    </div>
  ) : null;

  const phoneField = (
    <div>
      <label className={labelCls}>เบอร์โทร</label>
      <input
        type="tel"
        value={form.phone}
        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        placeholder="081-234-5678"
        className={fieldInputCls("phone")}
      />
    </div>
  );

  const joinedAtField = (
    <div>
      <label className={labelCls}>วันที่เริ่มงาน</label>
      <input
        type="date"
        value={form.joinedAt}
        onChange={(e) => setForm((p) => ({ ...p, joinedAt: e.target.value }))}
        className={fieldInputCls("joinedAt")}
      />
    </div>
  );

  const departmentField = (
    <div>
      <label className={labelCls}>แผนก</label>
      <select
        value={form.department}
        onChange={(e) => {
          const department = e.target.value;
          const nextPositions = POSITIONS.filter(
            (p) => p.isActive && p.department === department
          ).map((p) => p.name);
          setForm((p) => ({
            ...p,
            department,
            position: nextPositions.includes(p.position) ? p.position : (nextPositions[0] ?? ""),
          }));
          if (errors.department) setErrors((p) => ({ ...p, department: undefined }));
        }}
        className={fieldInputCls("department")}
      >
        {DEPARTMENT_OPTIONS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
    </div>
  );

  const positionField = (
    <div>
      <label className={labelCls}>ตำแหน่ง</label>
      <select
        value={form.position}
        onChange={(e) => {
          setForm((p) => ({ ...p, position: e.target.value }));
          if (errors.position) setErrors((p) => ({ ...p, position: undefined }));
        }}
        className={fieldInputCls("position")}
      >
        {positionOptions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position}</p>}
    </div>
  );

  const roleField = (
    <div>
      <label className={labelCls}>Role</label>
      <select
        value={form.role}
        onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
        className={fieldInputCls("role")}
      >
        {USER_ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );

  const statusField = (
    <StatusFormToggle
      active={form.isActive}
      onChange={(isActive) => setForm((p) => ({ ...p, isActive }))}
    />
  );

  if (isCreateLayout) {
    return (
      <div className={fieldStackCls}>
        {fullNameField}
        {emailField}
        {passwordField}
        <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
          {phoneField}
          {joinedAtField}
        </div>
        <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
          {departmentField}
          {positionField}
        </div>
        <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2 md:items-end">
          {roleField}
          {statusField}
        </div>
      </div>
    );
  }

  return (
    <div className={fieldStackCls}>
      {fullNameField}
      {emailField}
      {passwordField}
      {departmentField}
      {positionField}
      {roleField}
      {statusField}
    </div>
  );
}

function CreateUserForm({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: (user: ConfigUser) => void;
}) {
  const { showToast } = useToast();
  const initialDept = DEPARTMENT_OPTIONS[0] ?? "";
  const initialPositions = POSITIONS.filter(
    (p) => p.isActive && p.department === initialDept
  ).map((p) => p.name);
  const [user, setUser] = useState<UserForm>({
    ...EMPTY_USER,
    department: initialDept,
    position: initialPositions[0] ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => isCreateFormComplete(user), [user]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!user.fullName.trim()) next.fullName = "กรุณากรอกชื่อ-สกุล";
    if (!user.email.trim()) next.email = "กรุณากรอกอีเมล";
    else if (!EMAIL_RE.test(user.email.trim())) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!user.password) next.password = "กรุณากรอกรหัสผ่าน";
    else if (user.password.length < 8) next.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (!user.department) next.department = "กรุณาเลือกแผนก";
    if (!user.position) next.position = "กรุณาเลือกตำแหน่ง";
    if (!user.role) next.role = "กรุณาเลือก Role";
    return next;
  };

  const handleBack = () => {
    const hasData =
      user.fullName.trim() ||
      user.email.trim() ||
      user.password ||
      user.phone.trim() ||
      user.joinedAt ||
      user.department !== initialDept ||
      user.position !== (initialPositions[0] ?? "") ||
      user.role !== USER_ROLE_OPTIONS[0] ||
      !user.isActive;
    if (hasData && !confirm("ยังไม่ได้บันทึกข้อมูล ต้องการออกจากหน้านี้หรือไม่?")) return;
    onBack();
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const saved: ConfigUser = {
      id: uid(),
      fullName: user.fullName.trim(),
      email: user.email.trim(),
      department: user.department,
      position: user.position,
      role: user.role,
      isActive: user.isActive,
      password: user.password,
      ...(user.phone.trim() ? { phone: user.phone.trim() } : {}),
      ...(user.joinedAt ? { joinedAt: user.joinedAt } : {}),
    };
    onSaved(saved);
    setSaving(false);
    showToast("สร้างผู้ใช้งานสำเร็จ", "success");
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_CONTENT}>
        <AdminPageHeader
          breadcrumb={
            <nav className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Admin</span>
              <span>/</span>
              <Link href="/admin/config" className="text-slate-500 hover:text-slate-600">
                Config
              </Link>
              <span>/</span>
              <Link href="/admin/config/users" className="text-slate-500 hover:text-slate-600">
                Users
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-600">สร้างผู้ใช้งาน</span>
            </nav>
          }
          title="สร้างผู้ใช้งาน"
          subtitle="In-memory demo — resets on refresh"
          actions={
            <div className="relative z-30 flex shrink-0 items-center gap-3">
              <button type="button" onClick={handleBack} className={BTN_SECONDARY}>
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !canSave}
                className={`${MD_ADD_BTN} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          <section className={CARD}>
            <CardSectionHeader
              icon={User}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="ข้อมูลทั่วไป"
              description="กรอกข้อมูลผู้ใช้งานใหม่ — ช่องที่มี * จำเป็นต้องกรอก"
            />
            <UserFormFields
              form={user}
              setForm={setUser}
              errors={errors}
              setErrors={setErrors}
              includePassword={true}
              layout="create"
            />
          </section>

          <section className={CARD}>
            <CardSectionHeader
              icon={Eye}
              iconBg="bg-violet-50"
              iconColor="text-violet-600"
              label="ตัวอย่าง"
              description="แสดงตัวอย่างโปรไฟล์ผู้ใช้งานตามข้อมูลที่กรอก"
            />
            <CreateUserPreview form={user} />
          </section>
        </div>
      </div>
    </div>
  );
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("mode") === "new";
  const [users, setUsers] = useState<ConfigUser[]>(MOCK_USERS);

  if (isCreateMode) {
    return (
      <CreateUserForm
        onBack={() => router.push("/admin/config/users")}
        onSaved={(saved) => {
          prependConfigUser(saved);
          syncMockUsers();
          setUsers([...MOCK_USERS]);
          router.push("/admin/config/users");
        }}
      />
    );
  }

  return (
    <UsersListView
      users={users}
      onUsersChange={setUsers}
      onCreate={() => router.push("/admin/config/users?mode=new")}
    />
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="h-fit w-full" />}>
      <UsersPageContent />
    </Suspense>
  );
}
