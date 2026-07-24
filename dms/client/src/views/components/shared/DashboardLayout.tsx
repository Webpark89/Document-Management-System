"use client";

import React from "react";
import Sidebar from "./Sidebar";
import { useSidebar } from '@views/components/providers/SidebarProvider';

/** Must match Sidebar `w-64` / `w-20` and `ml-*` on main */
const SIDEBAR_WIDTH_OPEN = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "5rem";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen } = useSidebar();
  const sidebarWidth = isOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className="relative z-0 flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#EAF2FB] transition-[margin-left,width] duration-200 ease-in-out"
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth})`,
        }}
      >
        <div className="flex w-full min-w-0 flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
