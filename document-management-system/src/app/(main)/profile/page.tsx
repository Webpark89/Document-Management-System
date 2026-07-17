"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, PenLine, Upload, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSignatures } from "@/components/providers/SignatureProvider";
import { useToast } from "@/components/providers/ToastProvider";

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

  return (
    <div className="min-w-0 w-full bg-gray-50">
      <div className="mx-auto w-full max-w-[960px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 pb-4">
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Account</span>
            <span>/</span>
            <span className="font-medium text-slate-600">Profile</span>
          </nav>
          <h1 className="text-xl font-semibold text-slate-800">โปรไฟล์</h1>
          <p className="mt-2 text-xs text-slate-400">In-memory demo — resets on refresh</p>
        </div>

        <div className="mt-6 space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-indigo-100 text-lg font-semibold text-indigo-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="text-lg font-semibold text-slate-800">{displayName}</p>
                <p className="text-sm text-slate-500">{user?.username ?? "—"}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-4 text-slate-400" />
                    {displayRole}
                  </span>
                  <span>แผนก: {displayDepartment}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PenLine className="size-4 text-slate-500" />
              <h2 className="text-sm font-medium text-slate-800">ลายเซ็นของฉัน</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              อัปโหลดลายเซ็นสำหรับใช้ในเอกสาร — รายการจะแสดงใน Master Data &gt; ลายเซ็น
            </p>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-4">
                <div
                  className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
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
                  <Upload className="mb-2 size-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">คลิกเพื่ออัปโหลดลายเซ็น</p>
                  <p className="mt-1 text-xs text-slate-400">PNG, JPG — mock in-memory only</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !previewUrl}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    {saving ? "กำลังบันทึก..." : mySignature ? "อัปเดตลายเซ็น" : "บันทึกลายเซ็น"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  ตัวอย่าง
                </p>
                <div className="flex min-h-[100px] items-center justify-center rounded-md border border-gray-100 bg-gray-50 p-3">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="ลายเซ็น"
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-center text-xs text-slate-400">ยังไม่มีลายเซ็น</p>
                  )}
                </div>
                {mySignature ? (
                  <p className="mt-2 text-xs text-emerald-600">
                    ลงทะเบียนแล้ว — สถานะ {mySignature.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
