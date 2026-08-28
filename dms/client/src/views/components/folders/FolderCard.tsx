"use client";

import React from "react";
import { Folder, VISIBILITY_LABEL, VISIBILITY_COLOR } from "@views/features/folders/types";
import { Folder as FolderIcon, MoreVertical, Edit2, Trash2, Pin } from "lucide-react";
import { FolderIconRenderer } from "./FolderIconRenderer";

interface FolderCardProps {
  folder: Folder;
  isActive?: boolean;
  isPinned?: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePin?: () => void;
}

export function FolderCard({ folder, isActive, isPinned, onClick, onEdit, onDelete, onTogglePin }: FolderCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  // Safe hex to rgba converter
  const getRgba = (hex: string, alpha: number) => {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    if (cleanHex.length !== 6) return `rgba(79, 129, 255, ${alpha})`; // Fallback blue
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const bgColor = getRgba(folder.color || "#4F81FF", 0.15);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
        isActive
          ? "bg-blue-50/40 border-2 border-blue-600 shadow-md ring-2 ring-blue-600/20"
          : isPinned
          ? "bg-white border-2 border-amber-400 shadow-xs hover:border-amber-500 hover:shadow-md"
          : "bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs transition-transform ${
            isActive ? "scale-105" : ""
          }`}
          style={{ backgroundColor: bgColor, color: folder.color || "#4F81FF" }}
        >
          <FolderIconRenderer iconName={folder.icon} />
        </div>

        <div className="flex items-center gap-1">
          {isActive && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs animate-in fade-in">
              ✓ เปิดอยู่
            </span>
          )}

          {/* PIN BUTTON */}
          <button
            type="button"
            title={isPinned ? "ยกเลิกปักหมุด" : "ปักหมุดโฟลเดอร์ไว้บนสุด"}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.();
            }}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isPinned
                ? "text-amber-500 bg-amber-100/80 hover:bg-amber-200"
                : "text-slate-300 hover:text-amber-500 hover:bg-slate-100"
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-amber-500" : ""}`} />
          </button>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              VISIBILITY_COLOR[folder.visibility]
            }`}
          >
            {VISIBILITY_LABEL[folder.visibility]}
          </span>

          {folder.can_edit && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-20 animate-in fade-in">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
          {folder.name}
        </h3>
        {folder.description && (
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{folder.description}</p>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>{folder.creator?.full_name || "ผู้ใช้งาน"}</span>
        <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
          {folder.document_count} เอกสาร
        </span>
      </div>
    </div>
  );
}
