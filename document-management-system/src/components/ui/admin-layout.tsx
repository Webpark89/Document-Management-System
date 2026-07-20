"use client";

import type { ElementType, ReactNode } from "react";
import { useId, useSyncExternalStore } from "react";
import { CheckCircle2, Loader2, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { AppStatCard } from "@/components/ui/AppStatCard";
import {
  MD_TABLE_CARD,
  MD_TABLE_SCROLL,
  MD_BTN_ICON,
  MD_BTN_ICON_DANGER,
  MD_ADD_BTN,
  MD_PAGE,
  MD_STAT_GRID,
  MD_STAT_AFTER_TABLE,
} from "@/components/ui/design-system";

export const MASTER_DATA_FORM_GAP = "space-y-5";
export const MASTER_DATA_LABEL_CLS = "mb-1.5 block text-xs text-slate-500";
export const MASTER_DATA_HINT_CLS = "mt-1.5 text-xs text-slate-400";
export const MASTER_DATA_ERROR_CLS = "mt-1.5 text-xs text-red-500";
export const MASTER_DATA_INPUT_CLS =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
export const MASTER_DATA_INPUT_ERROR_CLS =
  "w-full rounded-md border border-red-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";
export const MASTER_DATA_READONLY_CLS =
  "w-full cursor-not-allowed select-none rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600";
export const MASTER_DATA_MODAL_CANCEL_CLS =
  "rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50";

export {
  MD_TH,
  MD_TH_CENTER,
  MD_TH_RIGHT,
  MD_TH_NUM_RIGHT,
  MD_TH_NUM_CENTER,
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
  MD_TD_CELL_DIVIDER,
  MD_TH_CELL_DIVIDER,
  MD_TABLE_CARD,
  MD_TABLE_SCROLL,
  MD_TABLE,
  MD_STAT_GRID,
  MD_STAT_AFTER_TABLE,
  MD_TABLE_COL_4,
  MD_TABLE_COL_5,
  MD_TABLE_COL_6,
  MD_TABLE_COL_DOC_TYPES,
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
export const MD_SIDEBAR_COL = "lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-stretch";
export const MD_SIDEBAR_COL_COMPACT = "lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start";
export const MD_SIDEBAR_PANEL =
  "flex h-full min-h-0 flex-col rounded-xl bg-white shadow-sm";
export const MD_SIDEBAR_PANEL_COMPACT =
  "flex h-fit flex-col self-start rounded-xl bg-white shadow-sm";
export const MD_CONTENT_PANEL =
  "flex h-full min-h-0 flex-col rounded-xl bg-white p-6 shadow-sm";
export const MD_SIDEBAR_NAV = "space-y-1.5 p-4";
export const MD_SIDEBAR_ICON = "size-[18px] shrink-0";
export const MD_SIDEBAR_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-left text-sm text-slate-600 transition-all duration-200 hover:bg-slate-50/90 hover:text-slate-800 hover:shadow-sm";
export const MD_SIDEBAR_ITEM_ACTIVE =
  "flex w-full items-center gap-2.5 rounded-lg border-l-[3px] border-blue-500 bg-gradient-to-r from-blue-50 via-blue-50/95 to-indigo-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100/60 transition-all duration-200";
export const MD_MASTER_ADD_BTN =
  "inline-flex shrink-0 items-center gap-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100";
export const MD_SECTION = "min-w-0 flex w-full flex-1 flex-col gap-6";

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
  placement = "default",
}: {
  total: number;
  active: number;
  inactive: number;
  icon: ElementType;
  /** Master Data: stats row below table — adds gap + divider */
  placement?: "default" | "afterTable";
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

  const grid = (
    <div className={MD_STAT_GRID}>
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
    </div>
  );

  if (placement === "afterTable") {
    return <div className={MD_STAT_AFTER_TABLE}>{grid}</div>;
  }

  return grid;
}

export function MasterDataTableColGroup({ widths }: { widths: readonly string[] }) {
  return (
    <colgroup>
      {widths.map((width, index) => (
        <col key={`${width}-${index}`} style={{ width }} />
      ))}
    </colgroup>
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

const TOOLTIP_PANEL =
  "pointer-events-none absolute z-50 w-max max-w-[240px] rounded-md bg-slate-800 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white shadow-lg";

const TOOLTIP_SIDE: Record<
  "top" | "bottom" | "left",
  { panel: string; arrow: string }
> = {
  top: {
    panel: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    arrow:
      "absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800",
  },
  bottom: {
    panel: "top-full left-1/2 mt-2 -translate-x-1/2",
    arrow:
      "absolute left-1/2 bottom-full -translate-x-1/2 border-4 border-transparent border-b-slate-800",
  },
  left: {
    panel: "right-full top-1/2 mr-2 -translate-y-1/2",
    arrow:
      "absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-800",
  },
};

const tooltipSubscribers = new Set<() => void>();
let activeTooltipId: string | null = null;

function subscribeTooltips(onStoreChange: () => void) {
  tooltipSubscribers.add(onStoreChange);
  return () => tooltipSubscribers.delete(onStoreChange);
}

function setActiveTooltipId(id: string | null) {
  if (activeTooltipId === id) return;
  activeTooltipId = id;
  tooltipSubscribers.forEach((notify) => notify());
}

function useTooltipOpen(id: string) {
  return useSyncExternalStore(
    subscribeTooltips,
    () => activeTooltipId === id,
    () => false
  );
}

/** Compact hover tooltip — only one visible app-wide at a time. */
export function AnchoredTooltip({
  content,
  children,
  side = "left",
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left";
}) {
  const id = useId();
  const isOpen = useTooltipOpen(id);
  const placement = TOOLTIP_SIDE[side];

  return (
    <span
      className="relative inline-flex overflow-visible"
      onMouseEnter={() => setActiveTooltipId(id)}
      onMouseLeave={() => {
        if (activeTooltipId === id) setActiveTooltipId(null);
      }}
      onFocus={() => setActiveTooltipId(id)}
      onBlur={() => {
        if (activeTooltipId === id) setActiveTooltipId(null);
      }}
    >
      {children}
      {isOpen ? (
        <span role="tooltip" className={`${TOOLTIP_PANEL} ${placement.panel}`}>
          {content}
          <span aria-hidden className={placement.arrow} />
        </span>
      ) : null}
    </span>
  );
}

export function MasterDataFormField({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className={MASTER_DATA_LABEL_CLS}>{label}</label>
      {children}
      {error ? <p className={MASTER_DATA_ERROR_CLS}>{error}</p> : null}
      {hint && !error ? <p className={MASTER_DATA_HINT_CLS}>{hint}</p> : null}
    </div>
  );
}

export function MasterDataReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <MasterDataFormField label={label} hint={hint}>
      <div className={MASTER_DATA_READONLY_CLS}>{value}</div>
    </MasterDataFormField>
  );
}

export function MasterDataModal({
  title,
  onClose,
  onSave,
  saving = false,
  saveDisabled = false,
  wide = false,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`relative w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${wide ? "max-w-lg" : "max-w-[500px]"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-data-modal-title"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="master-data-modal-title" className="text-base font-bold text-slate-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="ปิด"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className={`mt-5 ${MASTER_DATA_FORM_GAP}`}>{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={MASTER_DATA_MODAL_CANCEL_CLS}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || saveDisabled}
            className={`${MD_ADD_BTN} disabled:opacity-60`}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
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
    <div className={`${MD_TABLE_CARD} min-w-0 shrink-0`}>
      {mobile}
      <div className={`${MD_TABLE_SCROLL} hidden min-w-0 md:block`}>{children}</div>
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
    <div className="inline-flex items-center divide-x divide-gray-200 overflow-visible">
      {onEdit && (
        <button type="button" title="แก้ไข" onClick={onEdit} className={MD_BTN_ICON}>
          <Pencil className="size-4" />
        </button>
      )}
      {onDelete &&
        (deleteBlocked && deleteTooltip ? (
          <AnchoredTooltip content={deleteTooltip} side="left">
            <span className="inline-flex cursor-not-allowed">
              <button
                type="button"
                tabIndex={-1}
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                className={`${MD_BTN_ICON_DANGER} pointer-events-none`}
              >
                <Trash2 className="size-4" />
              </button>
            </span>
          </AnchoredTooltip>
        ) : (
          <button
            type="button"
            title="ลบ"
            onClick={onDelete}
            className={MD_BTN_ICON_DANGER}
          >
            <Trash2 className="size-4" />
          </button>
        ))}
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
      <p className={MASTER_DATA_LABEL_CLS}>สถานะ</p>
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
  sidebarCompact = false,
}: {
  sidebar: ReactNode;
  breadcrumb: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Top-aligned sidebar — use when equal-height leaves awkward empty nav space */
  sidebarCompact?: boolean;
}) {
  const gridCls = sidebarCompact ? MD_SIDEBAR_COL_COMPACT : MD_SIDEBAR_COL;
  const sidebarCls = sidebarCompact ? MD_SIDEBAR_PANEL_COMPACT : MD_SIDEBAR_PANEL;

  return (
    <div className="h-fit w-full min-w-0">
      <div className={MD_PAGE}>
        <MasterDataHeader
          breadcrumb={breadcrumb}
          title={title}
          subtitle={subtitle}
          actions={actions}
        />

        <div className={`mt-6 grid grid-cols-1 ${MD_LAYOUT_GAP} ${gridCls}`}>
          <aside className={`order-2 lg:order-none ${sidebarCls}`}>{sidebar}</aside>
          <div className={`order-3 min-w-0 lg:order-none ${MD_CONTENT_PANEL}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
