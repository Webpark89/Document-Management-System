"use client";
import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { EmployeeDashboard } from "@views/components/dashboard/EmployeeDashboard";
import { ExecutiveDashboard } from "@views/components/dashboard/ExecutiveDashboard";
import { getDocuments } from "@views/features/documents/api";
import {
  dashboardService,
  type DashboardStats,
} from "@/controllers/services/dashboard.service";
import { useAuth } from "@views/components/providers/AuthProvider";
import PageHeader from "@views/components/shared/PageHeader";
import {
  APP_PAGE_CONTENT,
  APP_PAGE_SHELL,
} from "@views/components/ui/design-system";
import {
  dashboardWidgets,
  hasDashboardPermission,
} from "@/lib/dashboard-permissions";
import {
  loadDashboardData,
  type DashboardDocument,
} from "@/lib/dashboard-data";

type DashboardView = "employee" | "executive";
interface LoadedDashboard {
  userId: string;
  permissionKey: string;
  documents: DashboardDocument[];
  stats: DashboardStats;
  departments: string[];
}
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<LoadedDashboard | null>(null);
  const [completedRequest, setCompletedRequest] = useState<string | null>(null);
  const [error, setError] = useState<{
    requestKey: string;
    message: string;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [preferredView, setPreferredView] = useState<DashboardView | null>(
    null,
  );
  const permissions = user?.permissions ?? [];
  const canViewEmployee = hasDashboardPermission(permissions, "view_employee");
  const canViewExecutive = hasDashboardPermission(
    permissions,
    "view_executive",
  );
  const activeView =
    preferredView === "employee" && canViewEmployee
      ? "employee"
      : preferredView === "executive" && canViewExecutive
        ? "executive"
        : canViewExecutive
          ? "executive"
          : "employee";
  const hasAccess = canViewEmployee || canViewExecutive;
  const hasWidgets = dashboardWidgets[activeView].some((key) =>
    hasDashboardPermission(permissions, key),
  );
  const userId = user?.id;
  const permissionKey = permissions.join("|");
  const requestKey = JSON.stringify([userId, permissionKey, reloadKey]);
  const loading = completedRequest !== requestKey;
  const currentData =
    data && data.userId === userId && data.permissionKey === permissionKey
      ? data
      : null;
  const currentError =
    error && error.requestKey === requestKey ? error.message : null;
  useEffect(() => {
    if (authLoading || !userId || !hasAccess || !hasWidgets) return;
    let active = true;
    loadDashboardData({
      documents: () => getDocuments(),
      stats: () => dashboardService.getStats(),
    })
      .then((result) => {
        if (active) setData({ ...result, userId, permissionKey });
      })
      .catch((failure: unknown) => {
        if (active)
          setError({
            requestKey,
            message:
              failure instanceof Error
                ? failure.message
                : "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ",
          });
      })
      .finally(() => {
        if (active) setCompletedRequest(requestKey);
      });
    return () => {
      active = false;
    };
  }, [authLoading, userId, hasAccess, hasWidgets, permissionKey, requestKey]);
  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
        <PageHeader
          title="ภาพรวมแดชบอร์ด"
          subtitle={`ยินดีต้อนรับกลับ, ${user?.full_name || user?.username || "ผู้ใช้งาน"}`}
          actions={
            hasAccess && (
              <div className="flex flex-wrap items-center gap-2">
                {canViewEmployee && canViewExecutive && (
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {(["executive", "employee"] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setPreferredView(view)}
                        aria-pressed={activeView === view}
                        className={`rounded-lg px-4 py-1.5 text-xs font-bold ${activeView === view ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {view === "executive"
                          ? "มุมมองผู้บริหาร"
                          : "มุมมองพนักงาน"}
                      </button>
                    ))}
                  </div>
                )}
                {hasWidgets && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />{" "}
                    อัปเดตข้อมูล
                  </button>
                )}
              </div>
            )
          }
        />
        {authLoading || !user ? (
          <LoadingDashboard />
        ) : !hasAccess ? (
          <DashboardMessage
            title="ไม่มีสิทธิ์เข้าถึงแดชบอร์ด"
            message="กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบสิทธิ์ของบัญชีนี้"
          />
        ) : !hasWidgets ? (
          <DashboardMessage
            title="ยังไม่ได้กำหนดส่วนแสดงผลแดชบอร์ด"
            message="บัญชีนี้เปิดมุมมองแดชบอร์ดได้ แต่ยังไม่มีสิทธิ์แสดงสถิติ ตาราง หรือกราฟ กรุณาติดต่อผู้ดูแลระบบ"
          />
        ) : (
          <>
            {currentError && (
              <div
                role="alert"
                className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800"
              >
                <div>
                  <p className="text-sm font-bold">
                    โหลดข้อมูลแดชบอร์ดไม่สำเร็จ
                  </p>
                  <p className="mt-1 text-xs">
                    {currentError}
                    {currentData
                      ? " — ขณะนี้แสดงข้อมูลที่โหลดสำเร็จครั้งล่าสุด"
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-bold disabled:opacity-50"
                >
                  ลองโหลดอีกครั้ง
                </button>
              </div>
            )}
            {loading && !currentData ? (
              <LoadingDashboard />
            ) : currentData ? (
              activeView === "executive" ? (
                <ExecutiveDashboard
                  documents={currentData.documents}
                  stats={currentData.stats}
                  departments={currentData.departments}
                />
              ) : (
                <EmployeeDashboard
                  documents={currentData.documents}
                  stats={currentData.stats}
                />
              )
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
function LoadingDashboard() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center p-20"
    >
      <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-4 text-sm font-medium text-slate-500">
        กำลังโหลดข้อมูลแดชบอร์ด...
      </p>
    </div>
  );
}
function DashboardMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
    >
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-400" />
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}
