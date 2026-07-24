"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
};

const globalForSidebar = globalThis as unknown as {
  SidebarContext: React.Context<SidebarContextValue | undefined>
};

const SidebarContext = globalForSidebar.SidebarContext || createContext<SidebarContextValue | undefined>(undefined);
if (process.env.NODE_ENV !== "production") {
  globalForSidebar.SidebarContext = SidebarContext;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  const value = useMemo(
    () => ({
      isOpen,
      toggle: () => setIsOpen((prev) => !prev),
    }),
    [isOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
