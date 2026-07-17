"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  MOCK_ROLES,
  MOCK_USERS,
  countUsersByRole,
} from "@/features/roles-users";

const ACTION_CARDS = [
  {
    title: "Create role",
    subtitle: "Define permissions and access levels",
    icon: "shield-plus",
    href: "/admin/config/roles?mode=new",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Create user",
    subtitle: "Add a new user account",
    icon: "user-plus",
    href: "/admin/config/users?mode=new",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
] as const;

const thCls = "h-12 px-5 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
const tdCls = "h-12 px-5 text-left text-sm text-slate-700";
const tdMuted = "h-12 px-5 text-left text-sm text-slate-500";

export default function ConfigPage() {
  const router = useRouter();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const stats = useMemo(() => {
    const activeUsers = MOCK_USERS.filter((u) => u.isActive).length;
    return {
      totalRoles: MOCK_ROLES.length,
      totalUsers: MOCK_USERS.length,
      activeUsers,
      inactiveUsers: MOCK_USERS.length - activeUsers,
    };
  }, []);

  const roleRows = useMemo(
    () =>
      MOCK_ROLES.slice(0, 5).map((role) => ({
        ...role,
        userCount: countUsersByRole(role.name),
      })),
    []
  );

  const userRows = useMemo(() => MOCK_USERS.slice(0, 5), []);

  const statusBadge = (active: boolean) => (
    <span
      className={`rounded-md px-2 py-0.5 text-xs ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

  const permissionBadge = (summary: string) => (
    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{summary}</span>
  );

  return (
    <div className="h-fit w-full bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <span className="font-medium text-slate-600">Config</span>
        </nav>
        <h1 className="text-xl font-semibold text-slate-800">Config</h1>
        <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
      </header>

      <div className="space-y-6 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ACTION_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => router.push(card.href)}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className={`flex size-9 items-center justify-center rounded-md ${card.iconBg}`}>
                <i className={`ti ti-${card.icon} text-[1.125rem] leading-none ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-md bg-indigo-50">
              <Shield className="size-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{stats.totalRoles}</p>
              <p className="text-xs text-slate-500">จำนวน Role ทั้งหมด</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-md bg-blue-50">
              <Users className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{stats.totalUsers}</p>
              <p className="text-xs text-slate-500">จำนวนผู้ใช้งานทั้งหมด</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-md bg-green-50">
              <UserCheck className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{stats.activeUsers}</p>
              <p className="text-xs text-slate-500">ผู้ใช้งาน Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-md bg-red-50">
              <UserX className="size-4 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{stats.inactiveUsers}</p>
              <p className="text-xs text-slate-500">ผู้ใช้งานถูกปิดใช้งาน</p>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-medium text-slate-800">Roles</h2>
            <Link href="/admin/config/roles" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className={thCls}>ชื่อ Role</th>
                  <th className={thCls}>จำนวนผู้ใช้งาน</th>
                  <th className={thCls}>สิทธิ์หลัก</th>
                  <th className={thCls}>สถานะ</th>
                  <th className={`${thCls} text-right`}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {roleRows.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50"
                  >
                    <td className={`${tdCls} font-medium`}>{role.name}</td>
                    <td className={tdMuted}>{role.userCount}</td>
                    <td className="h-12 px-5">{permissionBadge(role.permissionSummary)}</td>
                    <td className="h-12 px-5">{statusBadge(role.isActive)}</td>
                    <td className="h-12 px-5 text-right text-slate-400">
                      <Link href="/admin/config/roles" className="text-xs text-blue-600 hover:text-blue-700">
                        จัดการที่หน้า Roles →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-medium text-slate-800">Users</h2>
            <Link href="/admin/config/users" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className={thCls}>ชื่อ</th>
                  <th className={thCls}>อีเมล</th>
                  <th className={thCls}>แผนก</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>สถานะ</th>
                  <th className={`${thCls} text-right`}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50"
                  >
                    <td className={`${tdCls} font-medium`}>{user.fullName}</td>
                    <td className={tdMuted}>{user.email}</td>
                    <td className={tdMuted}>{user.department}</td>
                    <td className={tdMuted}>{user.role}</td>
                    <td className="h-12 px-5">{statusBadge(user.isActive)}</td>
                    <td className="h-12 px-5 text-right text-slate-400">
                      <Link href="/admin/config/users" className="text-xs text-blue-600 hover:text-blue-700">
                        จัดการที่หน้า Users →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
