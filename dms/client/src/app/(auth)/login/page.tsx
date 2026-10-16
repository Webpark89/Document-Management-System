"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@views/components/providers/AuthProvider";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  UserRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-7">
        <div>
          <span className="mb-5 inline-flex size-11 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
            <LockKeyhole
              className="size-5"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </span>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-indigo-300">
            WELCOME TO YOUR WORKSPACE
          </p>
          <h2 className="text-[28px] font-bold tracking-tight text-white sm:text-[32px]">
            ยินดีต้อนรับกลับ
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            เข้าสู่ระบบเพื่อเริ่มจัดการเอกสารของคุณ
          </p>
        </div>

        {error && (
          <div
            id="login-error"
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3.5 text-sm leading-6 text-rose-200"
          >
            <AlertCircle className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          aria-describedby={error ? "login-error" : undefined}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="login-username"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              ชื่อผู้ใช้งาน
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <UserRound
                  className="size-[18px]"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </span>
              <input
                type="text"
                id="login-username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={loading}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้งานของคุณ"
                className="h-[52px] w-full rounded-xl border border-slate-600/60 bg-white/[0.035] pl-12 pr-4 text-base text-white outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-indigo-400 focus:bg-indigo-400/5 focus:ring-4 focus:ring-indigo-400/10 disabled:opacity-60 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-200"
              >
                รหัสผ่าน
              </label>
              <Link
                href="/forgot-password"
                className="rounded text-xs font-medium text-indigo-300 underline-offset-4 hover:text-indigo-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <LockKeyhole
                  className="size-[18px]"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                name="password"
                autoComplete="current-password"
                disabled={loading}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="h-[52px] w-full rounded-xl border border-slate-600/60 bg-white/[0.035] pl-12 pr-12 text-base text-white outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-indigo-400 focus:bg-indigo-400/5 focus:ring-4 focus:ring-indigo-400/10 disabled:opacity-60 sm:text-sm"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                aria-pressed={showPassword}
                className="absolute inset-y-1.5 right-1.5 flex w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-300 disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="size-[18px]" aria-hidden="true" />
                ) : (
                  <Eye className="size-[18px]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300 active:translate-y-px disabled:cursor-wait disabled:opacity-65"
          >
            {loading ? (
              <>
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                เข้าสู่ระบบ
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
        <div className="border-t border-white/10 pt-5">
          <p className="text-center text-xs leading-6 text-slate-500">
            เข้าใช้งานด้วยบัญชีที่ได้รับจากผู้ดูแลระบบ
            <br />
            <span className="text-slate-400">
              พบปัญหาการเข้าใช้งาน? ติดต่อผู้ดูแลระบบของคุณ
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
