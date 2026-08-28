"use client";

import React, { useState } from "react";
import { Folder, VISIBILITY_LABEL } from "@views/features/folders/types";
import {
  Folder as FolderIcon,
  FolderPlus,
  FileText,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  Users,
  Globe,
  Shield,
  Layers
} from "lucide-react";
import { FolderIconRenderer } from "./FolderIconRenderer";

interface FolderSidebarProps {
  folders: Folder[];
  activeFolderId: string | null | "ALL_DOCS";
  onSelectFolder: (folderId: string | null | "ALL_DOCS") => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  totalUnorganizedCount?: number;
  totalAllCount?: number;
}

export function FolderSidebar({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  totalUnorganizedCount = 0,
  totalAllCount = 0,
}: FolderSidebarProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "Private":
        return <Lock className="w-3 h-3 text-slate-400" />;
      case "Department":
        return <Users className="w-3 h-3 text-blue-500" />;
      case "Shared":
        return <Users className="w-3 h-3 text-violet-500" />;
      case "CompanyWide":
        return <Globe className="w-3 h-3 text-emerald-500" />;
      case "AdminOnly":
        return <Shield className="w-3 h-3 text-rose-500" />;
      default:
        return <Globe className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="w-64 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 flex flex-col h-full shrink-0 select-none min-h-[600px]">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">จัดการโฟลเดอร์</span>
        </div>
        <button
          type="button"
          onClick={onCreateFolder}
          className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ ใหม่</span>
        </button>
      </div>

      {/* Primary Fixed Views */}
      <div className="space-y-1 mb-4">
        {/* All Docs */}
        <button
          type="button"
          onClick={() => onSelectFolder("ALL_DOCS")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFolderId === "ALL_DOCS"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-700 hover:bg-slate-200/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>เอกสารทั้งหมด</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeFolderId === "ALL_DOCS" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {totalAllCount}
          </span>
        </button>

        {/* Unorganized Docs */}
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFolderId === null
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-700 hover:bg-slate-200/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>ไม่มีโฟลเดอร์</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeFolderId === null ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {totalUnorganizedCount}
          </span>
        </button>
      </div>

      <div className="px-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        โฟลเดอร์ของฉัน ({folders.length})
      </div>

      {/* Dynamic Folder List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {folders.map((folder) => {
          const isActive = activeFolderId === folder.id;
          const isMenuOpen = activeMenuId === folder.id;

          return (
            <div key={folder.id} className="relative group">
              <div
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold shadow-2xs"
                    : "text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-base shrink-0"><FolderIconRenderer iconName={folder.icon} className="w-4 h-4" /></span>
                  <span className="truncate text-xs">{folder.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span title={VISIBILITY_LABEL[folder.visibility]}>
                    {getVisibilityIcon(folder.visibility)}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-md">
                    {folder.document_count}
                  </span>

                  {folder.can_edit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : folder.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300/50 rounded-lg text-slate-500 transition-opacity cursor-pointer"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Context Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-2 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-30 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      onEditFolder(folder);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      onDeleteFolder(folder);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบโฟลเดอร์</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {folders.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
            ยังไม่มีโฟลเดอร์
          </div>
        )}
      </div>
    </div>
  );
}
