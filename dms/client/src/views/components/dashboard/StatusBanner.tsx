"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface StatusBannerProps {
  pendingCount: number;
}

export function StatusBanner({ pendingCount }: StatusBannerProps) {
  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm shadow-amber-100/30">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
          <AlertCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-lg">
            You have {pendingCount} documents awaiting your approval
          </p>
          <p className="text-sm text-amber-50/90 font-medium">
            Please review them promptly to maintain electronic workflow momentum.
          </p>
        </div>
      </div>
      <a
        href="/approvals"
        className="w-full sm:w-auto px-5 py-3 bg-white text-amber-600 font-bold rounded-xl text-sm hover:bg-amber-50 transition-all text-center shrink-0 cursor-pointer shadow-sm active:scale-95 block"
      >
        View List
      </a>
    </div>
  );
}

export default StatusBanner;
