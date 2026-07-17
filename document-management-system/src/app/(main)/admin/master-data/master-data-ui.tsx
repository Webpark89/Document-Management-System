"use client";

import type { ElementType, ReactNode } from "react";
import { CheckCircle2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { AppStatCard, StatCardGrid } from "@/components/ui/AppStatCard";
import {
  MD_TABLE_CARD,
  MD_TABLE_SCROLL,
  MD_BTN_ICON,
  MD_BTN_ICON_DANGER,
  MD_PAGE,
} from "@/components/ui/design-system";

export {
  MD_TH,
  MD_TH_CENTER,
  MD_TH_RIGHT,
  MD_TH_ACTION,
  MD_TH_STATUS,
  MD_TH_STICKY,
  MD_THEAD,
  MD_TD,
  MD_TD_MUTED,
  MD_TD_NUM,
  MD_TD_NUM_RIGHT,
  MD_TD_ACTION,
  MD_TD_STATUS,
  MD_TD_STICKY,
  MD_TABLE_CARD,
  MD_TABLE_SCROLL,
  MD_TABLE,
  MD_TR,
  MD_BTN_ICON,
  MD_BTN_ICON_DANGER,
  MD_ADD_BTN,
  MD_PAGE,
  MD_STAT_GAP,
  ADMIN_CONTENT,
  ADMIN_PAGE_SHELL,
} from "@/components/ui/design-system";

export const MD_LAYOUT_GAP = "gap-6";
export const MD_SIDEBAR_COL = "lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start";
export const MD_SIDEBAR_PANEL =
  "h-fit self-start rounded-xl bg-white shadow-sm";
export const MD_SIDEBAR_NAV = "space-y-2 p-4";
export const MD_SECTION = "min-w-0 w-full space-y-6";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80"
      }`}
    >
      {active ? "ใช้งาน" : "ปิดใช้งาน"}
    </span>
  );
}

export function InactiveFilterCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-200"
      />
      แสดงรายการที่ปิดใช้งาน
    </label>
  );
}

export function StatCards({
  total,
  active,
  inactive,
  icon: Icon,
}: {
  total: number;
  active: number;
  inactive: number;
  icon: ElementType;
}) {
  const items = [
    { value: total, label: "ทั้งหมด", icon: Icon, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    {
      value: active,
      label: "ใช้งาน",
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      value: inactive,
      label: "ปิดใช้งาน",
      icon: Trash2,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ] as const;

  return (
    <StatCardGrid columns={3}>
      {items.map(({ value, label, icon: ItemIcon, iconBg, iconColor }) => (
        <AppStatCard
          key={label}
          label={label}
          value={value}
          icon={ItemIcon}
          iconBg={iconBg}
          iconColor={iconColor}
        />
      ))}
    </StatCardGrid>
  );
}

export type MasterDataMobileRow = {
  id: string;
  title: string;
  badge?: ReactNode;
  fields: { label: string; value: ReactNode }[];
  actions?: ReactNode;
};

export function MasterDataMobileCardList({ rows }: { rows: MasterDataMobileRow[] }) {
  return (
    <ul className="space-y-3 p-4 md:hidden">
      {rows.map((row) => (
        <li key={row.id} className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 font-medium text-slate-800">{row.title}</p>
            {row.badge}
          </div>
          <dl className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            {row.fields.map((field) => (
              <div key={field.label} className="flex items-start justify-between gap-4 text-sm">
                <dt className="shrink-0 text-slate-500">{field.label}</dt>
                <dd className="min-w-0 text-right text-slate-700">{field.value}</dd>
              </div>
            ))}
          </dl>
          {row.actions ? (
            <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">{row.actions}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function MasterDataTableWrap({
  empty,
  emptyContent,
  mobile,
  children,
}: {
  empty?: boolean;
  emptyContent?: ReactNode;
  mobile?: ReactNode;
  children: ReactNode;
}) {
  if (empty) {
    return <div className={MD_TABLE_CARD}>{emptyContent}</div>;
  }

  return (
    <div className={MD_TABLE_CARD}>
      {mobile}
      <div className={`${MD_TABLE_SCROLL} hidden md:block`}>{children}</div>
    </div>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  onRestore,
  deleteBlocked = false,
  deleteTooltip = "ลบ",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  deleteBlocked?: boolean;
  deleteTooltip?: string;
}) {
  if (onRestore) {
    return (
      <button type="button" title="กู้คืน" onClick={onRestore} className={MD_BTN_ICON}>
        <RotateCcw className="size-4" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center divide-x divide-gray-200">
      {onEdit && (
        <button type="button" title="แก้ไข" onClick={onEdit} className={MD_BTN_ICON}>
          <Pencil className="size-4" />
        </button>
      )}
      {onDelete && (
        <span className="group relative inline-flex">
          <button
            type="button"
            title={deleteBlocked ? undefined : "ลบ"}
            onClick={onDelete}
            disabled={deleteBlocked}
            className={MD_BTN_ICON_DANGER}
          >
            <Trash2 className="size-4" />
          </button>
          {deleteBlocked && deleteTooltip && (
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 hidden w-64 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg group-hover:block"
            >
              {deleteTooltip}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export function StatusFormToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">สถานะ</p>
      <div className="inline-flex rounded-md border border-gray-200 p-0.5">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
          }`}
        >
          ใช้งาน
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            !active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-gray-50"
          }`}
        >
          ปิดใช้งาน
        </button>
      </div>
    </div>
  );
}

export function PageTabSwitcher({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="inline-flex min-h-10 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            active === tab.key
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-gray-50 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function MasterDataHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
}: {
  breadcrumb: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-2">{breadcrumb}</div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="relative z-20 flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Config list pages (Roles/Users) — same header scale as Master Data / Dashboard */
export const AdminPageHeader = MasterDataHeader;

export function MasterDataLayout({
  sidebar,
  breadcrumb,
  title,
  subtitle,
  actions,
  children,
}: {
  sidebar: ReactNode;
  breadcrumb: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-fit w-full min-w-0">
      <div className={MD_PAGE}>
        <MasterDataHeader
          breadcrumb={breadcrumb}
          title={title}
          subtitle={subtitle}
          actions={actions}
        />

        <div className={`mt-6 grid grid-cols-1 ${MD_LAYOUT_GAP} ${MD_SIDEBAR_COL}`}>
          <aside className={`order-2 lg:order-none ${MD_SIDEBAR_PANEL}`}>{sidebar}</aside>
          <div className={`order-3 min-w-0 lg:order-none ${MD_SECTION}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
