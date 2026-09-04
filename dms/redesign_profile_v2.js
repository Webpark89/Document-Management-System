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
  Administrator: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  Executive: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Manager: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Employee: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
};

const CARD_CLASS = "bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col";
const BTN_SECONDARY = "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]";
const BTN_PRIMARY = "inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";

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
      <div className={ADMIN_CONTENT}>
        {hasPerm('view_own', 'view') ? (
          <div className="max-w-5xl mx-auto space-y-6 mt-4">
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">My Profile</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              
              <div className="space-y-6">
                
                {/* Main Profile Info */}
                <section className={CARD_CLASS}>
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <Avatar className="size-20 rounded-full ring-1 ring-slate-200 shadow-sm">
                        <AvatarFallback className="bg-slate-100 text-2xl font-bold text-slate-700">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{displayName}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium text-slate-500">@{user?.username ?? "—"}</p>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span
                            className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider \${
                              ROLE_BADGE[displayRole] ?? "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
                            }\`}
                          >
                            {displayRole}
                          </span>
                        </div>
                      </div>
                    </div>
                    {hasPerm('edit_own', 'edit') && (
                      <button type="button" onClick={handleEditInfo} className={BTN_SECONDARY}>
                        <Pencil className="size-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/50 px-6 sm:px-8 py-5">
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Employee ID</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">{profileMeta.employeeId}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Department</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">{displayDepartment}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Position</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">{profileMeta.position}</dd>
                      </div>
                    </dl>
                  </div>
                </section>

                {/* Signature Upload */}
                <section className={CARD_CLASS}>
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Electronic Signature</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Manage your signature for electronic documents.</p>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col sm:flex-row gap-8 items-start">
                    
                    <div className="w-full sm:w-1/2">
                      <div
                        className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all p-8 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200 group-hover:scale-105 transition-transform">
                          <Upload className="size-5 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">Click to upload</p>
                        <p className="mt-1 text-xs text-slate-500">PNG or JPG, max 2MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

                    <div className="w-full sm:w-1/2 flex flex-col">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Current Signature</p>
                      <div className="flex-1 rounded-xl border border-slate-200 bg-white h-[160px] flex items-center justify-center relative overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                        {previewUrl ? (
                          <>
                            <img
                              src={previewUrl}
                              alt="Signature Preview"
                              className="max-h-24 max-w-full object-contain relative z-10"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-[-12deg] opacity-[0.02] text-[10px] font-black text-slate-900 tracking-widest uppercase select-none z-0">
                              <span>PREVIEW MODE</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-slate-400">No signature found</p>
                        )}
                      </div>
                    </div>

                  </div>
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      {mySignature ? (
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active signature registered
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">Upload to complete setup</p>
                      )}
                    </div>
                    {hasPerm('upload_signature', 'edit') && (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !previewUrl}
                        className={BTN_PRIMARY}
                      >
                        {saving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : mySignature ? "Update Signature" : "Save Signature"}
                      </button>
                    )}
                  </div>
                </section>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                
                <section className={CARD_CLASS}>
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="text-base font-semibold text-slate-900">Contact</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email Address</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900 break-words">{profileMeta.email}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Joined Date</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{profileMeta.joinedAt}</dd>
                    </div>
                  </div>
                </section>
                
                <section className={CARD_CLASS}>
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="text-base font-semibold text-slate-900">Security</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">
                      Send a password reset link to your registered email address. This will invalidate your current password.
                    </p>
                    {hasPerm('change_password', 'edit') && (
                      <button
                        type="button"
                        onClick={handleSendResetLink}
                        disabled={sendingResetLink || !user}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
                      >
                        {sendingResetLink ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : "Reset Password"}
                      </button>
                    )}
                  </div>
                </section>

              </div>

            </div>
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center p-12 text-slate-400">
            <ShieldCheck className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-semibold text-slate-600">You do not have permission to view this profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('client/src/app/(main)/profile/page.tsx', code, 'utf8');
console.log('Profile page v2 deployed');
