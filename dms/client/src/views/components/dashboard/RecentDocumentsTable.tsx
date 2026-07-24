"use client";

import React from "react";
import { Search } from "lucide-react";
import { Badge } from '@views/components/ui/badge';
import { Document } from '@views/features/documents/types';
import { getStatusVariant } from "@/lib/document-status";
import { DocumentTypeIcon } from "@/lib/document-type-icon";

interface RecentDocumentsTableProps {
  documents: Document[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function RecentDocumentsTable({
  documents,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
}: RecentDocumentsTableProps) {
  return (
    <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Recent Documents</h3>
          <p className="text-sm text-slate-400 font-medium">Tracking newly submitted and updated workflows</p>
        </div>

        {/* Status Quick Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {["All", "Pending", "Approved", "Returned for Revision", "Draft"].map((status) => (
            <button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${
                statusFilter === status
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
              }`}
            >
              {status === "Returned for Revision" ? "Returned" : status}
            </button>
          ))}

          <a
            href="/documents"
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 transition-all shadow-xs ml-auto sm:ml-0"
          >
            See all
          </a>
        </div>
      </div>

      {/* Internal Search bar for smaller screens/table specific */}
      <div className="relative mb-4 sm:hidden">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          placeholder="Search within recent..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full bg-slate-50/50 border border-slate-100/80 rounded-xl py-3 pl-10 pr-4 text-base font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pl-2">Document Name</th>
              <th className="pb-3">Doc Number</th>
              <th className="pb-3">Submitter</th>
              <th className="pb-3">Submitted Date</th>
              <th className="pb-3 pr-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/80">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 pl-2 flex items-center gap-3">
                    <DocumentTypeIcon type={doc.type} size="md" />
                    <div>
                      <p className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {doc.name}
                      </p>
                      <span className="text-xs font-bold text-slate-400">
                        {doc.amount !== "-" ? `Value: ${doc.amount}` : "No Financial Value"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-base font-semibold text-slate-500">{doc.id}</td>
                  <td className="py-4 text-base font-medium text-slate-600">{doc.sender}</td>
                  <td className="py-4 text-base text-slate-400 font-medium">{doc.submittedDate}</td>
                  <td className="py-4 pr-2 text-right">
                    <Badge variant={getStatusVariant(doc.status)}>
                      {doc.status}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-base font-medium text-slate-400">
                  No documents found matching the active filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentDocumentsTable;
