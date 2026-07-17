"use client";

import React, { useState } from "react";
import { Search, Download, Filter, Calendar, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { MOCK_AUDIT_LOGS } from "@/lib/mock-data";

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const filteredLogs = MOCK_AUDIT_LOGS.filter((log) => {
    const matchesSearch =
      log.user_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "All" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "Approve":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Reject":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Upload":
      case "Download":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Login":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Signature":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Delete":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            System Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Monitor system activities, user actions, and security events.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Date Range (e.g. 20/05/2026 - 26/05/2026)"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Actions</option>
                <option value="Login">Login</option>
                <option value="Upload">Upload</option>
                <option value="Download">Download</option>
                <option value="View">View</option>
                <option value="Approve">Approve</option>
                <option value="Reject">Reject</option>
                <option value="Signature">Signature</option>
                <option value="Delete">Delete</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or username"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
              />
            </div>
          </div>
          <div className="flex-shrink-0">
            <button className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const dateObj = new Date(log.created_at);
                const dateStr = dateObj.toLocaleDateString("en-GB");
                const timeStr = dateObj.toLocaleTimeString("en-GB");

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-slate-700">{dateStr}</div>
                      <div className="text-xs text-slate-400">{timeStr}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(log.user_fullname)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{log.user_fullname}</div>
                          <div className="text-xs text-slate-500">{log.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-600">
                      {log.module}
                    </td>
                    <td className="py-3 px-4">
                      {log.target_display ? (
                        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                          {log.target_display}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 font-mono">
                      {log.ip_address}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">1</span> to <span className="font-bold text-slate-700">{filteredLogs.length}</span> of <span className="font-bold text-slate-700">{filteredLogs.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">1</button>
            </div>
            <button className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
