"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldPlus,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { AppStatCard, StatCardGrid } from "@/components/ui/AppStatCard";
import {
  APP_CARD,
  APP_PRIMARY_BTN,
  MD_TABLE,
  MD_TABLE_CARD,
  MD_TABLE_SCROLL,
  MD_THEAD,
  MD_TH,
  MD_TH_ACTION,
  MD_TH_CENTER,
  MD_TH_STATUS,
  MD_TD,
  MD_TD_ACTION,
  MD_TD_MUTED,
  MD_TD_NUM,
  MD_TD_STATUS,
  MD_TR,
} from "@/components/ui/design-system";
import {
  ADMIN_CONTENT,
  ADMIN_PAGE_SHELL,
  AdminPageHeader,
  StatusBadge,
} from "@/app/(main)/admin/master-data/master-data-ui";
import {
  MOCK_ROLES,
  MOCK_USERS,
  countUsersByRole,
} from "@/lib/config-mock";

const ACTION_CARDS = [
  {
    title: "สร้าง Role",
    subtitle: "กำหนดสิทธิ์และระดับการเข้าถึง",
    icon: ShieldPlus,
    href: "/admin/config/roles?mode=new",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "สร้างผู้ใช้งาน",
    subtitle: "เพิ่มบัญชีผู้ใช้งานใหม่",
    icon: UserPlus,
    href: "/admin/config/users?mode=new",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
] as const;

export default function ConfigPage() {
  const router = useRouter();

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

  const permissionBadge = (summary: string) => (
    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
      {summary === "Full access" ? "เข้าถึงทั้งหมด" : summary}
    </span>
  );

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_CONTENT}>
        <AdminPageHeader
          breadcrumb={
            <nav className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Admin</span>
              <span>/</span>
              <span className="font-medium text-slate-600">การตั้งค่า</span>
            </nav>
          }
          title="การตั้งค่าระบบ"
          subtitle="In-memory demo — resets on refresh"
          actions={
            <button
              type="button"
              onClick={() => router.push("/admin/config/users?mode=new")}
              className={APP_PRIMARY_BTN}
            >
              <UserPlus className="size-4" />
              สร้างผู้ใช้งาน
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {ACTION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => router.push(card.href)}
                className={`flex items-center gap-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30 ${APP_CARD}`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className={`size-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{card.title}</p>
                  <p className="text-xs text-slate-500">{card.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        <StatCardGrid columns={4}>
          <AppStatCard
            label="Role ทั้งหมด"
            value={stats.totalRoles}
            icon={Shield}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <AppStatCard
            label="ผู้ใช้งานทั้งหมด"
            value={stats.totalUsers}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <AppStatCard
            label="ใช้งาน"
            value={stats.activeUsers}
            icon={UserCheck}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <AppStatCard
            label="ปิดใช้งาน"
            value={stats.inactiveUsers}
            icon={UserX}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
        </StatCardGrid>

        <section className={MD_TABLE_CARD}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-800">Roles</h2>
            <Link
              href="/admin/config/roles"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <div className={MD_TABLE_SCROLL}>
            <table className={MD_TABLE}>
              <thead>
                <tr className={MD_THEAD}>
                  <th className={MD_TH}>ชื่อ Role</th>
                  <th className={MD_TH_CENTER}>จำนวนผู้ใช้งาน</th>
                  <th className={MD_TH}>สิทธิ์หลัก</th>
                  <th className={MD_TH_STATUS}>สถานะ</th>
                  <th className={MD_TH_ACTION}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {roleRows.map((role) => (
                  <tr key={role.id} className={MD_TR}>
                    <td className={`${MD_TD} font-medium text-slate-800`}>{role.name}</td>
                    <td className={MD_TD_NUM}>{role.userCount}</td>
                    <td className={MD_TD}>{permissionBadge(role.permissionSummary)}</td>
                    <td className={MD_TD_STATUS}>
                      <StatusBadge active={role.isActive} />
                    </td>
                    <td className={MD_TD_ACTION}>
                      <Link
                        href="/admin/config/roles"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        จัดการที่หน้า Roles →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={MD_TABLE_CARD}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-800">ผู้ใช้งาน</h2>
            <Link
              href="/admin/config/users"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <div className={MD_TABLE_SCROLL}>
            <table className={MD_TABLE}>
              <thead>
                <tr className={MD_THEAD}>
                  <th className={MD_TH}>ชื่อ</th>
                  <th className={MD_TH}>อีเมล</th>
                  <th className={MD_TH}>แผนก</th>
                  <th className={MD_TH}>Role</th>
                  <th className={MD_TH_STATUS}>สถานะ</th>
                  <th className={MD_TH_ACTION}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((user) => (
                  <tr key={user.id} className={MD_TR}>
                    <td className={`${MD_TD} font-medium text-slate-800`}>{user.fullName}</td>
                    <td className={MD_TD_MUTED}>{user.email}</td>
                    <td className={MD_TD_MUTED}>{user.department}</td>
                    <td className={MD_TD_MUTED}>{user.role}</td>
                    <td className={MD_TD_STATUS}>
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td className={MD_TD_ACTION}>
                      <Link
                        href="/admin/config/users"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
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
