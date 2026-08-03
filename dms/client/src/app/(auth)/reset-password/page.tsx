import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">ตั้งรหัสผ่านใหม่</h2>
        <p className="text-xs text-slate-400">
          กรอกรหัสผ่านใหม่สำหรับบัญชีผู้ใช้งานของคุณ
        </p>
      </div>

      <ResetPasswordForm token={token} />

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
