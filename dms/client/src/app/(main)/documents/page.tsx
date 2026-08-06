"use client";

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
  Plus,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from '@views/components/ui/badge';
import { getDocuments, deleteDocument, getDocumentById } from '@views/features/documents/api';
import { Document } from '@views/features/documents/types';
import { DocumentPreview } from '@views/components/documents/DocumentPreview';
import PageHeader from '@views/components/shared/PageHeader';
import { useToast } from '@views/components/providers/ToastProvider';
import { useAuth } from '@views/components/providers/AuthProvider';
import { swalConfirm } from "@/lib/swal";
import { getStatusVariant } from "@/lib/document-status";
import { DocumentTypeIcon } from "@/lib/document-type-icon";
import DataTableHeader from '@views/components/ui/DataTableHeader';
import { APP_PAGE_CONTENT, APP_PAGE_SHELL, APP_TABLE_CARD } from '@views/components/ui/design-system';

export default function DocumentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: initialDocs, error } = useSWR("documents", getDocuments, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    if (initialDocs) {
      setDocuments(initialDocs);
    }
  }, [initialDocs]);

  const isLoading = !initialDocs && !error;

  // Filters State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Unified View Scope: ALL | MY_DEPT | MY_DOCS | CUSTOM_DEPTS
  type ViewScopeOption = "ALL" | "MY_DEPT" | "MY_DOCS" | "CUSTOM_DEPTS";
  const [viewScope, setViewScope] = useState<ViewScopeOption>("ALL");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isDeptPopoverOpen, setIsDeptPopoverOpen] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Departments list state — Thai Master Data Names
  const [departments, setDepartments] = useState<string[]>([
    "แผนกจัดซื้อ",
    "แผนกบัญชีและการเงิน",
    "แผนกคลังสินค้าและจัดส่ง",
    "แผนกเทคโนโลยีสารสนเทศ",
    "แผนกทรัพยากรบุคคล",
    "แผนกผลิต"
  ]);

  useEffect(() => {
    fetch("/api/admin/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data.map((d: any) => d.name || d));
        }
      })
      .catch(() => {});
  }, []);

  // Sorting State — default sort by created_at DESC
  const [sortKey, setSortKey] = useState<string | null>("submittedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

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

  // Form States - Upload
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<Document["type"]>("PR");
  const [newDocSender, setNewDocSender] = useState("");
  const [newDocAmount, setNewDocAmount] = useState("");

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

  // Create new document action
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSender) {
      alert("Please fill in document name and submitter!");
      return;
    }

    const newId = `DOC-2026-${String(documents.length + 1).padStart(3, "0")}`;
    const newDoc: Document = {
      id: newId,
      name: newDocName,
      type: newDocType,
      submittedDate: new Date().toISOString().split("T")[0],
      status: "Draft",
      sender: newDocSender,
      amount: newDocAmount ? `฿${Number(newDocAmount).toLocaleString()}` : "-",
      version: "v1.0",
      department: "Purchasing"
    };

    setDocuments([newDoc, ...documents]);
    setIsUploadOpen(false);
    
    // Clear form
    setNewDocName("");
    setNewDocSender("");
    setNewDocAmount("");
    setNewDocType("PR");

    showToast(`Successfully created ${newId} (Draft)`);
  };

  // Edit document action
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setDocuments(
      documents.map((doc) =>
        doc.id === selectedDoc.id
          ? {
              ...doc,
              name: editDocName,
              type: editDocType,
              sender: editDocSender,
              amount: editDocAmount,
              status: editDocStatus,
              version: `v${(parseFloat(doc.version.replace("v", "")) + 0.1).toFixed(1)}`,
            }
          : doc
      )
    );

    setIsEditOpen(false);
    showToast(`Updated document details for ${selectedDoc.id}`);
  };

  // Open Edit Modal with pre-populated values
  const openEditModal = (doc: Document) => {
    setSelectedDoc(doc);
    setEditDocName(doc.name);
    setEditDocType(doc.type);
    setEditDocSender(doc.sender);
    setEditDocAmount(doc.amount);
    setEditDocStatus(doc.status as Document["status"]);
    setIsEditOpen(true);
  };

  // Open Preview Modal
  const openPreviewModal = (doc: Document) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  // Download action
  const triggerDownload = (doc: Document) => {
    showToast(`Download started: ${doc.id}_original.pdf`);
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

  // Filter Logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.id.toLowerCase().includes(search.toLowerCase()) ||
      (doc.sender && doc.sender.toLowerCase().includes(search.toLowerCase())) ||
      (doc.department && doc.department.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = typeFilter === "All" || doc.type === typeFilter;
    const matchesStatus = statusFilter === "All" || doc.status === statusFilter;
    
    // Scope Visibility Filter Logic (Unified)
    let matchesScope = true;
    const docDept = doc.department || (doc as any).creator?.department?.name || "ทั่วไป";

    if (viewScope === "MY_DOCS") {
      const isMyId = (doc as any).creator_id && user?.id && (doc as any).creator_id === user.id;
      const isMyName = doc.sender && user && (
        (user.full_name && doc.sender.toLowerCase().includes(user.full_name.toLowerCase())) ||
        (user.username && doc.sender.toLowerCase().includes(user.username.toLowerCase()))
      );
      matchesScope = Boolean(isMyId || isMyName);
    } else if (viewScope === "MY_DEPT") {
      const userDept = user?.department || (user as any)?.department_name || "";
      if (userDept) {
        matchesScope = docDept.toLowerCase().includes(userDept.toLowerCase()) ||
                      userDept.toLowerCase().includes(docDept.toLowerCase());
      }
    } else if (viewScope === "CUSTOM_DEPTS") {
      if (selectedDepartments.length > 0) {
        matchesScope = selectedDepartments.some((dept) =>
          docDept.toLowerCase().includes(dept.toLowerCase()) ||
          dept.toLowerCase().includes(docDept.toLowerCase())
        );
      }
    }

    // Date Range Filter
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const docDate = new Date(doc.submittedDate || (doc as any).created_at || "").getTime();
      if (dateFrom && !isNaN(docDate)) {
        matchesDate = matchesDate && docDate >= new Date(dateFrom).getTime();
      }
      if (dateTo && !isNaN(docDate)) {
        matchesDate = matchesDate && docDate <= new Date(dateTo).getTime() + 86400000;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesScope && matchesDate;
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
      return parseThaiDate(b.submittedDate) - parseThaiDate(a.submittedDate); // desc
    }
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage);

  // Auto-reset page if filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter]);

  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      
      <PageHeader
        size="compact"
        title="ศูนย์เอกสาร"
        subtitle="จัดเก็บ จัดระเบียบ และจัดการเอกสารขององค์กร"
      />

      {/* WORKSPACE CARD */}
      <div className={`${APP_TABLE_CARD} flex flex-col p-6 space-y-6`}>
        
        {/* TOOLBAR */}
        <div className="flex flex-col space-y-4">
          
          {/* Unified Filter Bar: View Scope & Multi-Department Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100/90">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Unified View Scope Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">ขอบเขตการมองเห็น:</span>
                <select
                  value={viewScope}
                  onChange={(e) => {
                    const val = e.target.value as ViewScopeOption;
                    setViewScope(val);
                    if (val === "CUSTOM_DEPTS" && selectedDepartments.length === 0) {
                      setIsDeptPopoverOpen(true);
                    }
                  }}
                  className="bg-white border border-slate-200 shadow-2xs rounded-xl py-1.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="ALL">🌐 เอกสารทั้งหมดในระบบ (All Documents)</option>
                  <option value="MY_DEPT">🏢 เอกสารในแผนกของฉัน (My Department)</option>
                  <option value="MY_DOCS">👤 เอกสารของฉัน (My Documents)</option>
                  <option value="CUSTOM_DEPTS">📑 เลือกระบุตามแผนก... (Custom Departments)</option>
                </select>
              </div>

              {/* Multi-Department Selector Button (Appears when CUSTOM_DEPTS is chosen) */}
              {viewScope === "CUSTOM_DEPTS" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDeptPopoverOpen(!isDeptPopoverOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50/50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>🏢 เลือกแผนก {selectedDepartments.length > 0 ? `(${selectedDepartments.length})` : "(ทั้งหมด)"}</span>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Multi-Select Checkboxes Popover */}
                  {isDeptPopoverOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-30 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <span className="text-xs font-bold text-slate-700">เลือกแผนกที่ต้องการแสดง</span>
                        <div className="flex items-center gap-2 text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setSelectedDepartments([...departments])}
                            className="text-blue-600 hover:underline"
                          >
                            เลือกทั้งหมด
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedDepartments([])}
                            className="text-rose-500 hover:underline"
                          >
                            ล้าง
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {departments.map((dept) => {
                          const isChecked = selectedDepartments.includes(dept);
                          return (
                            <label
                              key={dept}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDepartments([...selectedDepartments, dept]);
                                  } else {
                                    setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
                                  }
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                              />
                              <span>{dept}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsDeptPopoverOpen(false)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          ตกลง
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Department Badges */}
              {viewScope === "CUSTOM_DEPTS" && selectedDepartments.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  {selectedDepartments.map((dept) => (
                    <span
                      key={dept}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold"
                    >
                      {dept}
                      <button
                        type="button"
                        onClick={() => setSelectedDepartments(selectedDepartments.filter((d) => d !== dept))}
                        className="hover:text-blue-900 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">ช่วงวันที่:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl py-1 px-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl py-1 px-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="text-[11px] font-bold text-rose-500 hover:underline ml-1"
                >
                  ล้างวันที่
                </button>
              )}
            </div>
          </div>

          {/* Search + Filter controls group */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row flex-1 gap-3 max-w-3xl">
              
              {/* Search */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by name, ID, submitter, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100/80 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Type Filter — 4 Real Types */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none bg-slate-50/50 border border-slate-100/80 rounded-xl py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[140px]"
                >
                  <option value="All">ทุกประเภท (All Types)</option>
                  <option value="PR">PR (ใบขอซื้อ)</option>
                  <option value="PO">PO (ใบสั่งซื้อ)</option>
                  <option value="BK">BK (บันทึกข้อความ)</option>
                  <option value="DOC">DOC (เอกสารทั่วไป)</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Status Filter — 5 Unified Statuses */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-slate-50/50 border border-slate-100/80 rounded-xl py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[150px]"
                >
                  <option value="All">ทุกสถานะ (All Statuses)</option>
                  <option value="Draft">Draft (ร่าง)</option>
                  <option value="Pending">Pending (รออนุมัติ)</option>
                  <option value="Approved">Approved (อนุมัติแล้ว)</option>
                  <option value="Returned">Returned (ส่งกลับไปแก้ไข)</option>
                  <option value="Cancelled">Cancelled (ยกเลิก)</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </span>
              </div>

            </div>

            {/* Add New Button */}
            <Link
              href="/documents/upload"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm transition-all shadow-sm shadow-blue-100 cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add New
            </Link>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-100/50 rounded-2xl">
          <table className="w-full table-fixed text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <DataTableHeader title="ID / Number" sortKey="id" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="pl-4 py-4 w-32" />
                <th className="py-4 font-bold">Document Title</th>
                <DataTableHeader title="Document Type" sortKey="type" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-32" />
                <th className="py-4 font-bold w-32">Department</th>
                <DataTableHeader title="Created Date" sortKey="submittedDate" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 w-36" />
                <DataTableHeader title="Status" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} className="py-4 text-center w-40" />
                <th className="py-4 pr-4 text-center font-bold w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">Loading document database...</p>
                  </td>
                </tr>
              ) : paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc, index) => (
                  <tr 
                    key={(doc as any).real_id || `${doc.id}-${index}`} 
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 pl-4 text-sm font-bold text-slate-500">{doc.id}</td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                          {doc.name}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Creator: {doc.sender} {doc.amount !== "-" ? `| Value: ${doc.amount}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600">
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {doc.department || (doc as any).creator?.department?.name || "ทั่วไป"}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-slate-400 font-medium">{doc.submittedDate}</td>
                    <td className="py-4 text-center">
                      <Badge variant={getStatusVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="View Preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewDoc(doc);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer inline-block"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(doc.status === "Draft" || doc.status === "Returned" || doc.status === "Pending") && (
                          <button
                            type="button"
                            title="Edit & Resubmit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(doc);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors cursor-pointer inline-block"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Download"
                          onClick={(e) => { e.stopPropagation(); triggerDownload(doc); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs font-semibold text-slate-500">
            <span>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDocs.length)} of{" "}
              {filteredDocs.length} items
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg border text-center transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "border-slate-100 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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

      </div>
    </div>
  );
}
