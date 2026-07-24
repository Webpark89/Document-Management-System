"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '@views/components/providers/AuthProvider';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">เข้าสู่ระบบ</h2>
        <p className="text-xs text-slate-400">กรอกข้อมูลบัญชีเพื่อเข้าใช้งานระบบ DMS</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            ชื่อผู้ใช้งาน (Username)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="เช่น admin"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-300">
              รหัสผ่าน (Password)
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 disabled:opacity-50"
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">บัญชีทดสอบในระบบ (Seed Users):</p>
        <p>• Admin: <code className="text-blue-400">admin</code> / <code className="text-blue-400">folk2546</code></p>
        <p>• Manager: <code className="text-blue-400">prasert</code> / <code className="text-blue-400">folk2546</code></p>
      </div>
    </form>
  );
}
