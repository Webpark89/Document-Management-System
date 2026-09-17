"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@views/components/providers/AuthProvider";
import { Lock, User, Shield, Users, UserCheck, Award, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string = "folk2546") => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  const testAccountGroups = [
    {
      roleTitle: "ผู้ดูแลระบบ (Administrator)",
      icon: <Shield className="w-3.5 h-3.5 text-rose-400" />,
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      users: [
        { username: "admin", name: "ผู้ดูแลระบบ", desc: "สิทธิ์สูงสุด จัดการระบบทั้งหมด", pass: "folk2546" }
      ]
    },
    {
      roleTitle: "พนักงาน / ผู้เสนอเอกสาร (Employee)",
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />,
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      users: [
        { username: "somchai", name: "คุณสมชาย ใจดี", desc: "แผนกจัดซื้อ", pass: "folk2546" },
        { username: "suda", name: "คุณสุดา วงศ์ศรี", desc: "แผนกบัญชี", pass: "folk2546" },
        { username: "napa", name: "คุณนภา สุขใจ", desc: "แผนกบุคคล", pass: "folk2546" }
      ]
    },
    {
      roleTitle: "หัวหน้าแผนก (Department Head / Manager)",
      icon: <Users className="w-3.5 h-3.5 text-amber-400" />,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      users: [
        { username: "kittisak", name: "คุณกิตติศักดิ์", desc: "หัวหน้างาน (อนุมัติ Step 1)", pass: "folk2546" },
        { username: "manager01", name: "คุณวิภา รักดี", desc: "หัวหน้าคลังสินค้า", pass: "folk2546" }
      ]
    },
    {
      roleTitle: "ผู้บริหาร (Executive)",
      icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      users: [
        { username: "prasert", name: "คุณประเสริฐ มีสุข", desc: "ผู้บริหาร (อนุมัติ Step ท้ายๆ)", pass: "folk2546" }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* ฝั่งซ้าย: ฟอร์มเข้าสู่ระบบ */}
      <div className="lg:col-span-5 space-y-5">
        <div>
          <h2 className="text-xl font-black text-white">เข้าสู่ระบบ</h2>
          <p className="text-xs text-slate-400 mt-1">กรอกข้อมูลบัญชีเพื่อเข้าใช้งานระบบ DMS</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ระบุชื่อผู้ใช้งาน"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                รหัสผ่าน (Password)
              </label>
              <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>

      {/* ฝั่งขวา: แผง Quick Test Accounts */}
      <div className="lg:col-span-7 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              บัญชีทดสอบระบบ (Quick Login)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-bold">
            คลิกเลือกเพื่อเติมข้อมูล
          </span>
        </div>

        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
          {testAccountGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                {group.icon}
                <span>{group.roleTitle}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.users.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickFill(acc.username, acc.pass)}
                    className="flex flex-col text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-white group-hover:text-blue-400">
                        {acc.username}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${group.badgeColor}`}>
                        เลือก
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 mt-0.5">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {acc.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
          💡 รหัสผ่านเริ่มต้น: <code className="text-blue-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">folk2546</code>
        </div>
      </div>

    </div>
  );
}
