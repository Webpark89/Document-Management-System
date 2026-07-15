"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Database,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  FileBox,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSidebar } from "@/components/providers/SidebarProvider";

type NavItem = {
  name: string;
  href: string;
  icon?: React.ElementType;
  tablerIcon?: string;
};

type NavGroup = {
  name: string;
  href: string;
  tablerIcon: string;
  children: NavItem[];
};

const FLAT_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Approvals", href: "/approvals", icon: CheckSquare },
  { name: "Master Data", href: "/admin/master-data", icon: Database },
  { name: "Reports", href: "/admin/audit-logs", icon: BarChart3 },
  { name: "Settings", href: "/admin/users", icon: Settings },
];

const CONFIG_GROUP: NavGroup = {
  name: "Config",
  href: "/admin/config",
  tablerIcon: "settings-2",
  children: [
    { name: "Roles", href: "/admin/config/roles", tablerIcon: "shield-lock" },
    { name: "Users", href: "/admin/config/users", tablerIcon: "users" },
  ],
};

function isConfigRoute(pathname: string) {
  return pathname === CONFIG_GROUP.href || pathname.startsWith(`${CONFIG_GROUP.href}/`);
}

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [configExpanded, setConfigExpanded] = useState(() => isConfigRoute(pathname));

  useEffect(() => {
    if (isConfigRoute(pathname)) {
      setConfigExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const displayName = user?.full_name || user?.username || "User";
  const displaySub = user?.username || "user@dms.local";
  const initials = useMemo(() => {
    const source = displayName || displaySub;
    return source
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName, displaySub]);

  const configParentActive = isConfigRoute(pathname);

  const navLinkCls = (isActive: boolean, indented = false) =>
    `flex items-center rounded-xl border-l-2 text-sm font-medium transition-all ${
      isOpen ? `${indented ? "pl-9 pr-4" : "px-4"} py-3 gap-3.5` : "p-3 justify-center"
    } ${
      isActive
        ? "border-blue-600 bg-blue-50 font-semibold text-blue-600"
        : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-30 h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-200 ease-in-out ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="p-6 flex-shrink-0">
        <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <FileBox className="w-6 h-6" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 leading-tight truncate">
                DMS Electronic
              </h1>
              <p className="text-xs text-slate-400 font-semibold truncate">
                Approval System
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {FLAT_NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={navLinkCls(isActive)}
              title={!isOpen ? item.name : undefined}
            >
              {Icon && (
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
              )}
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}

        <div>
          <div
            className={`flex items-center rounded-xl border-l-2 text-sm font-medium transition-all ${
              isOpen ? "px-4 py-3 gap-3.5" : "p-3 justify-center"
            } ${
              configParentActive
                ? "border-blue-600 bg-blue-50 font-semibold text-blue-600"
                : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Link
              href={CONFIG_GROUP.href}
              className={`flex min-w-0 flex-1 items-center gap-3.5 ${isOpen ? "" : "justify-center"}`}
              title={!isOpen ? CONFIG_GROUP.name : undefined}
            >
              <i
                className={`ti ti-${CONFIG_GROUP.tablerIcon} flex-shrink-0 text-[1.25rem] leading-none ${
                  configParentActive ? "text-blue-600" : "text-slate-400"
                }`}
              />
              {isOpen && <span className="truncate">{CONFIG_GROUP.name}</span>}
            </Link>
            {isOpen && (
              <button
                type="button"
                onClick={() => setConfigExpanded((prev) => !prev)}
                className="ml-auto inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label={configExpanded ? "Collapse Config" : "Expand Config"}
                aria-expanded={configExpanded}
              >
                {configExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            )}
          </div>

          {isOpen && configExpanded && (
            <div className="mt-1 space-y-1">
              {CONFIG_GROUP.children.map((child) => {
                const isChildActive = pathname === child.href;

                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={navLinkCls(isChildActive, true)}
                  >
                    {child.tablerIcon && (
                      <i
                        className={`ti ti-${child.tablerIcon} flex-shrink-0 text-[1.25rem] leading-none ${
                          isChildActive ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                    )}
                    <span className="truncate">{child.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {FLAT_NAV_ITEMS.slice(4).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={navLinkCls(isActive)}
              title={!isOpen ? item.name : undefined}
            >
              {Icon && (
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
              )}
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-100 flex-shrink-0">
        <div
          className={`flex items-center w-full rounded-xl ${
            isOpen ? "gap-3 px-2 py-1" : "justify-center py-1"
          }`}
        >
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isOpen && (
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-400 font-medium truncate">
                {displaySub}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className={`ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
              isOpen ? "" : "hidden"
            }`}
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={logout}
          className={`mt-2 flex items-center justify-center text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors ${
            isOpen ? "hidden" : ""
          }`}
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "rotate-180"}`} />
      </button>
    </aside>
  );
}
