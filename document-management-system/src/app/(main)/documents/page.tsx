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
import { Badge } from "@/components/ui/badge";
import { getDocuments } from "@/features/documents/api";
import { Document } from "@/features/documents/types";
import PageHeader from "@/components/shared/PageHeader";
import { useToast } from "@/components/providers/ToastProvider";
import { getStatusVariant } from "@/lib/document-status";
import { DocumentTypeIcon } from "@/lib/document-type-icon";

export default function DocumentsPage() {
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
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

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
              // Increment minor version on edit
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
    setEditDocStatus(doc.status);
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
  const handleDeleteDoc = (docId: string) => {
    if (confirm(`Are you sure you want to permanently delete document ${docId}?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      showToast(`Document ${docId} deleted successfully`);
    }
  };

  // Filter Logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.id.toLowerCase().includes(search.toLowerCase()) ||
      doc.sender.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "All" || doc.type === typeFilter;
    const matchesStatus = statusFilter === "All" || doc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
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
    <div className="flex-1 flex flex-col min-w-0 w-full px-4 sm:px-6 lg:px-8 py-6">
      
      <PageHeader
        size="compact"
        title="Documents Center"
        subtitle="Store, organize, manage, and edit company document assets."
      />

      {/* WORKSPACE CARD */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100/50 shadow-sm flex flex-col h-full space-y-6">
        
        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search + Filter controls group */}
          <div className="flex flex-col sm:flex-row flex-1 gap-3 max-w-3xl">
            
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by name, ID, submitter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100/80 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-slate-50/50 border border-slate-100/80 rounded-xl py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[130px]"
              >
                <option value="All">All Types</option>
                <option value="PR">PR (Request)</option>
                <option value="PO">PO (Order)</option>
                <option value="Data Record">Data Record</option>
                <option value="PDF">PDF</option>
                <option value="Other">Other</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-50/50 border border-slate-100/80 rounded-xl py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[130px]"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Returned for Revision">Returned</option>
                <option value="Cancelled">Cancelled</option>
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

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-100/50 rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 pl-4">ID / Number</th>
                <th className="py-4">Document Title</th>
                <th className="py-4">Document Type</th>
                <th className="py-4">Submitted Date</th>
                <th className="py-4 text-center">Status</th>
                <th className="py-4 pr-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">Loading document database...</p>
                  </td>
                </tr>
              ) : paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
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
                    <td className="py-4 text-sm text-slate-400 font-medium">{doc.submittedDate}</td>
                    <td className="py-4 text-center">
                      <Badge variant={getStatusVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/documents/${doc.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer inline-block"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          title="Download"
                          onClick={() => triggerDownload(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm font-medium text-slate-400">
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

    </div>
  );
}
