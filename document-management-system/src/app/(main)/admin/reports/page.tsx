import React from "react";
import { BarChart3, AlertCircle } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Management Reports
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          View analytical reports and download raw data.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 mt-10">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-amber-800">
          Custom Reports Not Available
        </h2>
        <p className="text-amber-700/80 text-sm max-w-md">
          Custom reporting features and extended dashboards are not included in the current project scope. Please refer to the <strong>System Audit Log</strong> for historical data, or the <strong>Dashboard</strong> for system overviews.
        </p>
      </div>
    </div>
  );
}
