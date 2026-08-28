"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderVisibility, CreateFolderPayload } from "@views/features/folders/types";
import { X, FolderPlus, Palette, Smile } from "lucide-react";

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFolderPayload) => Promise<void>;
  editingFolder?: Folder | null;
  departments?: { id: string; name: string }[];
  parentFolderId?: string | null;
}

const PRESET_ICONS = ["📁", "📢", "📑", "📂", "💼", "🔒", "📊", "📝", "📌", "⭐"];
const PRESET_COLORS = ["#4F81FF", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#64748B"];

export function FolderCreateModal({
  isOpen,
  onClose,
  onSubmit,
  editingFolder,
  departments = [],
  parentFolderId,
}: FolderCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState("#4F81FF");
  const [visibility, setVisibility] = useState<FolderVisibility>("CompanyWide");
  const [sharedDepartments, setSharedDepartments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setDescription(editingFolder.description || "");
      setIcon(editingFolder.icon || "📁");
      setColor(editingFolder.color || "#4F81FF");
      setVisibility(editingFolder.visibility);
    } else {
      setName("");
      setDescription("");
      setIcon("📁");
      setColor("#4F81FF");
      setVisibility("CompanyWide");
      setSharedDepartments([]);
    }
  }, [editingFolder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        visibility,
        parent_id: parentFolderId || null,
        shared_departments: visibility === "Shared" ? sharedDepartments : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {editingFolder ? "แก้ไขโฟลเดอร์" : "สร้างโฟลเดอร์ใหม่"}
            </h2>
            <p className="text-xs text-slate-400">จัดระเบียบเอกสารสำหรับการทำงานร่วมกัน</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Icon */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อโฟลเดอร์ *</label>
            <div className="flex items-center gap-2">
              {/* Icon selector */}
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-base focus:outline-none cursor-pointer"
              >
                {PRESET_ICONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น เอกสารแผนกจัดซื้อ, สัญญาปี 2569"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียด (ถ้ามี)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดสั้นๆ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Preset Color Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">สีไอคอน</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-blue-500 ring-offset-2" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">สิทธิ์การมองเห็น (Visibility)</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as FolderVisibility)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="CompanyWide">🌐 ทั้งองค์กร (Company Wide) — ทุกคนเห็นได้</option>
              <option value="Department">🏢 เฉพาะแผนกของฉัน (My Department Only)</option>
              <option value="Shared">🔗 ระบุแผนกแบบกำหนดเอง (Shared Depts)</option>
              <option value="Private">🔒 ส่วนตัว (Private) — เห็นเฉพาะผู้สร้าง</option>
              <option value="AdminOnly">🛡️ เฉพาะ Admin / Executive</option>
            </select>
          </div>

          {/* Shared Depts Multi-select */}
          {visibility === "Shared" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกแผนกที่มีสิทธิ์</label>
              <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                {departments.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={sharedDepartments.includes(d.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSharedDepartments([...sharedDepartments, d.id]);
                        else setSharedDepartments(sharedDepartments.filter((id) => id !== d.id));
                      }}
                      className="rounded border-slate-300 text-blue-600 w-3.5 h-3.5"
                    />
                    <span>{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit / Cancel Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "กำลังบันทึก..." : editingFolder ? "อัปเดตโฟลเดอร์" : "สร้างโฟลเดอร์"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
