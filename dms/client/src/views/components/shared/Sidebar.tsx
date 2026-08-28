"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Database,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileBox,
  Folder,
  Activity,
  User,
  Send
} from "lucide-react";
import { Avatar, AvatarFallback } from '@views/components/ui/avatar';
import { useAuth } from '@views/components/providers/AuthProvider';
import { useSidebar } from '@views/components/providers/SidebarProvider';

type NavItem = {
  name: string;
  href: string;
  icon?: React.ElementType;
  tablerIcon?: string;
  roles?: string[];
  permission?: string;
};

type NavGroup = {
  name: string;
  href: string;
  tablerIcon?: string;
  icon?: any;
  /** permission key that must exist to see this item: "section.item:action" */
  permission?: string;
  children: NavItem[];
};

// permission key format: "section.item:action"
// no permission = visible to all authenticated users
const FLAT_NAV_ITEMS: NavItem[] = [
  { name: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
  { name: "ส่งเรื่องขออนุมัติ", href: "/submissions", icon: Send, roles: [] },
  { name: "รายการรออนุมัติ", href: "/approvals", icon: CheckSquare, roles: [] },
  { name: "Master Data", href: "/admin/master-data", icon: Database, roles: [], permission: "masterdata.access:view" },
  { name: "Reports", href: "/admin/reports", icon: BarChart3, roles: [], permission: "reports.access:view" },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: Activity, roles: [], permission: "auditlog.access:view" },
  { name: "Profile", href: "/profile", icon: User },
];

const DOCUMENTS_GROUP: NavGroup = {
  name: "คลังเอกสาร",
  href: "/documents",
  icon: FileBox,
  children: [
    { name: "เอกสารทั้งหมด", href: "/documents", icon: FileText, roles: [] },
    { name: "โฟลเดอร์", href: "/folders", icon: Folder, roles: [] },
  ],
};

const CONFIG_GROUP: NavGroup = {
  name: "Config",
  href: "/admin/config",
  tablerIcon: "settings-2",
  permission: "config.access:view",
  children: [
    { name: "Roles", href: "/admin/config/roles", tablerIcon: "shield-lock", roles: [], permission: "config.role_management:view" },
    { name: "Users", href: "/admin/config/users", tablerIcon: "users", roles: [], permission: "config.user_management:view" },
  ],
};

function hasAccess(item: { roles?: string[]; permission?: string }, userRole?: string, permissions?: string[]) {
  // If item has a permission key, check it
  if (item.permission) {
    return permissions?.includes(item.permission) ?? false;
  }
  // No restrictions
  return true;
}

function isDocsRoute(pathname: string) {
  return pathname === "/documents" || pathname.startsWith("/documents/") || pathname === "/folders" || pathname.startsWith("/folders/");
}

function isConfigRoute(pathname: string) {
  return pathname === "/admin/config" || pathname.startsWith("/admin/config/");
}

function isNavItemActive(pathname: string, href: string) {
  if (isConfigRoute(pathname) || isDocsRoute(pathname)) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function isChildNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

const NAV_ICON = "size-5 shrink-0";
const TABLER_ICON = `ti flex ${NAV_ICON} items-center justify-center text-[1.25rem] leading-none`;

function navItemClass(isActive: boolean, isOpen: boolean, isChild = false) {
  const layout = isOpen
    ? isChild
      ? "gap-3.5 py-2.5 pl-12 pr-4"
      : "gap-3.5 px-4 py-2.5"
    : "justify-center p-3";

  const activeCls = isChild
    ? "bg-blue-50 font-semibold text-blue-600"
    : "border-blue-600 bg-blue-50 font-semibold text-blue-600";
  const inactiveCls = isChild
    ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900";

  return `flex items-center rounded-xl text-sm font-medium transition-colors ${isChild ? "" : "border-l-2"} ${layout} ${
    isActive ? activeCls : inactiveCls
  }`;
}

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const folderId = searchParams?.get("folderId");
  const { user, logout } = useAuth();
  
  const [configExpanded, setConfigExpanded] = useState(() => isConfigRoute(pathname));
  const [docsExpanded, setDocsExpanded] = useState(() => isDocsRoute(pathname));

  useEffect(() => {
    if (isConfigRoute(pathname)) {
      setConfigExpanded(true);
    }
    if (isDocsRoute(pathname)) {
      setDocsExpanded(true);
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
    const source = (displayName || displaySub).trim();
    return source ? source.charAt(0).toUpperCase() : "U";
  }, [displayName, displaySub]);

  // Highlight parent IF route matches AND (sidebar closed OR menu collapsed)
  const isConfigActive = isConfigRoute(pathname) && (!isOpen || !configExpanded);
  const isDocsActive = isDocsRoute(pathname) && (!isOpen || !docsExpanded);

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

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-2">
        {FLAT_NAV_ITEMS.slice(0, 3).filter(item => hasAccess(item, user?.role, user?.permissions)).map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={navItemClass(isActive, isOpen)}
              title={!isOpen ? item.name : undefined}
            >
              {Icon && (
                <Icon
                  className={`${NAV_ICON} ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
              )}
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}

        {hasAccess(DOCUMENTS_GROUP, user?.role, user?.permissions) && (
          <div className="space-y-2">
            <div 
              className={`${navItemClass(isDocsActive, isOpen)} ${isOpen ? "cursor-pointer gap-0 pr-2" : "cursor-pointer"}`}
              onClick={() => {
                if (!isOpen) toggle();
                setDocsExpanded((prev) => !prev);
              }}
              title={!isOpen ? DOCUMENTS_GROUP.name : undefined}
            >
              <div className={`flex min-w-0 items-center gap-3.5 ${isOpen ? "min-w-0 flex-1" : ""}`}>
                {DOCUMENTS_GROUP.icon && (
                  <DOCUMENTS_GROUP.icon
                    className={`${NAV_ICON} ${
                      isDocsActive ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                )}
                {isOpen && <span className="truncate">{DOCUMENTS_GROUP.name}</span>}
              </div>
              {isOpen && (
                <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors">
                  <ChevronRight
                    className={`size-4 shrink-0 transition-transform duration-200 ${
                      docsExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              )}
            </div>

            {isOpen && docsExpanded && (
              <div className="space-y-2">
                {DOCUMENTS_GROUP.children.filter(child => hasAccess(child, user?.role, user?.permissions)).map((child) => {
                  let isChildActive = isChildNavActive(pathname, child.href);
                  if (pathname === "/documents" && folderId) {
                    if (child.href === "/folders") isChildActive = true;
                    if (child.href === "/documents") isChildActive = false;
                  }
                  const ChildIcon = child.icon;

                  return (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={navItemClass(isChildActive, isOpen, true)}
                    >
                      {ChildIcon && (
                        <ChildIcon
                          className={`${NAV_ICON} ${
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
        )}

        {hasAccess(CONFIG_GROUP, user?.role, user?.permissions) && (
          <div className="space-y-2">
            <div 
              className={`${navItemClass(isConfigActive, isOpen)} ${isOpen ? "cursor-pointer gap-0 pr-2" : "cursor-pointer"}`}
              onClick={() => {
                if (!isOpen) toggle();
                setConfigExpanded((prev) => !prev);
              }}
              title={!isOpen ? CONFIG_GROUP.name : undefined}
            >
              <div className={`flex min-w-0 items-center gap-3.5 ${isOpen ? "min-w-0 flex-1" : ""}`}>
                <i
                  className={`${TABLER_ICON} ti-${CONFIG_GROUP.tablerIcon} ${
                    isConfigActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                {isOpen && <span className="truncate">{CONFIG_GROUP.name}</span>}
              </div>
              {isOpen && (
                <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors">
                  <ChevronRight
                    className={`size-4 shrink-0 transition-transform duration-200 ${
                      configExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              )}
            </div>

            {isOpen && configExpanded && (
              <div className="space-y-2">
                {CONFIG_GROUP.children.filter(child => hasAccess(child, user?.role, user?.permissions)).map((child) => {
                  const isChildActive = isChildNavActive(pathname, child.href);

                  return (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={navItemClass(isChildActive, isOpen, true)}
                    >
                      {child.tablerIcon && (
                        <i
                          className={`${TABLER_ICON} ti-${child.tablerIcon} ${
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
        )}

        {FLAT_NAV_ITEMS.slice(3).filter(item => hasAccess(item, user?.role, user?.permissions)).map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={navItemClass(isActive, isOpen)}
              title={!isOpen ? item.name : undefined}
            >
              {Icon && (
                <Icon
                  className={`${NAV_ICON} ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
              )}
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex-shrink-0 border-t border-slate-100 p-4">
        {isOpen ? (
          <div className="flex w-full items-center gap-3 rounded-xl px-2 py-1">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-slate-50"
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                <p className="truncate text-xs font-medium text-slate-400">{displaySub}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl py-1">
            <Link
              href="/profile"
              className="rounded-lg transition-colors hover:bg-slate-50"
              title={displayName}
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <button
              onClick={logout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="absolute top-1/2 -right-3 z-40 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "rotate-180"}`} />
      </button>
    </aside>
  );
}
