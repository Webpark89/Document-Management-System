"use client";

import { useMemo, useRef, useState } from "react";
import { Building2, KeyRound, Loader2, Pencil, PenLine, Upload, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSignatures } from "@/components/providers/SignatureProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  ADMIN_CONTENT,
  ADMIN_PAGE_SHELL,
  AdminPageHeader,
  MD_ADD_BTN,
} from "@/components/ui/admin";
import { APP_CARD_LG } from "@/components/ui/design-system";

const ROLE_BADGE: Record<string, string> = {
  Administrator: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  Executive: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  Manager: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  Employee: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
};

const CARD = APP_CARD_LG;
const CARD_HEADER_LABEL =
  "text-[11px] font-bold uppercase tracking-wider text-slate-400";
const PANEL_BOX =
  "flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm";
const BTN_SECONDARY =
  "inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50";

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function CardSectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  description,
}: {
  icon: typeof User;
  iconBg: string;
  iconColor: string;
  label: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        <span className={CARD_HEADER_LABEL}>{label}</span>
      </div>
      {description ? <p className="mt-3 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
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

  const [previewUrl, setPreviewUrl] = useState<string | null>(mySignature?.imageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [sendingResetLink, setSendingResetLink] = useState(false);

  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
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
  };

  const handleSave = async () => {
    if (!previewUrl) {
      showToast("กรุณาอัปโหลดลายเซ็นก่อนบันทึก", "error");
      return;
    }

    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const position =
      displayRole === "Administrator" ? "ผู้ดูแลระบบ" : displayRole;

    if (mySignature) {
      updateSignature(mySignature.id, { imageUrl: previewUrl, position });
      showToast("อัปเดตลายเซ็นสำเร็จ", "success");
    } else {
      addSignature({
        approverName: displayName,
        position,
        imageUrl: previewUrl,
      });
      showToast("บันทึกลายเซ็นสำเร็จ — แสดงใน Master Data > ลายเซ็น", "success");
    }

    setSaving(false);
  };

  const handleSendResetLink = async () => {
    setSendingResetLink(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSendingResetLink(false);
    showToast("ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณ", "success");
  };

  const displayEmail = user?.email ?? (user?.username ? `${user.username}@company.com` : "—");

  const profileMeta = useMemo(
    () => ({
      email: displayEmail,
      employeeId: user?.employee_id ?? user?.id ?? "—",
      position: user?.position ?? "—",
      joinedAt: user?.joined_at
        ? new Date(user.joined_at).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    }),
    [displayEmail, user?.employee_id, user?.id, user?.position, user?.joined_at]
  );

  const handleEditInfo = () => {
    showToast("ฟีเจอร์แก้ไขข้อมูลจะเปิดใช้งานในเฟสถัดไป", "success");
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_CONTENT}>
        <AdminPageHeader
          breadcrumb={
            <nav className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Account</span>
              <span>/</span>
              <span className="font-medium text-slate-600">Profile</span>
            </nav>
          }
          title="โปรไฟล์"
          subtitle="In-memory demo — resets on refresh"
        />

      <div className="mt-0">
          <section className={CARD}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-5">
                <Avatar className="size-16 shrink-0 ring-2 ring-blue-50">
                  <AvatarFallback className="bg-indigo-100 text-lg font-semibold text-indigo-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xl font-bold tracking-tight text-slate-900">{displayName}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">@{user?.username ?? "—"}</p>
                </div>
              </div>
              <button type="button" onClick={handleEditInfo} className={BTN_SECONDARY}>
                <Pencil className="size-4" />
                แก้ไขข้อมูล
              </button>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium ${
                    ROLE_BADGE[displayRole] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
                  }`}
                >
                  {displayRole}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <Building2 className="size-4 shrink-0 text-slate-400" />
                  {displayDepartment}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetaField label="อีเมล" value={profileMeta.email} />
                <MetaField label="รหัสพนักงาน" value={profileMeta.employeeId} />
                <MetaField label="ตำแหน่ง" value={profileMeta.position} />
                <MetaField label="วันที่เริ่มงาน" value={profileMeta.joinedAt} />
              </dl>
            </div>
          </section>

          <section className={CARD}>
            <CardSectionHeader
              icon={PenLine}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              label="ลายเซ็นของฉัน"
              description="อัปโหลดลายเซ็นสำหรับใช้ในเอกสาร — รายการจะแสดงใน Master Data > ลายเซ็น"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,13fr)_minmax(0,7fr)] md:items-stretch">
              <div
                className={`${PANEL_BOX} cursor-pointer items-center justify-center border-2 border-dashed transition-colors hover:border-blue-300 hover:bg-blue-50/50`}
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
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-blue-50">
                  <Upload className="size-6 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700">คลิกเพื่ออัปโหลดลายเซ็น</p>
                <p className="mt-1 text-xs text-slate-400">PNG, JPG — mock in-memory only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className={PANEL_BOX}>
                <p className={`mb-3 ${CARD_HEADER_LABEL}`}>ตัวอย่าง</p>
                <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4">
                  {previewUrl ? (
                    <>
                      <dl className="mb-3 space-y-2 border-b border-slate-100 pb-3 text-xs">
                        <div>
                          <dt className="text-slate-400">ชื่อผู้อนุมัติ</dt>
                          <dd className="mt-0.5 font-medium text-slate-800">{displayName}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">วันที่/เวลาที่ลงนาม</dt>
                          <dd className="mt-0.5 text-slate-400">—</dd>
                        </div>
                      </dl>
                      <div className="flex flex-1 items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="ลายเซ็น"
                          className="max-h-20 max-w-full object-contain"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-center text-xs text-slate-400">ยังไม่มีลายเซ็น</p>
                    </div>
                  )}
                </div>
                {mySignature ? (
                  <p className="mt-3 text-xs font-medium text-emerald-600">
                    ลงทะเบียนแล้ว — สถานะ {mySignature.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !previewUrl}
                className={MD_ADD_BTN}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "กำลังบันทึก..." : mySignature ? "อัปเดตลายเซ็น" : "บันทึกลายเซ็น"}
              </button>
            </div>
          </section>

          <section className={CARD}>
            <CardSectionHeader
              icon={KeyRound}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="รีเซ็ตรหัสผ่าน"
              description="ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ — จำลองการส่งอีเมลเท่านั้น (mock in-memory)"
            />

            <div className={PANEL_BOX}>
              <p className={CARD_HEADER_LABEL}>อีเมลที่ลงทะเบียน</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{displayEmail}</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                ระบบจะส่งลิงก์ให้คุณตั้งรหัสผ่านใหม่ผ่านอีเมล — ไม่มีการส่งอีเมลจริงใน demo นี้
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={sendingResetLink || !user}
                className={MD_ADD_BTN}
              >
                {sendingResetLink && <Loader2 className="size-4 animate-spin" />}
                {sendingResetLink ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมล"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
