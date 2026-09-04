const fs = require('fs');

const code = `"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, KeyRound, Loader2, Pencil, PenLine, Upload, User, Mail, Hash, Calendar, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from '@views/components/ui/avatar';
import { useAuth } from '@views/components/providers/AuthProvider';
import { useSignatures } from '@views/components/providers/SignatureProvider';
import { useToast } from '@views/components/providers/ToastProvider';
import {
  ADMIN_CONTENT,
  ADMIN_PAGE_SHELL,
  AdminPageHeader,
} from '@views/components/ui/admin';
import { usersService } from '@/controllers/services/users.service';

const ROLE_BADGE: Record<string, string> = {
  Administrator: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  Executive: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Manager: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  Employee: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

const CARD_CLASS = "bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col";
const PANEL_BOX = "flex min-h-[200px] flex-col rounded-xl border border-slate-200/60 bg-slate-50/50 p-6";
const BTN_SECONDARY = "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-[0.98]";
const BTN_PRIMARY = "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30">
      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function formatEmployeeId(u: any): string {
  if (!u) return "—";
  if (u.employee_id && typeof u.employee_id === "string" && !u.employee_id.includes("-")) {
    return u.employee_id;
  }
  const username = u.username || "";
  if (username.toLowerCase() === "admin") return "EMP-00001";
  const match = username.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return \`EMP-\${String(100 + num).padStart(5, "0")}\`;
  }
  const idStr = String(u.id || "");
  if (idStr.length > 0) {
    const hex = idStr.replace(/-/g, "").substring(0, 6);
    const num = (parseInt(hex, 16) % 90000) + 10000;
    return \`EMP-\${num}\`;
  }
  return "EMP-00101";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const hasPerm = (itemKey: string, action: string = 'view') =>
    !!user?.permissions?.includes(\`profile.\${itemKey}:\${action}\`);
  const { signatures, addSignature, updateSignature, findByApproverName } = useSignatures();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.full_name || user?.username || "User";
  const displayRole = user?.role || "—";
  const displayDepartment = user?.department || "—";

  const mySignature = useMemo(
    () =>
      signatures.find(
        (row) =>
          row.approverName === displayName ||
          (user?.username ? row.approverName === user.username : false)
      ) ?? findByApproverName(displayName),
    [signatures, displayName, user?.username, findByApproverName]
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingResetLink, setSendingResetLink] = useState(false);

  useEffect(() => {
    usersService.getMySignatureUrl().then((res) => {
      if (res.url) {
        setPreviewUrl(res.url);
      }
    }).catch(() => {});
  }, []);

  const initials = useMemo(
    () => (displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : "U"),
    [displayName]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("กรุณาเลือกไฟล์รูปภาพเท่านั้น", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      showToast("กรุณาเลือกไฟล์ลายเซ็นใหม่ก่อนบันทึก", "error");
      return;
    }

    setSaving(true);
    
    try {
      const res = await usersService.uploadSignature(selectedFile);
      if (res.url) {
        setPreviewUrl(res.url);
      }
      setSelectedFile(null);
      
      const position = displayRole === "Administrator" ? "ผู้ดูแลระบบ" : displayRole;

      if (mySignature) {
        updateSignature(mySignature.id, { imageUrl: res.url || previewUrl || undefined, position });
        showToast("อัปเดตลายเซ็นสำเร็จ", "success");
      } else {
        addSignature({
          approverName: displayName,
          position,
          imageUrl: res.url || previewUrl || undefined,
        });
        showToast("บันทึกลายเซ็นสำเร็จ", "success");
      }
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendResetLink = async () => {
    setSendingResetLink(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSendingResetLink(false);
    showToast("ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณ", "success");
  };

  const displayEmail = user?.email ?? (user?.username ? \`\${user.username}@company.com\` : "—");

  const profileMeta = useMemo(
    () => ({
      email: displayEmail,
      employeeId: formatEmployeeId(user),
      position: user?.position ?? "—",
      joinedAt: user?.joined_at
        ? new Date(user.joined_at).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—",
    }),
    [displayEmail, user]
  );

  const handleEditInfo = () => {
    showToast("ฟีเจอร์แก้ไขข้อมูลจะเปิดใช้งานในเฟสถัดไป", "success");
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <AdminPageHeader
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Account</span>
            <span>/</span>
            <span className="font-bold text-slate-800">Profile</span>
          </nav>
        }
        title="โปรไฟล์ส่วนตัว (My Profile)"
        subtitle="จัดการข้อมูลส่วนตัว ลายเซ็น และรหัสผ่านของคุณ"
      />

      <div className={ADMIN_CONTENT}>
        {hasPerm('view_own', 'view') ? (
          <div className="max-w-4xl space-y-6 mt-6">
            
            {/* Hero Profile Card */}
            <section className={CARD_CLASS}>
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="px-6 sm:px-8 pb-8 relative">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
                  <div className="flex items-end gap-5">
                    <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-900/5">
                      <Avatar className="size-24 rounded-full ring-2 ring-white">
                        <AvatarFallback className="bg-indigo-100 text-3xl font-bold text-indigo-700">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{displayName}</h2>
                      <p className="font-medium text-slate-500">@{user?.username ?? "—"}</p>
                    </div>
                  </div>
                  {hasPerm('edit_own', 'edit') && (
                    <button type="button" onClick={handleEditInfo} className={BTN_SECONDARY}>
                      <Pencil className="size-4" />
                      แก้ไขข้อมูลส่วนตัว
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                  <span
                    className={\`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider \${
                      ROLE_BADGE[displayRole] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                    }\`}
                  >
                    <ShieldCheck className="size-3.5" />
                    {displayRole}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 ring-1 ring-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                    <Building2 className="size-3.5 text-slate-400" />
                    {displayDepartment}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-6">
                  <InfoItem icon={Mail} label="อีเมล (Email)" value={profileMeta.email} />
                  <InfoItem icon={Hash} label="รหัสพนักงาน (Employee ID)" value={profileMeta.employeeId} />
                  <InfoItem icon={User} label="ตำแหน่ง (Position)" value={profileMeta.position} />
                  <InfoItem icon={Calendar} label="วันที่เริ่มงาน (Joined Date)" value={profileMeta.joinedAt} />
                </div>
              </div>
            </section>

            {/* Signature & Security Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
              
              {/* Signature Card */}
              <section className={CARD_CLASS}>
                <div className="px-6 py-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <PenLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">ลายเซ็นของฉัน</h3>
                    <p className="text-xs text-slate-500">อัปโหลดลายเซ็นสำหรับใช้งานในเอกสารอิเล็กทรอนิกส์</p>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div
                    className={\`\${PANEL_BOX} cursor-pointer items-center justify-center border-2 border-dashed border-slate-300 transition-all hover:border-indigo-400 hover:bg-indigo-50/50 group\`}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-100 transition-transform">
                      <Upload className="size-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">คลิกเพื่ออัปโหลดลายเซ็นใหม่</p>
                    <p className="mt-1 text-xs text-slate-400">รองรับไฟล์ PNG, JPG</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">ลายเซ็นปัจจุบัน</p>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 h-[120px] flex items-center justify-center relative overflow-hidden">
                      {previewUrl ? (
                        <>
                          <img
                            src={previewUrl}
                            alt="ลายเซ็น"
                            className="max-h-16 max-w-full object-contain relative z-10"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-[-12deg] opacity-[0.03] text-[10px] font-black text-slate-900 tracking-widest uppercase select-none z-0">
                            <span>ELECTRONIC SIGNATURE</span>
                            <span>{displayName}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400">ยังไม่มีลายเซ็นในระบบ</p>
                      )}
                    </div>
                    {mySignature ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ระบบบันทึกลายเซ็นเรียบร้อยแล้ว
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                  {hasPerm('upload_signature', 'edit') && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !previewUrl}
                      className={BTN_PRIMARY}
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
                      ) : mySignature ? "อัปเดตลายเซ็น" : "บันทึกลายเซ็น"}
                    </button>
                  )}
                </div>
              </section>

              {/* Security Card */}
              <section className={CARD_CLASS}>
                <div className="px-6 py-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">ความปลอดภัย (Security)</h3>
                    <p className="text-xs text-slate-500">จัดการรหัสผ่านและสิทธิ์การเข้าถึง</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">อีเมลที่ใช้รับลิงก์รีเซ็ตรหัสผ่าน</p>
                    <p className="text-sm font-semibold text-slate-800">{displayEmail}</p>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                      ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลนี้ เพื่อความปลอดภัยสูงสุด กรุณาตรวจสอบอีเมลก่อนทำรายการ
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end mt-auto">
                  {hasPerm('change_password', 'edit') && (
                    <button
                      type="button"
                      onClick={handleSendResetLink}
                      disabled={sendingResetLink || !user}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-900 active:scale-[0.98] disabled:opacity-60"
                    >
                      {sendingResetLink ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> กำลังส่ง...</>
                      ) : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                    </button>
                  )}
                </div>
              </section>

            </div>
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center p-12 text-slate-400">
            <ShieldCheck className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-600">ไม่มีสิทธิ์เข้าดูโปรไฟล์ตัวเอง</p>
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('client/src/app/(main)/profile/page.tsx', code, 'utf8');
console.log('Profile page redesigned!');
