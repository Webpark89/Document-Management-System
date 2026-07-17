"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  DEPARTMENTS,
  MOCK_USERS,
  POSITIONS,
  prependConfigUser,
  syncMockUsers,
  updateConfigUser,
  USER_ROLE_OPTIONS,
  type ConfigUser,
} from "@/lib/config-mock";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserForm = {
  fullName: string;
  email: string;
  password: string;
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
  department: DEPARTMENT_OPTIONS[0] ?? "",
  position: "",
  role: USER_ROLE_OPTIONS[0],
  isActive: true,
};

const thCls = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
const tdCls = "px-6 py-3 text-left text-sm text-slate-700";
const tdMuted = "px-6 py-3 text-left text-sm text-slate-500";
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
    department: user.department,
    position: user.position,
    role: user.role,
    isActive: user.isActive,
  };
}

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    Administrator: "bg-violet-50 text-violet-700",
    Executive: "bg-amber-50 text-amber-700",
    Manager: "bg-blue-50 text-blue-700",
    Employee: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${colors[role] ?? "bg-slate-100 text-slate-600"}`}>
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
  const [resettingId, setResettingId] = useState<string | null>(null);
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

  const handleResetPassword = async (user: ConfigUser) => {
    if (!confirm(`รีเซ็ตรหัสผ่านสำหรับ ${user.fullName}?`)) return;
    setResettingId(user.id);
    await new Promise((r) => setTimeout(r, 500));
    setResettingId(null);
    showToast("รีเซ็ตรหัสผ่านสำเร็จ (รหัสผ่านชั่วคราวถูกส่งไปยังอีเมล)", "success");
  };

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
    <div className="h-fit w-full bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <Link href="/admin/config" className="text-slate-500 hover:text-slate-600">
            Config
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-600">Users</span>
        </nav>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Users</h1>
            <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            สร้างผู้ใช้งาน
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-gray-200 bg-slate-50/80 p-4">
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className={thCls}>ชื่อ-สกุล</th>
                  <th className={thCls}>อีเมล</th>
                  <th className={thCls}>แผนก</th>
                  <th className={thCls}>ตำแหน่ง</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>สถานะ</th>
                  <th className={`${thCls} text-right`}>จัดการ</th>
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
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                    >
                      <td className={`${tdCls} font-medium`}>{user.fullName}</td>
                      <td className={tdMuted}>{user.email}</td>
                      <td className={tdMuted}>{user.department}</td>
                      <td className={tdMuted}>{user.position}</td>
                      <td className={tdCls}>{roleBadge(user.role)}</td>
                      <td className={tdCls}>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
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
                            onClick={() => handleResetPassword(user)}
                            disabled={resettingId === user.id}
                            className={btnIcon}
                          >
                            {resettingId === user.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <KeyRound className="size-4" />
                            )}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex h-full min-h-[88px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Users className="size-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">ผู้ใช้งานทั้งหมด</p>
            </div>
          </div>
          <div className="flex h-full min-h-[88px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-800">{stats.active}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
          <div className="flex h-full min-h-[88px] items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <Trash2 className="size-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-800">{stats.inactive}</p>
              <p className="text-xs text-slate-500">Inactive</p>
            </div>
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
        className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
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
  const fieldCls = (key: keyof UserForm) => (errors[key] ? inputErrorCls : inputCls);

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
  const fieldStackCls = isCreateLayout ? "mt-5 flex flex-col gap-5" : "mt-4 space-y-3";
  const labelCls = "mb-1.5 block text-xs text-slate-500";

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
        className={fieldCls("fullName")}
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
        className={fieldCls("email")}
      />
      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
    </div>
  );

  const passwordField = includePassword ? (
    <div>
      <label className={labelCls}>Password</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => {
            setForm((p) => ({ ...p, password: e.target.value }));
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          className={`${fieldCls("password")} pr-10`}
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
      {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
    </div>
  ) : null;

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
        className={fieldCls("department")}
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
        className={fieldCls("position")}
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
        className={fieldCls("role")}
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
    <div>
      <p className={labelCls}>สถานะ</p>
      <div className="inline-flex rounded-md border border-gray-200 p-0.5">
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, isActive: true }))}
          className={`rounded px-4 py-1.5 text-sm font-medium ${
            form.isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, isActive: false }))}
          className={`rounded px-4 py-1.5 text-sm font-medium ${
            !form.isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
          }`}
        >
          Inactive
        </button>
      </div>
    </div>
  );

  if (isCreateLayout) {
    return (
      <div className={fieldStackCls}>
        {fullNameField}
        {emailField}
        {passwordField}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {departmentField}
          {positionField}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-end">
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
    };
    onSaved(saved);
    setSaving(false);
    showToast("สร้างผู้ใช้งานสำเร็จ", "success");
  };

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
          <span className="font-medium text-slate-600">Create user</span>
        </nav>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Create user</h1>
            <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBack} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-gray-100">
              Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>
      <div className="px-6 py-6">
        <div className="max-w-2xl rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-sm font-medium text-slate-800">Information</h2>
          <UserFormFields
            form={user}
            setForm={setUser}
            errors={errors}
            setErrors={setErrors}
            includePassword={true}
            layout="create"
          />
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
    <Suspense fallback={<div className="h-fit w-full bg-gray-50" />}>
      <UsersPageContent />
    </Suspense>
  );
}
