import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ลืมรหัสผ่าน" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">ลืมรหัสผ่าน</h2>
        <p className="text-xs text-slate-400">
          กรอกอีเมลองค์กรของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน (อายุ 30 นาที)
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            อีเมล (Email Address)
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500"
      >
        ส่งลิงก์รีเซ็ตรหัสผ่าน
      </button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3" /> ย้อนกลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
