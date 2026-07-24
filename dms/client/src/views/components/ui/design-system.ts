/** Dashboard-aligned design tokens — single source for app-wide UI */

export const APP_PAGE_BG = "bg-[#EAF2FB]";
/** Outer page shell: horizontal padding only; width comes from DashboardLayout main */
export const APP_PAGE_SHELL =
  "flex min-w-0 w-full flex-1 flex-col px-6 py-6 sm:px-8 lg:px-10";
/** Inner content: fluid full width within shell — no narrow max-width column */
export const APP_PAGE_CONTENT = "w-full min-w-0 space-y-6";
export const APP_SECTION_GAP = "space-y-6";
export const APP_GRID_GAP = "gap-6";

export const APP_CARD = "rounded-xl bg-white p-5 shadow-sm";
/** Larger section card (forms, profile panels) */
export const APP_CARD_LG = "rounded-xl bg-white p-6 shadow-sm";
export const APP_TABLE_CARD =
  "w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm";
export const APP_PRIMARY_BTN =
  "inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export const APP_STAT_CARD =
  "flex min-h-[120px] w-full min-w-0 flex-col items-start rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm";
export const APP_STAT_LABEL =
  "text-[11px] font-bold uppercase tracking-wider text-slate-500";
export const APP_STAT_VALUE =
  "mt-auto text-3xl font-black tabular-nums tracking-tight text-slate-800";

export const APP_STAT_GRID_3 =
  "grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
export const APP_STAT_GRID_4 =
  "grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4";
export const APP_STAT_GRID_5 =
  "grid w-full grid-cols-2 gap-6 md:grid-cols-5";

/* Table tokens (shared with Master Data / Config) */
export const MD_TH =
  "px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400";
export const MD_TH_CENTER = `${MD_TH} text-center`;
export const MD_TH_RIGHT = `${MD_TH} text-right`;
/** Numeric count column header — pair with MD_TD_NUM_RIGHT */
export const MD_TH_NUM_RIGHT = `${MD_TH} text-right align-middle`;
/** Numeric count column header (center) — pair with MD_TD_NUM */
export const MD_TH_NUM_CENTER = `${MD_TH} text-center align-middle`;
export const MD_TH_ACTION = `${MD_TH} text-right align-middle`;
export const MD_TH_STATUS =
  "px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400";
export const MD_TH_STICKY = `${MD_TH} md:sticky md:left-0 md:z-20 md:min-w-[9rem] md:max-w-[40vw] md:bg-white/95 md:shadow-[4px_0_8px_-4px_rgba(15,23,42,0.12)]`;
export const MD_THEAD = "border-b border-slate-100 bg-slate-50/25";
export const MD_TD = "px-6 py-5 text-left text-sm text-slate-700 align-middle";
export const MD_TD_MUTED = "px-6 py-5 text-left text-sm text-slate-500 align-middle";
export const MD_TD_NUM = "px-6 py-5 text-center align-middle text-sm text-slate-600 tabular-nums";
export const MD_TD_NUM_RIGHT =
  "px-6 py-5 text-right align-middle text-sm text-slate-600 tabular-nums lining-nums";
export const MD_TD_ACTION = "px-6 py-5 text-right align-middle text-sm";
export const MD_TD_STATUS = "px-6 py-5 text-center align-middle text-sm";
export const MD_TD_CELL_DIVIDER = "border-l border-slate-100 pl-8";
export const MD_TH_CELL_DIVIDER = "border-l border-slate-100 pl-8";
export const MD_TD_STICKY = `${MD_TD} md:sticky md:left-0 md:z-10 md:min-w-[9rem] md:max-w-[40vw] md:bg-white md:font-medium md:shadow-[4px_0_8px_-4px_rgba(15,23,42,0.08)] md:group-hover:bg-slate-50/50`;
export const MD_TABLE_SCROLL =
  "overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]";
export const MD_TABLE = "w-full min-w-0 table-fixed text-sm";
/** Master Data stat row — equal thirds at md+; sits below table with visible separation */
export const MD_STAT_GRID = "grid w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-3";
export const MD_STAT_AFTER_TABLE =
  "mt-6 w-full shrink-0 border-t border-slate-200/80 pt-6";
/** Fixed column sets for table-fixed layouts (sum ≈ 100%) */
/** Fixed width for count columns — stable right-edge alignment under wrapped headers */
export const MD_TABLE_NUM_COL_WIDTH = "7.5rem";
export const MD_TABLE_COL_4 = ["35%", "30%", MD_TABLE_NUM_COL_WIDTH, "15%"] as const;
export const MD_TABLE_COL_5 = ["25%", "15%", MD_TABLE_NUM_COL_WIDTH, "15%", "15%"] as const;
export const MD_TABLE_COL_6 = ["22%", "12%", "26%", MD_TABLE_NUM_COL_WIDTH, "14%", "14%"] as const;
/** Doc types: name | prefix+form (tight) | divider gap via count col | metrics */
export const MD_TABLE_COL_DOC_TYPES = [
  "28%",
  "9%",
  "22%",
  MD_TABLE_NUM_COL_WIDTH,
  "13%",
  "13%",
] as const;
export const MD_TR =
  "border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/50";
export const MD_BTN_ICON =
  "rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50";
export const MD_BTN_ICON_DANGER =
  "rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

/* Aliases for admin pages */
export const ADMIN_PAGE_SHELL = APP_PAGE_SHELL;
export const ADMIN_CONTENT = APP_PAGE_CONTENT;
export const MD_TABLE_CARD = APP_TABLE_CARD;
export const MD_ADD_BTN = APP_PRIMARY_BTN;
export const MD_STAT_GAP = "gap-6";
/** Master Data layout shell — same fluid width as APP_PAGE_SHELL */
export const MD_PAGE = APP_PAGE_SHELL;