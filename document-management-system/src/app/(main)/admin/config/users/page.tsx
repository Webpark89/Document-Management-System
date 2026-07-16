"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

const DEPARTMENTS = ["Finance", "Purchasing", "Warehouse", "IT"] as const;
const POSITIONS = ["Employee", "Supervisor", "Manager", "Executive"] as const;
const ROLE_OPTIONS = ["Employee", "Manager", "Executive", "Administrator"] as const;

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

type SavedUser = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof UserForm, string>>;

const EMPTY_USER: UserForm = {
  fullName: "",
  email: "",
  password: "",
  department: DEPARTMENTS[0],
  position: POSITIONS[0],
  role: ROLE_OPTIONS[0],
  isActive: true,
};

let MOCK_USERS: SavedUser[] = [
  {
    id: "1",
    fullName: "Somchai Jaidee",
    email: "somchai@company.com",
    department: "Purchasing",
    position: "Manager",
    role: "Manager",
    isActive: true,
  },
  {
    id: "2",
    fullName: "Suda Wongsri",
    email: "suda@company.com",
    department: "Finance",
    position: "Supervisor",
    role: "Employee",
    isActive: true,
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isFormDirty(form: UserForm) {
  return JSON.stringify(form) !== JSON.stringify(EMPTY_USER);
}

const inputCls =
  "w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const inputErrorCls =
  "w-full max-w-md rounded-md border border-red-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

function UsersListView({ users, onCreate }: { users: SavedUser[]; onCreate: () => void }) {
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Users</h1>
            <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Create user
          </button>
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs text-slate-500">
                <th className="h-10 px-5 text-left font-medium">Full name</th>
                <th className="h-10 px-5 text-left font-medium">Email</th>
                <th className="h-10 px-5 text-left font-medium">Department</th>
                <th className="h-10 px-5 text-left font-medium">Position</th>
                <th className="h-10 px-5 text-left font-medium">Role</th>
                <th className="h-10 px-5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No users yet
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <td className="h-12 px-5 text-slate-700">{user.fullName}</td>
                    <td className="h-12 px-5 text-slate-600">{user.email}</td>
                    <td className="h-12 px-5 text-slate-600">{user.department}</td>
                    <td className="h-12 px-5 text-slate-600">{user.position}</td>
                    <td className="h-12 px-5 text-slate-600">{user.role}</td>
                    <td className="h-12 px-5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateUserForm({
  onBack,
  onSaved,
}: {
  onBack: () => void;
  onSaved: (user: SavedUser) => void;
}) {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserForm>(EMPTY_USER);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const validate = (form: UserForm): FormErrors => {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!EMAIL_RE.test(form.email.trim())) next.email = "Invalid email format";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (!form.department) next.department = "Department is required";
    if (!form.position) next.position = "Position is required";
    if (!form.role) next.role = "Role is required";
    return next;
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (!user.email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
    } else if (!EMAIL_RE.test(user.email.trim())) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const handleBack = () => {
    if (isFormDirty(user)) {
      if (!confirm("Discard unsaved changes?")) return;
    }
    onBack();
  };

  const handleSave = async () => {
    const nextErrors = validate(user);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const saved: SavedUser = {
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

  const fieldCls = (key: keyof UserForm) => (errors[key] ? inputErrorCls : inputCls);

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
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-gray-100"
            >
              Back
            </button>
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
              <label className="mb-1.5 block text-xs text-slate-500">Full name</label>
              <input
                type="text"
                value={user.fullName}
                onChange={(e) => {
                  setUser((prev) => ({ ...prev, fullName: e.target.value }));
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="e.g. Somchai Jaidee"
                className={fieldCls("fullName")}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Email</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => {
                  setUser((prev) => ({ ...prev, email: e.target.value }));
                  if (errors.email && emailTouched) handleEmailBlur();
                }}
                onBlur={handleEmailBlur}
                placeholder="user@company.com"
                className={fieldCls("email")}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Password</label>
              <div className="relative max-w-md">
                <input
                  type={showPassword ? "text" : "password"}
                  value={user.password}
                  onChange={(e) => {
                    setUser((prev) => ({ ...prev, password: e.target.value }));
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter password"
                  className={`${fieldCls("password")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Department</label>
              <select
                value={user.department}
                onChange={(e) => {
                  setUser((prev) => ({ ...prev, department: e.target.value }));
                  if (errors.department) setErrors((prev) => ({ ...prev, department: undefined }));
                }}
                className={fieldCls("department")}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Position</label>
              <select
                value={user.position}
                onChange={(e) => {
                  setUser((prev) => ({ ...prev, position: e.target.value }));
                  if (errors.position) setErrors((prev) => ({ ...prev, position: undefined }));
                }}
                className={fieldCls("position")}
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
              {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Role</label>
              <select
                value={user.role}
                onChange={(e) => {
                  setUser((prev) => ({ ...prev, role: e.target.value }));
                  if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                className={fieldCls("role")}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
            </div>

            <div>
              <p className="mb-2 text-xs text-slate-500">Status</p>
              <div className="inline-flex rounded-md border border-gray-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setUser((prev) => ({ ...prev, isActive: true }))}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    user.isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setUser((prev) => ({ ...prev, isActive: false }))}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    !user.isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("mode") === "new";
  const [users, setUsers] = useState<SavedUser[]>(MOCK_USERS);

  const listUsers = useMemo(() => users, [users]);

  if (isCreateMode) {
    return (
      <CreateUserForm
        onBack={() => router.push("/admin/config/users")}
        onSaved={(saved) => {
          MOCK_USERS = [saved, ...MOCK_USERS];
          setUsers([...MOCK_USERS]);
          router.push("/admin/config/users");
        }}
      />
    );
  }

  return (
    <UsersListView
      users={listUsers}
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
