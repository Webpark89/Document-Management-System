"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Folder as FolderIcon,
  MoreVertical,
  Trash2,
  CheckSquare,
  LayoutGrid,
  List,
  SortAsc,
  Plus,
  Pin,
  Edit2
} from "lucide-react";
import { getFolders, deleteFolder as deleteFolderApi, createFolder, updateFolder } from '@views/features/folders/api';
import { Folder as FolderType } from '@views/features/folders/types';
import { useToast } from '@views/components/providers/ToastProvider';
import { swalConfirm } from "@/lib/swal";
import { FolderCreateModal } from '@views/components/folders/FolderCreateModal';
import PageHeader from '@views/components/shared/PageHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';

export default function FoldersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const { data: initialFolders, error, mutate } = useSWR("folders", getFolders, {
    revalidateOnFocus: false,
  });

  const [folders, setFolders] = useState<FolderType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);
  const [recentFolderIds, setRecentFolderIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedPins = localStorage.getItem('dms_pinned_folder_ids');
      if (savedPins) setPinnedFolderIds(JSON.parse(savedPins));

      const savedRecent = localStorage.getItem('dms_recent_folder_ids');
      if (savedRecent) setRecentFolderIds(JSON.parse(savedRecent));
    } catch {}
  }, []);

  const handleTogglePinFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    const next = pinnedFolderIds.includes(folderId)
      ? pinnedFolderIds.filter((id) => id !== folderId)
      : [...pinnedFolderIds, folderId];
    setPinnedFolderIds(next);
    try {
      localStorage.setItem('dms_pinned_folder_ids', JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    if (initialFolders) {
      setFolders(initialFolders);
    }
  }, [initialFolders]);

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aPinned = pinnedFolderIds.includes(a.id);
    const bPinned = pinnedFolderIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const recentFolders = recentFolderIds
    .map(id => folders.find(f => f.id === id))
    .filter(Boolean) as FolderType[];
  
  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedFolderIds.includes(id)) {
      setSelectedFolderIds(selectedFolderIds.filter(x => x !== id));
    } else {
      setSelectedFolderIds([...selectedFolderIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedFolderIds.length === filteredFolders.length && filteredFolders.length > 0) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(filteredFolders.map(f => f.id));
    }
  };

  const handleDeleteAll = async () => {
    if (selectedFolderIds.length === 0) return;
    
    const isConfirm = await swalConfirm({
      title: 'ลบโฟลเดอร์',
      text: `คุณแน่ใจหรือไม่ที่จะลบ ${selectedFolderIds.length} โฟลเดอร์ที่เลือก?`,
      icon: 'warning'
    });
    if (!isConfirm) return;

    try {
      for (const id of selectedFolderIds) {
        await deleteFolderApi(id);
      }
      showToast(`ลบสำเร็จ ${selectedFolderIds.length} โฟลเดอร์`, "success");
      setSelectedFolderIds([]);
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "เกิดข้อผิดพลาดในการลบโฟลเดอร์", "error");
    }
  };

  const navigateToFolder = (id: string) => {
    try {
      let recent = [...recentFolderIds];
      recent = recent.filter(x => x !== id);
      recent.unshift(id);
      if (recent.length > 5) recent = recent.slice(0, 5);
      setRecentFolderIds(recent);
      localStorage.setItem('dms_recent_folder_ids', JSON.stringify(recent));
    } catch {}
    router.push(`/documents?folderId=${id}`);
  };

  const FolderCardItem = ({ folder }: { folder: FolderType }) => {
    const isSelected = selectedFolderIds.includes(folder.id);
    return (
      <div 
        onClick={() => navigateToFolder(folder.id)}
        className="relative bg-[#F4F7FE] hover:bg-[#EDF2FA] rounded-2xl p-4 transition-all cursor-pointer border border-transparent hover:border-blue-100 flex flex-col group"
      >
        {/* Top bar: Checkbox */}
        <div className="flex justify-end mb-2">
          <div 
            onClick={(e) => handleToggleSelect(e, folder.id)}
            className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-600' : 'bg-white border border-slate-200'
            }`}
          >
            {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>

        {/* Center: Big Icon */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center text-4xl">
            {folder.icon && folder.icon !== "📁" && folder.icon !== "📂" ? (
              <span className="leading-none">{folder.icon}</span>
            ) : (
              <FolderIcon 
                className="w-10 h-10" 
                style={{ 
                  color: folder.color || '#3b82f6', 
                  fill: folder.color || '#3b82f6' 
                }} 
              />
            )}
          </div>
        </div>

        {/* Bottom: Details */}
        <div className="mt-auto">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm truncate pr-2 max-w-[150px]">{folder.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{folder.document_count || 0} Files</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                title="ปักหมุด"
                onClick={(e) => handleTogglePinFolder(e, folder.id)} 
                className={`p-1.5 rounded-lg transition-colors ${pinnedFolderIds.includes(folder.id) ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
              >
                <Pin className="w-3.5 h-3.5" fill={pinnedFolderIds.includes(folder.id) ? 'currentColor' : 'none'} />
              </button>
              <button 
                title="แก้ไข"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolder(folder);
                  setIsCreateModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          {/* Avatars */}
          <div className="flex items-center gap-1 mt-3">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-[#F4F7FE] flex items-center justify-center text-[8px] font-bold text-blue-700 uppercase">
                {folder.creator?.full_name?.substring(0, 2) || 'AD'}
              </div>
              <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-[#F4F7FE] flex items-center justify-center text-[8px] font-bold text-indigo-700 uppercase">
                U
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-[#F4F7FE] flex items-center justify-center text-[8px] font-bold text-slate-500">
                +2
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        
        {/* HEADER BAR */}
        <PageHeader
          title="รายการโฟลเดอร์ (Folder Lists)"
          subtitle="จัดหมวดหมู่และจัดการโฟลเดอร์สำหรับจัดเก็บเอกสารในระบบ"
          actions={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาโฟลเดอร์..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-full md:w-[260px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>
              <button 
                onClick={() => { setEditingFolder(null); setIsCreateModalOpen(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-colors shadow-xs shrink-0 text-xs font-bold cursor-pointer"
              >
                <FolderIcon className="w-4 h-4 fill-white/20" />
                New Folder
              </button>
            </div>
          }
        />

        {/* BULK ACTION BAR */}
        {selectedFolderIds.length > 0 && (
          <div className="bg-blue-600 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
                เลือกอยู่ {selectedFolderIds.length} โฟลเดอร์
              </span>
              <button 
                onClick={handleSelectAll} 
                className="text-xs font-semibold hover:underline opacity-90 cursor-pointer"
              >
                {selectedFolderIds.length === filteredFolders.length ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
            </div>
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ลบโฟลเดอร์ที่เลือก
            </button>
          </div>
        )}

        {/* RECENT FOLDERS */}
        {recentFolders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <span>🕒</span>
                <span>เปิดล่าสุด (Recent)</span>
              </h2>
            </div>
            <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "flex flex-col gap-3"}>
              {recentFolders.map(folder => (
                <FolderCardItem key={`recent-${folder.id}`} folder={folder} />
              ))}
            </div>
          </div>
        )}

        {/* ALL FOLDERS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span>📂</span>
              <span>โฟลเดอร์ทั้งหมด (All Folders)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                {filteredFolders.length}
              </span>
            </h2>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "flex flex-col gap-3"}>
            {filteredFolders.map(folder => (
              <FolderCardItem key={`all-${folder.id}`} folder={folder} />
            ))}
          </div>
          
          {filteredFolders.length === 0 && (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
              <FolderIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">ไม่พบโฟลเดอร์</p>
            </div>
          )}
        </div>

      </div>

      <FolderCreateModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          try {
            if (editingFolder) {
              await updateFolder(editingFolder.id, data);
              showToast('อัปเดตโฟลเดอร์สำเร็จ', 'success');
            } else {
              await createFolder(data);
              showToast('สร้างโฟลเดอร์สำเร็จ', 'success');
            }
            mutate();
          } catch (err: any) {
            showToast(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
            throw err;
          }
        }}
        editingFolder={editingFolder}
      />
    </div>
  );
}

// Missing icons
const Users = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const Download = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);
const ChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
