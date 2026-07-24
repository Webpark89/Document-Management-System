"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  Shield,
  Database,
  Hash,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  FileStack,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "เอกสาร",
    href: "/documents",
    icon: FileText,
  },
  {
    label: "รออนุมัติ",
    href: "/approvals",
    icon: CheckSquare,
  },
  {
    label: "ตั้งค่าระบบ",
    icon: Database,
    adminOnly: true,
    children: [
      { label: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
      { label: "Role & สิทธิ์", href: "/admin/roles", icon: Shield },
      { label: "Master Data", href: "/admin/master-data", icon: Database },
      { label: "Running Number", href: "/admin/running-number", icon: Hash },
      { label: "Audit Log", href: "/admin/audit-logs", icon: ClipboardList },
    ],
  },
];

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() =>
    item.children?.some((child) => child.href && pathname.startsWith(child.href)) ?? false
  );

  const isActive = item.href
    ? item.href === "/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href)
    : false;

  if (item.children) {
    return (
      <li>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            "text-[--color-sidebar-text] hover:bg-[--color-sidebar-hover] hover:text-white",
            depth > 0 && "pl-10"
          )}
        >
          <item.icon className="size-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? (
            <ChevronDown className="size-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="size-3.5 text-slate-500" />
          )}
        </button>
        {open && (
          <ul className="mt-0.5 space-y-0.5">
            {item.children.map((child) => (
              <NavLink key={child.href ?? child.label} item={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href!}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-[--color-sidebar-active] text-white shadow-sm"
            : "text-[--color-sidebar-text] hover:bg-[--color-sidebar-hover] hover:text-white",
          depth > 0 && "pl-10"
        )}
      >
        <item.icon className="size-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-[--color-sidebar-bg]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[--color-sidebar-border] px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600">
          <FileStack className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">DMS</p>
          <p className="text-[10px] text-slate-500">Document Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href ?? item.label} item={item} />
          ))}
        </ul>
      </nav>

      {/* Bottom User Info */}
      <div className="border-t border-[--color-sidebar-border] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            วภ
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">วิภา รักดี</p>
            <p className="truncate text-[10px] text-slate-500">Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
