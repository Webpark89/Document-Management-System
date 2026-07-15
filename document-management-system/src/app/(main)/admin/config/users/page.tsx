"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

const DEPARTMENTS = ["Finance", "Procurement", "QA", "IT"] as const;
const POSITIONS = ["Manager", "Staff", "Head of Operations"] as const;
const ROLE_OPTIONS = ["Admin", "Manager", "Employee", "Executive"] as const;

type UserForm = {
  fullName: string;
  email: string;
  password: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
};

const EMPTY_USER: UserForm = {
  fullName: "",
  email: "",
  password: "",
  department: DEPARTMENTS[0],
  position: POSITIONS[0],
  role: ROLE_OPTIONS[0],
  isActive: true,
};

const inputCls =
  "w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

export default function CreateUserPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserForm>(EMPTY_USER);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user.fullName.trim() || !user.email.trim() || !user.password.trim()) {
      showToast("Please fill in full name, email, and password", "error");
      return;
    }

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(user);
      showToast("User created", "success");
      router.push("/admin/config");
    } catch {
      showToast("Failed to create user", "error");
    } finally {
      setSaving(false);
    }
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
              <label className="mb-1.5 block text-xs text-slate-500">Full name</label>
              <input
                type="text"
                value={user.fullName}
                onChange={(e) => setUser((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="e.g. Somchai Jaidee"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Email</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="user@company.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Password</label>
              <input
                type="password"
                value={user.password}
                onChange={(e) => setUser((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Department</label>
              <select
                value={user.department}
                onChange={(e) => setUser((prev) => ({ ...prev, department: e.target.value }))}
                className={inputCls}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Position</label>
              <select
                value={user.position}
                onChange={(e) => setUser((prev) => ({ ...prev, position: e.target.value }))}
                className={inputCls}
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Role</label>
              <select
                value={user.role}
                onChange={(e) => setUser((prev) => ({ ...prev, role: e.target.value }))}
                className={inputCls}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs text-slate-500">Status</p>
              <div className="inline-flex rounded-md border border-gray-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setUser((prev) => ({ ...prev, isActive: true }))}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    user.isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setUser((prev) => ({ ...prev, isActive: false }))}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    !user.isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-gray-50"
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
