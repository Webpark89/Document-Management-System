"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Shield,
  ShieldPlus,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { AppStatCard, StatCardGrid } from '@views/components/ui/AppStatCard';
import { APP_CARD } from '@views/components/ui/design-system';
import {
  ADMIN_CONTENT,
  ADMIN_PAGE_SHELL,
  AdminPageHeader,
} from '@views/components/ui/admin';
import { MOCK_ROLES, MOCK_USERS } from '@views/features/roles-users';

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

const NAV_CARDS = [
  {
    title: "จัดการ Roles",
    description: "ดู สร้าง แก้ไข และกำหนดสิทธิ์การเข้าถึงแต่ละบทบาท",
    href: "/admin/config/roles",
    icon: Shield,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    badgeBg: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    countKey: "totalRoles" as const,
    countLabel: "บทบาท",
  },
  {
    title: "จัดการ Users",
    description: "ดู สร้าง แก้ไข และจัดการบัญชีผู้ใช้งานในระบบ",
    href: "/admin/config/users",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-50 text-blue-700 ring-blue-100",
    countKey: "totalUsers" as const,
    countLabel: "ผู้ใช้งาน",
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
            label="บทบาททั้งหมด"
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            const count = stats[card.countKey];
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group flex items-start gap-4 transition-colors hover:bg-blue-50/30 ${APP_CARD}`}
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className={`size-6 ${card.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">{card.title}</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${card.badgeBg}`}
                    >
                      {count} {card.countLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{card.description}</p>
                </div>
                <ChevronRight className="mt-1 size-5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-600" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
