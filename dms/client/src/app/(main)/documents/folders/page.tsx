"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Folder as FolderIcon,
  Search,
  FolderPlus,
  ArrowLeft,
  Filter,
  Pin,
  SlidersHorizontal,
} from "lucide-react";
import { Folder } from "@views/features/folders/types";
import { getFolders, createFolder, updateFolder, deleteFolder } from "@views/features/folders/api";
import { FolderCard } from "@views/components/folders/FolderCard";
import { FolderCreateModal } from "@views/components/folders/FolderCreateModal";
import PageHeader from "@views/components/shared/PageHeader";
import { useToast } from "@views/components/providers/ToastProvider";
import { APP_PAGE_SHELL, APP_PAGE_CONTENT, APP_CARD } from "@views/components/ui/design-system";

function AllFoldersContent() {
  const router = useRouter();
  const { showToast } = useToast();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("ALL");

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  // Pinning state
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dms_pinned_folder_ids");
      if (saved) setPinnedFolderIds(JSON.parse(saved));
    } catch {}
  }, []);

  const handleTogglePin = (folderId: string) => {
    const next = pinnedFolderIds.includes(folderId)
      ? pinnedFolderIds.filter((id) => id !== folderId)
      : [...pinnedFolderIds, folderId];
    setPinnedFolderIds(next);
    try {
      localStorage.setItem("dms_pinned_folder_ids", JSON.stringify(next));
    } catch {}
  };

  const fetchAllFolders = async () => {
    setLoading(true);
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (err) {
      console.error("Failed to load folders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFolders();
  }, []);

  const handleCreateOrUpdateFolder = async (payload: any) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, payload);
      showToast("อัปเดตโฟลเดอร์เรียบร้อยแล้ว");
    } else {
      await createFolder(payload);
      showToast("สร้างโฟลเดอร์ใหม่เรียบร้อยแล้ว");
    }
    setEditingFolder(null);
    fetchAllFolders();
  };

  const handleDeleteFolderAction = async (folder: Folder) => {
    if (confirm(`คุณต้องการลบโฟลเดอร์ "${folder.name}" ใช่หรือไม่? (เอกสารภายในจะถูกเปลี่ยนเป็นไม่มีโฟลเดอร์)`)) {
      await deleteFolder(folder.id);
      showToast("ลบโฟลเดอร์เรียบร้อยแล้ว");
      fetchAllFolders();
    }
  };

  const filteredAndSortedFolders = useMemo(() => {
    let list = [...folders];

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }

    // Filter by Visibility
    if (visibilityFilter !== "ALL") {
      list = list.filter((f) => f.visibility === visibilityFilter);
    }

    // Sort Pinned Folders first
    list.sort((a, b) => {
      const isAPinned = pinnedFolderIds.includes(a.id);
      const isBPinned = pinnedFolderIds.includes(b.id);
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      return a.name.localeCompare(b.name, "th");
    });

    return list;
  }, [folders, searchQuery, visibilityFilter, pinnedFolderIds]);

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        {/* PAGE HEADER */}
        <PageHeader
          title="คลังโฟลเดอร์ทั้งหมด (Folder Directory)"
          subtitle={`รวมโฟลเดอร์สำหรับทำงานร่วมกันทั้งหมด ${folders.length} โฟลเดอร์ในระบบ`}
          actions={
            <button
              type="button"
              onClick={() => {
                setEditingFolder(null);
                setIsCreateFolderOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ สร้างโฟลเดอร์ใหม่</span>
            </button>
          }
        />

        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Back Button */}
          <Link
            href="/documents"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปคลังเอกสาร</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อโฟลเดอร์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Visibility Select */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
            >
              <option value="ALL">🌐 ทุกขอบเขต (All Visibility)</option>
              <option value="CompanyWide">🌐 ทั้งองค์กร (Company-wide)</option>
              <option value="Department">🏢 เฉพาะแผนก (Department)</option>
              <option value="Private">🔒 ส่วนตัว (Private)</option>
              <option value="Shared">👥 แชร์เฉพาะกลุ่ม (Shared)</option>
            </select>
          </div>
        </div>

        {/* FOLDER CARDS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : filteredAndSortedFolders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                isPinned={pinnedFolderIds.includes(folder.id)}
                onClick={() => router.push(`/documents?folderId=${folder.id}`)}
                onTogglePin={() => handleTogglePin(folder.id)}
                onEdit={() => {
                  setEditingFolder(folder);
                  setIsCreateFolderOpen(true);
                }}
                onDelete={() => handleDeleteFolderAction(folder)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
            <FolderIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">ไม่พบโฟลเดอร์ที่ค้นหา</h3>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือสร้างโฟลเดอร์ใหม่</p>
          </div>
        )}

        {/* FOLDER CREATE / EDIT MODAL */}
        <FolderCreateModal
          isOpen={isCreateFolderOpen}
          onClose={() => {
            setIsCreateFolderOpen(false);
            setEditingFolder(null);
          }}
          onSubmit={handleCreateOrUpdateFolder}
          editingFolder={editingFolder}
          departments={[]}
        />
      </div>
    </div>
  );
}

export default function AllFoldersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-slate-400">กำลังโหลดโฟลเดอร์ทั้งหมด...</div>}>
      <AllFoldersContent />
    </React.Suspense>
  );
}
