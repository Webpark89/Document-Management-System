"use client";

import type { ElementType, ReactNode } from "react";
import { CheckCircle2, Pencil, RotateCcw, Trash2 } from "lucide-react";

export const MD_TH =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 sm:px-6";
export const MD_TH_CENTER = `${MD_TH} text-center`;
export const MD_TH_RIGHT = `${MD_TH} text-right`;
export const MD_TH_ACTION = `${MD_TH} text-right align-middle`;
export const MD_TH_STATUS =
  "w-[7.5rem] min-w-[7.5rem] px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 sm:px-6";
export const MD_TH_STICKY = `${MD_TH} md:sticky md:left-0 md:z-20 md:min-w-[9rem] md:max-w-[40vw] md:bg-gray-50 md:shadow-[4px_0_8px_-4px_rgba(15,23,42,0.12)]`;
export const MD_TD = "px-4 py-3 text-left text-sm text-slate-700 align-middle sm:px-6";
export const MD_TD_MUTED = "px-4 py-3 text-left text-sm text-slate-500 align-middle sm:px-6";
export const MD_TD_NUM = "px-4 py-3 text-center text-sm text-slate-600 tabular-nums align-middle sm:px-6";
export const MD_TD_NUM_RIGHT =
  "px-4 py-3 text-right text-sm text-slate-600 tabular-nums align-middle sm:px-6";
export const MD_TD_ACTION = "px-4 py-3 text-right align-middle text-sm sm:px-6";
export const MD_TD_STATUS =
  "w-[7.5rem] min-w-[7.5rem] px-4 py-3 text-center align-middle text-sm sm:px-6";
export const MD_TD_STICKY = `${MD_TD} md:sticky md:left-0 md:z-10 md:min-w-[9rem] md:max-w-[40vw] md:bg-white md:font-medium md:shadow-[4px_0_8px_-4px_rgba(15,23,42,0.08)] md:group-hover:bg-slate-50/80`;
export const MD_TABLE_CARD = "w-full rounded-lg border border-gray-200 bg-white shadow-sm";
export const MD_TABLE_SCROLL =
  "overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]";
export const MD_TABLE = "min-w-[640px] w-full text-sm";
export const MD_BTN_ICON =
  "rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50";
export const MD_BTN_ICON_DANGER =
  "rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
export const MD_ADD_BTN =
  "inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700";
export const MD_PAGE = "w-full min-w-0 max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8";
export const MD_LAYOUT_GAP = "gap-5";
export const MD_SIDEBAR_COL = "lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start";
export const MD_SIDEBAR_PANEL = "h-fit self-start rounded-lg border border-gray-200 bg-white shadow-sm";
export const MD_SIDEBAR_NAV = "space-y-1 p-4";
export const MD_SECTION = "min-w-0 w-full space-y-6";
export const MD_STAT_GAP = "gap-5";

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
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ value, label, icon: ItemIcon, iconBg, iconColor }) => (
        <div
          key={label}
          className="flex min-h-[88px] w-full min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
            <ItemIcon className={`size-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tabular-nums text-slate-800">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
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
        <li key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
    <div className="inline-flex min-h-10 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
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
    <div className="border-b border-gray-200 pb-4">
      <div className="mb-2">{breadcrumb}</div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 text-xl font-semibold leading-8 text-slate-800">{title}</h1>
        {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
      </div>
      {subtitle ? <p className="mt-2 text-xs leading-4 text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

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
    <div className="h-fit w-full min-w-0 bg-gray-50">
      <div className={MD_PAGE}>
        <div className="mb-6">
          <MasterDataHeader
            breadcrumb={breadcrumb}
            title={title}
            subtitle={subtitle}
            actions={actions}
          />
        </div>

        <div className={`grid grid-cols-1 ${MD_LAYOUT_GAP} ${MD_SIDEBAR_COL}`}>
          <aside className={`order-2 lg:order-none ${MD_SIDEBAR_PANEL}`}>{sidebar}</aside>
          <div className={`order-3 min-w-0 lg:order-none ${MD_SECTION}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
