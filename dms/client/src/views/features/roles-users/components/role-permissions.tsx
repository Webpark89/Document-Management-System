"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import {
  MD_TH,
  MD_THEAD,
  MD_TR,
} from '@views/components/ui/admin';

export type ActionKey = "view" | "create" | "edit" | "delete" | "approve";
export type ProductKey = "all" | "dms" | "esign" | "reports" | "archive";
export type PermissionMatrix = Record<string, Record<string, Record<ActionKey, boolean>>>;

export type RoleFormState = {
  title: string;
  productTypes: Record<ProductKey, boolean>;
  permissions: PermissionMatrix;
};

interface PermissionItem {
  key: string;
  label: string;
  actions: ActionKey[];
}

interface PermissionSection {
  key: string;
  label: string;
  items: PermissionItem[];
}

export const PERMISSION_ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "ดู" },
  { key: "create", label: "สร้าง" },
  { key: "edit", label: "แก้ไข" },
  { key: "delete", label: "ลบ" },
  { key: "approve", label: "อนุมัติ" },
];

export const PERMISSION_SUMMARY_ACTION_ORDER = [
  "View",
  "Create",
  "Edit",
  "Delete",
  "Approve",
] as const;

export const PERMISSION_SUMMARY_LABELS: Record<string, string> = {
  View: "ดู",
  Create: "สร้าง",
  Edit: "แก้ไข",
  Delete: "ลบ",
  Approve: "อนุมัติ",
};

export function PermissionActionGrid({
  summary = "",
  roleName,
}: {
  summary?: string;
  roleName: string;
}) {
  const isFullAccess = summary === "Full access" || roleName === "Administrator";
  const granted = isFullAccess
    ? new Set<string>(PERMISSION_SUMMARY_ACTION_ORDER)
    : summary === "No permissions" || !summary
      ? new Set<string>()
      : new Set((summary || "").split(", ").filter(Boolean));

  return (
    <div className="flex min-w-[11rem] flex-wrap gap-1.5">
      {PERMISSION_SUMMARY_ACTION_ORDER.map((action) => {
        const on = granted.has(action);
        return (
          <span
            key={action}
            className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium leading-none ${
              on
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                : "bg-slate-50 text-slate-400 ring-1 ring-slate-200/80"
            }`}
          >
            {PERMISSION_SUMMARY_LABELS[action]}
          </span>
        );
      })}
    </div>
  );
}

export const PRODUCT_TYPES: { key: ProductKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "dms", label: "DMS" },
  { key: "esign", label: "eSign" },
  { key: "reports", label: "Reports" },
  { key: "archive", label: "Archive" },
];

export const PERMISSION_SCHEMA: PermissionSection[] = [
  // ─── หน้า Dashboard ────────────────────────────────────────────────────────
  {
    key: "dashboard",
    label: "หน้า Dashboard",
    items: [
      { key: "view_employee",         label: "Dashboard Mode: มุมมองพนักงาน (Employee)",                          actions: ["view"] },
      { key: "view_executive",        label: "Dashboard Mode: มุมมองผู้บริหาร (Executive)",                       actions: ["view"] },
    ],
  },

  // ─── ส่งเรื่องขออนุมัติ (/submissions) ─────────────────────────────────────────────────
  {
    key: "submissions",
    label: "ส่งเรื่องขออนุมัติ (My Submissions)",
    items: [
      { key: "view_list",             label: "ดูรายการเอกสารที่ฉันส่งขออนุมัติ",                                    actions: ["view"] },
      { key: "search_sort",           label: "ค้นหาและเรียงลำดับรายการ",                                           actions: ["view"] },
      { key: "filter_status",         label: "กรองสถานะ (Pending / Draft / Returned)",                             actions: ["view"] },
      { key: "open_doc_detail",       label: "เปิดดูรายละเอียดเอกสาร",                                            actions: ["view"] },
      { key: "create_document",       label: "สร้างเอกสารใหม่",                                                   actions: ["create"] },
      { key: "edit_document",         label: "แก้ไขเอกสาร (Draft / Returned)",                                   actions: ["edit"] },
      { key: "delete_document",       label: "ลบเอกสาร (เฉพาะ Draft)",                                           actions: ["delete"] },
      { key: "submit_document",       label: "ส่งเอกสารเข้าระบบอนุมัติ",                                         actions: ["create"] },
      { key: "view_approval_history", label: "ดูประวัติการอนุมัติทั้งหมด (ปุ่ม: ประวัติการอนุมัติ)",              actions: ["view"] },
    ],
  },

  // ─── รายการรออนุมัติ (/approvals) ─────────────────────────────────────────────────
  {
    key: "approvals",
    label: "รายการรออนุมัติ (Pending Approvals)",
    items: [
      { key: "view_list",             label: "ดูเอกสารที่ฉันต้องอนุมัติ",                                         actions: ["view"] },
      { key: "search_sort",           label: "ค้นหาและเรียงลำดับรายการ",                                           actions: ["view"] },
      { key: "open_doc_detail",       label: "เปิดดูรายละเอียดเอกสาร",                                            actions: ["view"] },
      { key: "approve_document",      label: "อนุมัติเอกสาร",                                                     actions: ["approve"] },
      { key: "reject_document",       label: "ปฏิเสธ / Reject เอกสาร",                                           actions: ["approve"] },
      { key: "return_document",       label: "ส่งคืนเอกสาร (Return for Revision)",                                actions: ["approve"] },
      { key: "place_signature",       label: "วางลายเซ็น e-Signature (ผู้อนุมัติ)",                               actions: ["approve"] },
      { key: "add_comment",           label: "เพิ่มความคิดเห็น / หมายเหตุ",                                       actions: ["edit"] },
    ],
  },

  // ─── คลังเอกสาร (/documents) ───────────────────────────────────────────────
  {
    key: "document",
    label: "คลังเอกสาร (Document Center)",
    items: [
      { key: "view_list",             label: "ดูรายการเอกสารทั้งหมด",                                             actions: ["view"] },
      { key: "view_detail",           label: "เปิดดูรายละเอียดเอกสาร",                                            actions: ["view"] },
      { key: "preview_document",      label: "Preview เอกสารในหน้านี้ (Document Preview Panel)",                  actions: ["view"] },
      { key: "scope_dropdown",        label: "ดรอปดาวน์ขอบเขตการมองเห็น (All / แผนกฉัน / เอกสารฉัน / เลือกแผนก)", actions: ["view"] },
      { key: "search_filter",         label: "ค้นหา กรองประเภท กรองสถานะ กรองวันที่",                            actions: ["view"] },
      { key: "create_document",       label: "สร้างเอกสารใหม่",                                                   actions: ["create"] },
      { key: "upload_attachment",     label: "อัปโหลดไฟล์แนบ",                                                   actions: ["create"] },
      { key: "edit_document",         label: "แก้ไขเอกสาร (Draft / Returned)",                                   actions: ["edit"] },
      { key: "submit_document",       label: "ส่งเอกสารเข้าระบบอนุมัติ",                                         actions: ["create"] },
      { key: "recall_document",       label: "ดึงเอกสารคืน (Recall)",                                            actions: ["edit"] },
      { key: "delete_document",       label: "ลบเอกสาร (เฉพาะ Draft)",                                           actions: ["delete"] },
      { key: "download_document",     label: "Download / Export เอกสาร",                                          actions: ["view"] },
      { key: "bulk_select",           label: "เลือกหลายรายการพร้อมกัน (Bulk Select)",                             actions: ["edit"] },
      { key: "view_version_history",  label: "ดูประวัติเวอร์ชัน (Version History)",                              actions: ["view"] },
      { key: "view_timeline",         label: "ดู Timeline การอนุมัติ",                                           actions: ["view"] },
      { key: "place_signature",       label: "วางลายเซ็น e-Signature (ผู้จัดทำ)",                               actions: ["edit"] },
      { key: "view_folders",          label: "ดูและเข้าถึงโฟลเดอร์",                                             actions: ["view"] },
      { key: "manage_folders",        label: "สร้าง / แก้ไข / ลบ / ปักหมุดโฟลเดอร์",                           actions: ["create", "edit", "delete"] },
      { key: "move_to_folder",        label: "ย้ายเอกสารเข้าโฟลเดอร์",                                           actions: ["edit"] },
    ],
  },

  // ─── หน้า Notifications ────────────────────────────────────────────────────

  {
    key: "notifications",
    label: "หน้า Notifications (การแจ้งเตือน)",
    items: [
      { key: "view_notifications",    label: "ดูการแจ้งเตือน",                                                    actions: ["view"] },
      { key: "mark_read",             label: "ทำเครื่องหมายว่าอ่านแล้ว",                                         actions: ["edit"] },
    ],
  },

  // ─── หน้า Reports ──────────────────────────────────────────────────────────
  {
    key: "reports",
    label: "หน้า Reports (รายงาน)",
    items: [
      { key: "access",                label: "เข้าถึงหน้า Reports ได้",                                           actions: ["view"] },
      { key: "view_reports",          label: "ดูรายงานสรุป",                                                      actions: ["view"] },
      { key: "export_reports",        label: "Export รายงาน (PDF / Excel)",                                       actions: ["view"] },
      { key: "view_all_dept",         label: "ดูรายงานของทุกแผนก (ไม่จำกัดเฉพาะแผนกตัวเอง)",                    actions: ["view"] },
    ],
  },

  // ─── หน้า Master Data ───────────────────────────────────────────────────────
  {
    key: "masterdata",
    label: "หน้า Master Data (ข้อมูลหลัก)",
    items: [
      { key: "access",                label: "เข้าถึงหน้า Master Data ได้",                                       actions: ["view"] },
      { key: "doc_types",             label: "ประเภทเอกสาร (Document Types)",                                     actions: ["view", "create", "edit", "delete"] },
      { key: "workflow",              label: "กระบวนการอนุมัติ (Workflow / Approval Matrix)",                     actions: ["view", "create", "edit", "delete"] },
      { key: "departments",           label: "แผนก (Departments)",                                               actions: ["view", "create", "edit", "delete"] },
      { key: "positions",             label: "ตำแหน่ง (Positions)",                                              actions: ["view", "create", "edit", "delete"] },
      { key: "running_numbers",       label: "เลขที่เอกสารอัตโนมัติ (Running Numbers)",                          actions: ["view", "edit"] },
      { key: "signatures",            label: "ลายเซ็น (Signature Management)",                                    actions: ["view", "create", "edit", "delete"] },
    ],
  },

  // ─── หน้า Config ───────────────────────────────────────────────────────────
  {
    key: "config",
    label: "หน้า Config (ตั้งค่าระบบ)",
    items: [
      { key: "access",                label: "เข้าถึงเมนูหัวข้อนี้ได้",                                            actions: ["view"] },
      { key: "role_management",       label: "Role (ดู / สร้าง / แก้ไข / ลบ)",                                    actions: ["view", "create", "edit", "delete"] },
      { key: "user_management",       label: "User (ดู / สร้าง / แก้ไข / ลบ)",                                    actions: ["view", "create", "edit", "delete"] },
    ],
  },

  // ─── หน้า Audit Log ────────────────────────────────────────────────────────
  {
    key: "auditlog",
    label: "หน้า Audit Log (บันทึกกิจกรรม)",
    items: [
      { key: "access",                label: "เข้าถึงหน้า Audit Log ได้",                                         actions: ["view"] },
      { key: "view_all_logs",         label: "ดู Log ของผู้ใช้ทุกคน (ไม่จำกัดเฉพาะตัวเอง)",                     actions: ["view"] },
      { key: "export_logs",           label: "Export Audit Log",                                                  actions: ["view"] },
      { key: "search_filter",         label: "ค้นหาและกรอง Log",                                                 actions: ["view"] },
    ],
  },

  // ─── หน้า Profile ──────────────────────────────────────────────────────────
  {
    key: "profile",
    label: "หน้า Profile (โปรไฟล์ผู้ใช้)",
    items: [
      { key: "view_own",              label: "ดูโปรไฟล์ตัวเอง",                                                   actions: ["view"] },
      { key: "edit_own",              label: "แก้ไขข้อมูลโปรไฟล์ตัวเอง",                                        actions: ["edit"] },
      { key: "change_password",       label: "เปลี่ยนรหัสผ่านตัวเอง",                                           actions: ["edit"] },
      { key: "upload_signature",      label: "อัปโหลด / จัดการลายเซ็นของตัวเอง",                               actions: ["edit"] },
      { key: "view_others",           label: "ดูโปรไฟล์ผู้ใช้คนอื่น (Admin)",                                    actions: ["view"] },
    ],
  },
];

function emptyRow(): Record<ActionKey, boolean> {
  return { view: false, create: false, edit: false, delete: false, approve: false };
}

export function buildPermissions(
  presets?: Record<string, Record<string, Partial<Record<ActionKey, boolean>>>>
): PermissionMatrix {
  const permissions: PermissionMatrix = {};
  for (const section of PERMISSION_SCHEMA) {
    permissions[section.key] = {};
    for (const item of section.items) {
      const preset = presets?.[section.key]?.[item.key] ?? {};
      const row = emptyRow();
      for (const action of PERMISSION_ACTIONS) {
        row[action.key] = preset[action.key] ?? false;
      }
      permissions[section.key][item.key] = row;
    }
  }
  return permissions;
}

export function countSection(
  sectionKey: string,
  permissions: PermissionMatrix
): { granted: number; total: number } {
  const section = PERMISSION_SCHEMA.find((s) => s.key === sectionKey);
  if (!section) return { granted: 0, total: 0 };
  let granted = 0;
  let total = 0;
  for (const item of section.items) {
    total += item.actions.length;
    for (const actionKey of item.actions) {
      if (permissions[sectionKey]?.[item.key]?.[actionKey]) granted += 1;
    }
  }
  return { granted, total };
}

export function countAll(permissions: PermissionMatrix): { granted: number; total: number } {
  let granted = 0;
  let total = 0;
  for (const section of PERMISSION_SCHEMA) {
    const c = countSection(section.key, permissions);
    granted += c.granted;
    total += c.total;
  }
  return { granted, total };
}

function checkState(granted: number, total: number): "none" | "some" | "all" {
  if (granted === 0) return "none";
  if (granted === total) return "all";
  return "some";
}

function sectionCheckState(sectionKey: string, permissions: PermissionMatrix) {
  const { granted, total } = countSection(sectionKey, permissions);
  return checkState(granted, total);
}

export function summarizePermissions(permissions: PermissionMatrix): string {
  const actions = new Set<string>();
  for (const section of PERMISSION_SCHEMA) {
    for (const item of section.items) {
      for (const action of PERMISSION_ACTIONS) {
        if (permissions[section.key]?.[item.key]?.[action.key]) {
          actions.add(action.label);
        }
      }
    }
  }
  if (actions.size === 0) return "No permissions";
  return Array.from(actions).join(", ");
}

function IndeterminateCheckbox({
  state,
  onChange,
  className,
}: {
  state: "none" | "some" | "all";
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === "all"}
      onChange={(e) => onChange(e.target.checked)}
      className={className}
    />
  );
}

const checkboxCls =
  "size-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-100 focus:ring-offset-0";
const countPillCls =
  "inline-flex shrink-0 items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-500";
/** Matches permission table action columns (5 × w-20) for aligned Select all controls */
const ACTION_COLS_W = "w-[25rem]";
const PERM_MATRIX_ACTION_TH =
  "w-20 px-2 py-3.5 text-center align-middle text-[11px] font-bold uppercase tracking-wider text-slate-400";
const PERM_MATRIX_ACTION_TD = "w-20 px-2 py-3.5 text-center align-middle";

export function RolePermissionPanel({
  role,
  onChange,
}: {
  role: RoleFormState;
  onChange: (next: RoleFormState) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PERMISSION_SCHEMA.map((s) => [s.key, true]))
  );
  const [searchQuery, setSearchQuery] = useState("");

  const summary = useMemo(() => countAll(role.permissions), [role.permissions]);
  const pageSelectState = useMemo(
    () => checkState(summary.granted, summary.total),
    [summary]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleSections = useMemo(() => {
    if (!normalizedSearch) return PERMISSION_SCHEMA;
    return PERMISSION_SCHEMA.filter((section) =>
      section.items.some((item) => item.label.toLowerCase().includes(normalizedSearch))
    );
  }, [normalizedSearch]);

  useEffect(() => {
    if (!normalizedSearch) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const section of PERMISSION_SCHEMA) {
        if (section.items.some((item) => item.label.toLowerCase().includes(normalizedSearch))) {
          next[section.key] = true;
        }
      }
      return next;
    });
  }, [normalizedSearch]);

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setPermission = (moduleKey: string, itemKey: string, action: ActionKey, value: boolean) => {
    onChange({
      ...role,
      permissions: {
        ...role.permissions,
        [moduleKey]: {
          ...role.permissions[moduleKey],
          [itemKey]: { ...role.permissions[moduleKey][itemKey], [action]: value },
        },
      },
    });
  };

  const applyPermissions = (checked: boolean, moduleKey?: string) => {
    const next: PermissionMatrix = { ...role.permissions };
    const sections = moduleKey
      ? PERMISSION_SCHEMA.filter((s) => s.key === moduleKey)
      : PERMISSION_SCHEMA;
    for (const section of sections) {
      next[section.key] = { ...next[section.key] };
      for (const item of section.items) {
        const row = emptyRow();
        for (const action of PERMISSION_ACTIONS) {
          row[action.key] = item.actions.includes(action.key) ? checked : false;
        }
        next[section.key][item.key] = row;
      }
    }
    onChange({ ...role, permissions: next });
  };

  return (
    <>
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหารายการ..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center border-b border-slate-100 px-6 py-4">
          <h2 className="min-w-0 flex-1 text-sm font-bold text-slate-800">สิทธิ์การใช้งาน</h2>
          <span className={`${countPillCls} mr-4 hidden sm:inline-flex`}>
            เปิดใช้ {summary.granted}/{summary.total} สิทธิ์
          </span>
          <label
            className={`flex ${ACTION_COLS_W} shrink-0 items-center justify-end gap-2 text-sm font-medium text-slate-600`}
          >
            <IndeterminateCheckbox
              state={pageSelectState}
              onChange={(checked) => applyPermissions(checked)}
              className={checkboxCls}
            />
            เลือกทั้งหมด
          </label>
        </div>
        <div className="border-b border-slate-100 px-6 py-2 sm:hidden">
          <span className={countPillCls}>
            เปิดใช้ {summary.granted}/{summary.total} สิทธิ์
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {visibleSections.map((section) => {
            const sectionCounts = countSection(section.key, role.permissions);
            const sectionState = sectionCheckState(section.key, role.permissions);
            const filteredItems = normalizedSearch
              ? section.items.filter((item) =>
                  item.label.toLowerCase().includes(normalizedSearch)
                )
              : section.items;

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.key}>
                <div className="flex items-center bg-blue-50/50 border-t border-b border-blue-100 px-6 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-bold text-blue-900"
                  >
                    <ChevronRight
                      className={`size-4 shrink-0 text-blue-500 transition-transform duration-200 ${
                        expanded[section.key] ? "rotate-90" : ""
                      }`}
                    />
                    <span>{section.label}</span>
                    <span className={countPillCls}>
                      {sectionCounts.granted}/{sectionCounts.total}
                    </span>
                  </button>
                  <label
                    className={`flex ${ACTION_COLS_W} shrink-0 items-center justify-end gap-2 text-xs font-medium text-blue-600`}
                  >
                    <IndeterminateCheckbox
                      state={sectionState}
                      onChange={(checked) => applyPermissions(checked, section.key)}
                      className={checkboxCls}
                    />
                    เลือกทั้งหมด
                  </label>
                </div>

                {expanded[section.key] && (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col />
                        {PERMISSION_ACTIONS.map((action) => (
                          <col key={action.key} style={{ width: "5rem" }} />
                        ))}
                      </colgroup>
                      <thead className={MD_THEAD}>
                        <tr>
                          <th className={`${MD_TH} font-normal text-slate-400`}>รายการ</th>
                          {PERMISSION_ACTIONS.map((action) => (
                            <th key={action.key} className={PERM_MATRIX_ACTION_TH}>
                              {action.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => (
                          <tr key={item.key} className={MD_TR}>
                            <td className="px-6 py-3.5 text-sm font-medium text-slate-700">
                              {item.label}
                            </td>
                            {PERMISSION_ACTIONS.map((action) => {
                              const isSupported = item.actions.includes(action.key);
                              return (
                                <td key={action.key} className={PERM_MATRIX_ACTION_TD}>
                                  {isSupported ? (
                                    <input
                                      type="checkbox"
                                      checked={
                                        !!role.permissions[section.key]?.[item.key]?.[action.key]
                                      }
                                      onChange={(e) =>
                                        setPermission(
                                          section.key,
                                          item.key,
                                          action.key,
                                          e.target.checked
                                        )
                                      }
                                      className={`${checkboxCls} mx-auto block`}
                                    />
                                  ) : (
                                    <span className="text-slate-300 select-none">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function RoleProductTypesField({
  productTypes,
  onChange,
}: {
  productTypes: Record<ProductKey, boolean>;
  onChange: (next: Record<ProductKey, boolean>) => void;
}) {
  const toggleProductType = (key: ProductKey, checked: boolean) => {
    if (key === "all") {
      onChange({ all: checked, dms: checked, esign: checked, reports: checked, archive: checked });
      return;
    }
    const next = { ...productTypes, [key]: checked };
    next.all = PRODUCT_TYPES.filter((p) => p.key !== "all").every((p) => next[p.key]);
    onChange(next);
  };

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">ประเภทผลิตภัณฑ์</p>
      <div className="flex flex-wrap gap-4">
        {PRODUCT_TYPES.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={productTypes[key]}
              onChange={(e) => toggleProductType(key, e.target.checked)}
              className={checkboxCls}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
