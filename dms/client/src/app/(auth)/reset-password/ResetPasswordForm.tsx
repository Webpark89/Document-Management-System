"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authService } from "@/controllers/services/auth.service";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "เกิดข้อผิดพลาด หรือ Token หมดอายุแล้ว");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 text-center">
        เปลี่ยนรหัสผ่านสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 text-center">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            รหัสผ่านใหม่ (New Password)
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            ยืนยันรหัสผ่านใหม่ (Confirm Password)
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:opacity-50"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
