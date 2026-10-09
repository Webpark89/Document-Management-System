"use client";

import { Pagination } from '@views/components/shared/Pagination';
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Search,
  Upload,
  Eye,
  Download,
  Edit2,
  Trash2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Check,
  UploadCloud,
  Loader2,
  FileText,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from '@views/components/ui/badge';
import { getDocuments, deleteDocument, getDocumentById, downloadDocument, uploadDocumentFile } from '@views/features/documents/api';
import { Document } from '@views/features/documents/types';
import { DocumentPreview } from '@views/components/documents/DocumentPreview';
import PageHeader from '@views/components/shared/PageHeader';
import DocTypeBadge from '@views/components/shared/DocTypeBadge';
import { useToast } from '@views/components/providers/ToastProvider';
import { useAuth } from '@views/components/providers/AuthProvider';
import { swalConfirm } from "@/lib/swal";
import { getStatusVariant } from "@/lib/document-status";
import { formatThaiDate } from "@/lib/format-date";
import { DocumentTypeIcon } from "@/lib/document-type-icon";
import { FolderSidebar } from '@views/components/folders/FolderSidebar';
import { FolderCard } from '@views/components/folders/FolderCard';
import { FolderCreateModal } from '@views/components/folders/FolderCreateModal';
import { MoveToFolderModal } from '@views/components/folders/MoveToFolderModal';
import { getFolders, createFolder, updateFolder, deleteFolder as deleteFolderApi, moveDocumentToFolder } from '@views/features/folders/api';
import { Folder as FolderType, CreateFolderPayload } from '@views/features/folders/types';
import { FolderInput, CheckSquare, Square, FolderPlus } from 'lucide-react';
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL, APP_TABLE_CARD } from '@views/components/ui/design-system';
import { FolderIconRenderer } from '@views/components/folders/FolderIconRenderer';
import { adminService } from '@/controllers/services/admin.service';

function DocumentsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const hasPerm = (itemKey: string, action: string = 'view') =>
    !!user?.permissions?.includes(`document.${itemKey}:${action}`);
  const { data: initialDocs, error, mutate: mutateDocuments } = useSWR("documents", getDocuments);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    if (initialDocs) {
      setDocuments(initialDocs);
    }
  }, [initialDocs]);

  const isLoading = !initialDocs && !error;

  const uniqueDepartments = Array.from(new Set(documents.map((d: any) => d.department || (d as any).creator?.department?.name || "ไม่ระบุ"))).filter(Boolean);

  // Filters State
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>(["All"]);
  const [deptFilter, setDeptFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Personnel Filter State
  const [allSystemUsers, setAllSystemUsers] = useState<{ id: string; name: string }[]>([]);
  const [isPersonnelPopoverOpen, setIsPersonnelPopoverOpen] = useState(false);
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const personnelRef = React.useRef<HTMLDivElement>(null);
  
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const dateRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminService.getUsersList().then((res: any) => {
      const users = (res || []).filter((u: any) => u.is_active).map((u: any) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
      }));
      setAllSystemUsers(users);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (personnelRef.current && !personnelRef.current.contains(event.target as Node)) {
        setIsPersonnelPopoverOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDatePopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Departments list state — Thai Master Data Names
  const [departments, setDepartments] = useState<string[]>([
    "แผนกจัดซื้อ",
    "แผนกบัญชีและการเงิน",
    "แผนกคลังสินค้าและจัดส่ง",
    "แผนกเทคโนโลยีสารสนเทศ",
    "แผนกทรัพยากรบุคคล",
    "แผนกผลิต"
  ]);

  // Folder System States
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null | "ALL_DOCS">("ALL_DOCS");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [showAllFolders, setShowAllFolders] = useState(false);

  // Folder Search & Pinning States
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folderId");



  useEffect(() => {
    if (folderParam) {
      setActiveFolderId(folderParam);
    }
  }, [folderParam]);



  const refreshFolders = async () => {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (err) {
      console.error("Failed to load folders", err);
    }
  };

  useEffect(() => {
    refreshFolders();
  }, []);

  const handleCreateOrUpdateFolder = async (payload: CreateFolderPayload) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, payload);
      showToast("อัปเดตโฟลเดอร์เรียบร้อยแล้ว");
    } else {
      await createFolder(payload);
      showToast("สร้างโฟลเดอร์ใหม่เรียบร้อยแล้ว");
    }
    setEditingFolder(null);
    refreshFolders();
  };

  const handleDeleteFolderAction = async (folder: FolderType) => {
    const confirmed = await swalConfirm({
      title: "ยืนยันการลบโฟลเดอร์",
      text: `คุณต้องการลบโฟลเดอร์ "${folder.name}" หรือไม่? เอกสารในโฟลเดอร์จะถูกย้ายไปยัง "ไม่มีโฟลเดอร์"`,
      confirmButtonText: "ลบโฟลเดอร์",
      cancelButtonText: "ยกเลิก",
      icon: "warning",
    });

    if (confirmed) {
      await deleteFolderApi(folder.id);
      showToast("ลบโฟลเดอร์เรียบร้อยแล้ว");
      if (activeFolderId === folder.id) setActiveFolderId("ALL_DOCS");
      refreshFolders();
    }
  };

  const handleMoveSelectedDocs = async (targetFolderId: string | null) => {
    if (selectedDocIds.length === 0) return;
    for (const docId of selectedDocIds) {
      await moveDocumentToFolder({ document_id: docId, target_folder_id: targetFolderId });
    }
    showToast(`ย้ายเอกสาร ${selectedDocIds.length} รายการ เรียบร้อยแล้ว`);
    const movedIds = [...selectedDocIds];
    setSelectedDocIds([]);
    // Update local state
    setDocuments((prev) =>
      prev.map((d) =>
        movedIds.includes(d.id) || movedIds.includes((d as any).real_id)
          ? ({ ...d, folder_id: targetFolderId } as any)
          : d
      )
    );
    refreshFolders();
  };

  // Sorting State — default sort by approved_at DESC
  const [sortKey, setSortKey] = useState<string | null>("approvedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

  const getTypeColor = (type: string) => {
    if (!type) return 'bg-slate-50 border-slate-200 text-slate-700';
    const t = type.toUpperCase();
    if (t.startsWith('PR')) return 'bg-blue-50 border-blue-200 text-blue-700';
    if (t.startsWith('PO')) return 'bg-purple-50 border-purple-200 text-purple-700';
    if (t.startsWith('BK')) return 'bg-amber-50 border-amber-200 text-amber-700';
    if (t.startsWith('DOC')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (t.startsWith('CERT')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    return 'bg-slate-50 border-slate-200 text-slate-700';
  };

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("desc");
    } else {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else {
        setSortKey(null);
        setSortDirection(null);
      }
    }
  };
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { showToast } = useToast();

  // Modal / Dialog States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form States - Real Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<"DOC" | "PR" | "PO" | "BK">("DOC");
  const [uploadPurpose, setUploadPurpose] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("กรุณาเลือกไฟล์ PDF", "error");
      return;
    }
    if (!uploadTitle.trim()) {
      showToast("กรุณาระบุชื่อเรื่องเอกสาร", "error");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim());
      formData.append("prefix", uploadType);
      formData.append("purpose", uploadPurpose.trim());

      const created = await uploadDocumentFile(formData);
      showToast(`อัปโหลดเอกสาร ${(created as any).doc_number || created.id} สำเร็จแล้ว`, "success");
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadPurpose("");
      setUploadType("DOC");
      mutateDocuments();
    } catch (err: any) {
      console.error("Upload failed", err);
      showToast(err.message || "เกิดข้อผิดพลาดในการอัปโหลดเอกสาร", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Form States - Edit & Preview
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocType, setEditDocType] = useState<Document["type"]>("PR");
  const [editDocSender, setEditDocSender] = useState("");
  const [editDocAmount, setEditDocAmount] = useState("");
  const [editDocStatus, setEditDocStatus] = useState<Document["status"]>("Draft");

  const handlePreviewDoc = async (doc: any) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
    try {
      const fullDoc = await getDocumentById(doc.id);
      if (fullDoc) {
        setSelectedDoc(fullDoc);
      }
    } catch (err) {
      console.error("Failed to fetch full doc for preview", err);
    }
  };

  // Download action
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const triggerDownload = async (doc: Document) => {
    const docId = (doc as any).real_id || doc.id;
    const docNum = (doc as any).doc_number || doc.id;
    try {
      setDownloadingDocId(doc.id);
      showToast(`กำลังเริ่มดาวน์โหลดเอกสาร ${docNum}...`, "info");
      await downloadDocument(docId, undefined, `${docNum}.pdf`);
      showToast(`ดาวน์โหลดเอกสาร ${docNum} สำเร็จแล้ว`, "success");
    } catch (err: any) {
      console.error("Download failed:", err);
      showToast(err.message || `เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร ${docNum}`, "error");
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Delete action
  const handleDeleteDoc = async (doc: Document) => {
    const confirmed = await swalConfirm({
      title: "ยืนยันการลบเอกสาร",
      text: `คุณต้องการลบเอกสาร ${doc.id} ถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      confirmButtonText: "ลบเอกสาร",
      cancelButtonText: "ยกเลิก",
      icon: "warning",
    });

    if (confirmed) {
      const targetId = doc.real_id || doc.id;
      const success = await deleteDocument(targetId);
      if (success) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        showToast(`ลบเอกสาร ${doc.id} เรียบร้อยแล้ว`);
      } else {
        showToast(`เกิดข้อผิดพลาดในการลบเอกสาร ${doc.id}`, "error");
      }
    }
  };

  // Filter Logic — Document Archive displays all documents by default now
  const filteredDocs = documents.filter((doc) => {
    // Removed hardcoded Approved filter so user can see all documents they have access to.

    // Folder Filter
    let matchesFolder = true;
    if (activeFolderId === null) {
      matchesFolder = !(doc as any).folder_id;
    } else if (activeFolderId !== "ALL_DOCS") {
      matchesFolder = (doc as any).folder_id === activeFolderId;
    }
    if (!matchesFolder) return false;

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      if (!(
        doc.name.toLowerCase().includes(query) ||
        doc.id.toLowerCase().includes(query) ||
        (doc.sender && doc.sender.toLowerCase().includes(query)) ||
        (doc.department && doc.department.toLowerCase().includes(query))
      )) {
        return false;
      }
    }
    
    // Type Filter
    const matchesType = typeFilters.includes("All") || typeFilters.includes(doc.type);
    if (!matchesType) return false;
    
    // Department Filter
    const docDept = doc.department || (doc as any).creator?.department?.name || "ทั่วไป";
    if (deptFilter && docDept !== deptFilter) return false;

    // Personnel Filters
    if (selectedCreators.length > 0) {
      if (!doc.sender || !selectedCreators.includes(doc.sender)) return false;
    }
    if (selectedApprovers.length > 0) {
      if (!doc.approvers || !doc.approvers.some(a => selectedApprovers.includes(a))) return false;
    }

    // Date Range Filter
    if (dateFrom || dateTo) {
      const docDateRaw = (doc as any).created_at || (doc as any).submittedDate;
      if (!docDateRaw) return false;
      const docDate = new Date(docDateRaw);
      docDate.setHours(0, 0, 0, 0);

      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (docDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(0, 0, 0, 0);
        if (docDate > to) return false;
      }
    }

    return true;
  });

  // Sort Helpers
  const statusPriority: Record<string, number> = {
    "Pending": 4,
    "Draft": 3,
    "Returned for Revision": 2,
    "Returned": 2,
    "Approved": 1,
    "Cancelled": 0
  };

  const parseThaiDate = (dateStr?: string) => {
    if (!dateStr) return 0;
    const timestamp = Date.parse(dateStr);
    if (!isNaN(timestamp)) return timestamp;

    const months: Record<string, number> = {
      "ม.ค.": 0, "ก.พ.": 1, "มี.ค.": 2, "เม.ย.": 3, "พ.ค.": 4, "มิ.ย.": 5,
      "ก.ค.": 6, "ส.ค.": 7, "ก.ย.": 8, "ต.ค.": 9, "พ.ย.": 10, "ธ.ค.": 11
    };
    const parts = dateStr.split(" ");
    if (parts.length < 3) return 0;
    const day = parseInt(parts[0]);
    const month = months[parts[1]] || 0;
    const year = parseInt(parts[2]) - 543; // BE to AD
    return new Date(year, month, day).getTime();
  };

  const parseAmount = (amountStr?: string) => {
    if (!amountStr || amountStr === "-") return 0;
    return parseFloat(amountStr.replace(/[^0-9.-]/g, ""));
  };

  // Sort Logic
  filteredDocs.sort((a, b) => {
    if (sortKey && sortDirection) {
      let comparison = 0;
      if (sortKey === "id") {
        comparison = a.id.localeCompare(b.id);
      } else if (sortKey === "type") {
        comparison = a.type.localeCompare(b.type);
      } else if (sortKey === "submittedDate") {
        comparison = parseThaiDate(a.submittedDate) - parseThaiDate(b.submittedDate);
      } else if (sortKey === "approvedDate") {
        comparison = parseThaiDate(a.approved_at) - parseThaiDate(b.approved_at);
      } else if (sortKey === "amount") {
        comparison = parseAmount(a.amount) - parseAmount(b.amount);
      } else if (sortKey === "status") {
        const priorityA = statusPriority[a.status] ?? 0;
        const priorityB = statusPriority[b.status] ?? 0;
        comparison = priorityA - priorityB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    } else {
      // Default fallback: Priority Weight of status (desc) -> date (desc)
      const priorityA = statusPriority[a.status] ?? 0;
      const priorityB = statusPriority[b.status] ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // desc
      }
      return parseThaiDate(b.approved_at || b.submittedDate) - parseThaiDate(a.approved_at || a.submittedDate); // desc
    }
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage);

  // Auto-reset page if filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilters, deptFilter, selectedCreators, selectedApprovers, dateFrom, dateTo]);

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const approvedDocs = documents.filter((d) => d.status === "Approved");
  const approvedUnorganizedCount = approvedDocs.filter((d) => !(d as any).folder_id).length;

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        {hasPerm('view_list', 'view') ? (
          <>
            <PageHeader
              size="compact"
              title="เอกสารทั้งหมด (All Documents)"
              subtitle="ดูและค้นหาเอกสารที่ผ่านการอนุมัติแล้วทั้งหมดในระบบ"
              actions={
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>อัปโหลดเอกสาร (Upload Document)</span>
                </button>
              }
            />



              {/* BULK ACTION BAR */}
              {hasPerm('bulk_select', 'edit') && selectedDocIds.length > 0 && (
                <div className="bg-blue-600 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
                      {selectedDocIds.length} รายการที่เลือก
                    </span>
                    <span className="text-xs text-blue-100 font-medium">จัดการเอกสารพร้อมกัน</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPerm('move_to_folder', 'edit') && (
                      <button
                        type="button"
                        onClick={() => setIsMoveModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <FolderInput className="w-4 h-4" />
                        <span>ย้ายเข้าโฟลเดอร์</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedDocIds([])}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}


          {/* WORKSPACE CARD */}
          <div className={`${APP_TABLE_CARD} overflow-visible flex flex-col p-6 space-y-6`}>
        
        {/* ACTIVE FOLDER BANNER INDICATOR */}
        {hasPerm('view_folders') && activeFolder && (
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/90 p-4 rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <FolderIconRenderer iconName={activeFolder.icon} className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">กำลังแสดงเอกสารในโฟลเดอร์</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                    {filteredDocs.length} รายการ
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-800 leading-snug mt-0.5">
                  {activeFolder.name}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/folders")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <span>ดูโฟลเดอร์ทั้งหมด</span>
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}

        {/* TOOLBAR */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-4">
          <div className="flex flex-wrap items-center gap-3 w-full justify-between xl:justify-start">
            
            {/* Search */}
            {hasPerm('search_filter') && (
            <div className="relative w-full sm:w-[220px] lg:w-[250px] shrink-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เลขที่, ผู้ขอ, แผนก..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all focus:bg-white shadow-sm"
              />
            </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
              
              {/* Type Filter */}
              {hasPerm('search_filter') && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">ประเภท:</span>
                  {[
                    { value: "All", label: "ทุกประเภท" },
                    { value: "PR", label: "PR" },
                    { value: "PO", label: "PO" },
                    { value: "BK", label: "BK" },
                    { value: "DOC", label: "DOC" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        if (type.value === "All") {
                          setTypeFilters(["All"]);
                        } else {
                          let newFilters = typeFilters.includes("All") ? [] : [...typeFilters];
                          if (newFilters.includes(type.value)) {
                            newFilters = newFilters.filter((t) => t !== type.value);
                          } else {
                            newFilters.push(type.value);
                          }
                          if (newFilters.length === 0) newFilters = ["All"];
                          setTypeFilters(newFilters);
                        }
                      }}
                      className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors whitespace-nowrap shadow-sm ${
                        typeFilters.includes(type.value)
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {typeFilters.includes(type.value) && <Check className="w-3 h-3" />}
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

              {/* Department Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">แผนก:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-700 font-semibold focus:outline-none hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <option value="">ทั้งหมด</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

              {/* Personnel Filter */}
              <div className="flex items-center relative shrink-0" ref={personnelRef}>
                <button
                  type="button"
                  onClick={() => setIsPersonnelPopoverOpen(!isPersonnelPopoverOpen)}
                  className={`flex items-center gap-2 border rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none transition-colors shadow-sm ${(selectedCreators.length > 0 || selectedApprovers.length > 0) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="hidden sm:inline">ผู้เกี่ยวข้อง</span>
                  <span className="sm:hidden">บุคคล</span>
                  {(selectedCreators.length > 0 || selectedApprovers.length > 0) ? ` (${selectedCreators.length + selectedApprovers.length})` : ''}
                  <ChevronDown className={`w-3.5 h-3.5 ${(selectedCreators.length > 0 || selectedApprovers.length > 0) ? 'text-blue-500' : 'text-slate-400'}`} />
                </button>

                {isPersonnelPopoverOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[320px] sm:w-[500px] md:w-[600px] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="ค้นหารายชื่อผู้เกี่ยวข้อง..."
                          value={personnelSearch}
                          onChange={(e) => setPersonnelSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row max-h-[350px] overflow-hidden">
                      {/* Creators */}
                      <div className="flex-1 overflow-y-auto p-2 border-b sm:border-b-0 sm:border-r border-slate-100 min-w-[200px]">
                        <div className="px-2 pb-1.5 pt-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest sticky top-0 bg-white z-10">ผู้สร้าง</div>
                        <div className="space-y-0.5">
                          {allSystemUsers
                            .filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase()))
                            .map(user => (
                              <label key={`creator-${user.id}`} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedCreators.includes(user.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedCreators(prev => [...prev, user.name]);
                                    else setSelectedCreators(prev => prev.filter(n => n !== user.name));
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-1 shrink-0"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 whitespace-nowrap">{user.name}</span>
                              </label>
                            ))}
                          {allSystemUsers.filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase())).length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-slate-400 font-medium">ไม่พบผู้ใช้</div>
                          )}
                        </div>
                      </div>

                      {/* Approvers */}
                      <div className="flex-1 overflow-y-auto p-2 min-w-[200px]">
                        <div className="px-2 pb-1.5 pt-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest sticky top-0 bg-white z-10">ผู้อนุมัติ</div>
                        <div className="space-y-0.5">
                          {allSystemUsers
                            .filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase()))
                            .map(user => (
                              <label key={`approver-${user.id}`} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedApprovers.includes(user.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedApprovers(prev => [...prev, user.name]);
                                    else setSelectedApprovers(prev => prev.filter(n => n !== user.name));
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-1 shrink-0"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 whitespace-nowrap">{user.name}</span>
                              </label>
                            ))}
                          {allSystemUsers.filter(u => u.name.toLowerCase().includes(personnelSearch.toLowerCase())).length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-slate-400 font-medium">ไม่พบผู้ใช้</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

              {/* Date Range Filter */}
              <div className="flex items-center relative shrink-0" ref={dateRef}>
                <button
                  type="button"
                  onClick={() => setIsDatePopoverOpen(!isDatePopoverOpen)}
                  className={`flex items-center gap-2 border rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none transition-colors shadow-sm ${(dateFrom || dateTo) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="hidden sm:inline">เลือกช่วงเวลา</span>
                  <span className="sm:hidden">วันที่</span>
                  {(dateFrom || dateTo) ? ' (ระบุแล้ว)' : ''}
                  <ChevronDown className={`w-3.5 h-3.5 ${(dateFrom || dateTo) ? 'text-blue-500' : 'text-slate-400'}`} />
                </button>

                {isDatePopoverOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[280px] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">ตั้งแต่</label>
                        <input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">ถึง</label>
                        <input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Clear Button */}
              {(dateFrom || dateTo || deptFilter || selectedCreators.length > 0 || selectedApprovers.length > 0 || search || typeFilters.length > 0 && typeFilters[0] !== "All") && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(""); setDateTo(""); setDeptFilter(""); setSelectedCreators([]); setSelectedApprovers([]); setPersonnelSearch(""); setSearch(""); setTypeFilters(["All"]); }}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors shrink-0 ml-1"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>
        </div>
{/* TABLE */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
          <table className="w-full table-fixed text-left border-collapse min-w-[1150px]">
            <colgroup>
              <col className="w-12" />
              <col className="w-[140px]" />
              <col className="w-[300px]" />
              <col className="w-[100px]" />
              <col className="w-[130px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 pl-4 text-center">
                  {hasPerm('bulk_select', 'edit') && (
                  <input
                    type="checkbox"
                    checked={paginatedDocs.length > 0 && paginatedDocs.every((d) => selectedDocIds.includes(d.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newIds = Array.from(new Set([...selectedDocIds, ...paginatedDocs.map((d) => d.id)]));
                        setSelectedDocIds(newIds);
                      } else {
                        const pageDocIds = paginatedDocs.map((d) => d.id);
                        setSelectedDocIds(selectedDocIds.filter((id) => !pageDocIds.includes(id)));
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  )}
                </th>
                <DataTableHeader title="รหัสเอกสาร" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3.5 px-3" />
                <th className="py-3.5 px-3 font-bold">ชื่อเอกสาร / รายละเอียด</th>
                <DataTableHeader title="ประเภท" sortKey="type" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3.5 px-3" />
                <th className="py-3.5 px-3 font-bold">แผนก</th>
                <DataTableHeader title="วันที่สร้าง" sortKey="submittedDate" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3.5 px-3" />
                <DataTableHeader title="วันที่อนุมัติสำเร็จ" sortKey="approvedDate" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3.5 px-3" />
                <DataTableHeader title="สถานะ" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-3.5 px-3 text-center" />
                <th className="py-3.5 pr-4 pl-3 text-center font-bold">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">Loading document database...</p>
                  </td>
                </tr>
              ) : paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc, index) => {
                  const isChecked = selectedDocIds.includes(doc.id);
                  return (
                    <tr 
                      key={(doc as any).real_id || `${doc.id}-${index}`} 
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${
                        isChecked ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="py-4 pl-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {hasPerm('bulk_select', 'edit') && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedDocIds([...selectedDocIds, doc.id]);
                            else setSelectedDocIds(selectedDocIds.filter((id) => id !== doc.id));
                          }}
                          className="rounded border-slate-300 text-blue-600 w-3.5 h-3.5"
                        />
                        )}
                      </td>
                      <td className="py-4 px-3 text-sm font-mono font-bold text-slate-600 whitespace-nowrap">{doc.id}</td>
                    <td className="py-4 px-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-400 block truncate">
                          Creator: {doc.sender} {doc.amount !== "-" ? `| Value: ${doc.amount}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <DocTypeBadge docId={doc.id} type={doc.type} />
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 inline-block max-w-full truncate" title={doc.department || (doc as any).creator?.department?.name || "ทั่วไป"}>
                        {doc.department || (doc as any).creator?.department?.name || "ทั่วไป"}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-sm text-slate-400 font-medium whitespace-nowrap">{formatThaiDate(doc.submittedDate || (doc as any).created_at)}</td>
                    <td className="py-4 px-3 text-sm text-slate-400 font-medium whitespace-nowrap">{(doc.status === "Approved" || doc.status === "อนุมัติแล้ว") && doc.approved_at ? formatThaiDate(doc.approved_at) : "-"}</td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <Badge variant={getStatusVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 pl-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {hasPerm('preview_document') && (
                        <button
                          type="button"
                          title="ดูตัวอย่าง (View Preview)"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewDoc(doc);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer inline-block"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        )}
                        {hasPerm('move_to_folder', 'edit') && (
                        <button
                          type="button"
                          title="ย้ายเข้าโฟลเดอร์ (Move to Folder)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocIds([(doc as any).real_id || doc.id]);
                            setIsMoveModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer inline-block"
                        >
                          <FolderInput className="w-4 h-4" />
                        </button>
                        )}
                        {hasPerm('edit_document', 'edit') && (doc.status === "Draft" || doc.status === "Returned" || doc.status === "Rejected" || doc.status === "Pending") && (
                          <button
                            type="button"
                            title="แก้ไขเอกสารส่งใหม่ (Edit & Resubmit)"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/submissions/create?edit=${(doc as any).real_id || doc.id}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors cursor-pointer inline-block"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPerm('download_document') && (
                        <button
                          type="button"
                          disabled={downloadingDocId === doc.id}
                          title="ดาวน์โหลด (Download)"
                          onClick={(e) => { e.stopPropagation(); triggerDownload(doc); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {downloadingDocId === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        )}
                        {hasPerm('delete_document', 'delete') && (
                        <button
                          type="button"
                          title="ลบเอกสาร (Delete)"
                          onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm font-medium text-slate-400">
                    No documents matched your filter options.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
          {!isLoading && filteredDocs.length > 0 && (
            <div className="-mx-4 -mb-4 sm:mx-0 sm:mb-0">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredDocs.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}

      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {isPreviewOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    ตัวอย่างเอกสาร (Document Preview) — {selectedDoc.id || (selectedDoc as any).name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {selectedDoc.title || (selectedDoc as any).name} ({selectedDoc.type})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/documents/${selectedDoc.id}`}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  เปิดหน้ารายละเอียดเต็ม
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setSelectedDoc(null);
                  }}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
              <DocumentPreview doc={selectedDoc} />
            </div>
          </div>
        </div>
      )}

      {/* FOLDER MODALS */}
      <FolderCreateModal
        isOpen={isCreateFolderOpen}
        onClose={() => {
          setIsCreateFolderOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={handleCreateOrUpdateFolder}
        editingFolder={editingFolder}
        departments={departments.map((d, i) => ({ id: `dept-${i}`, name: d }))}
      />

      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        onConfirm={handleMoveSelectedDocs}
        folders={folders}
        documentCount={selectedDocIds.length}
      />

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">อัปโหลดเอกสารใหม่ (Upload Document)</h3>
                  <p className="text-xs text-slate-400">อัปโหลดไฟล์ PDF เพื่อบันทึกลงระบบ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setIsUploadOpen(false);
                    setUploadFile(null);
                  }
                }}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocumentSubmit} className="p-6 space-y-4">
              {/* File input area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ไฟล์ PDF <span className="text-red-500">*</span>
                </label>
                {!uploadFile ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors">
                    <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">คลิกเพื่อเลือกไฟล์ PDF</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">รองรับไฟล์ .pdf ขนาดสูงสุด 20MB</p>
                    <input
                      type="file"
                      id="upload-doc-file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setUploadFile(f);
                          if (!uploadTitle) {
                            setUploadTitle(f.name.replace(/\.pdf$/i, ""));
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="upload-doc-file"
                      className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      เลือกไฟล์
                    </label>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[260px]">{uploadFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setUploadFile(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="ยกเลิกไฟล์"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อเรื่องเอกสาร <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="เช่น สัญญาว่าจ้าง ประจำปี 2026"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ประเภทเอกสาร
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  <option value="DOC">เอกสารทั่วไป (DOC)</option>
                  <option value="PR">ใบขอซื้อ (PR)</option>
                  <option value="PO">ใบสั่งซื้อ (PO)</option>
                  <option value="BK">บันทึกข้อความ (BK)</option>
                </select>
              </div>

              {/* Purpose / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  คำอธิบาย / วัตถุประสงค์
                </label>
                <textarea
                  rows={2}
                  value={uploadPurpose}
                  onChange={(e) => setUploadPurpose(e.target.value)}
                  placeholder="ระบุวัตถุประสงค์หรือรายละเอียดเพิ่มเติม..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      ยืนยันอัปโหลด
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          </>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center p-12 text-slate-400">
            <p className="text-sm font-bold">ไม่มีสิทธิ์เข้าถึงหน้าเอกสาร</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-slate-400">กำลังโหลดคลังเอกสาร...</div>}>
      <DocumentsContent />
    </React.Suspense>
  );
}
