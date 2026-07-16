"use client";

import React from "react";
import Sidebar from "./Sidebar";
import { useSidebar } from "@/components/providers/SidebarProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className={`min-w-0 overflow-y-auto bg-[#EAF2FB] transition-all duration-200 ${
          isOpen ? "ml-64" : "ml-20"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
