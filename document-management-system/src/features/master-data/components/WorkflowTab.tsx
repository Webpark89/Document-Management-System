"use client";

import { GitBranch, Inbox } from "lucide-react";
import type { WorkflowRecord, DocumentTypeRecord } from "@/features/master-data";
import {
  InactiveFilterCheckbox,
  MasterDataMobileCardList,
  MasterDataTableWrap,
  MD_TD_ACTION,
  MD_TD_NUM,
  MD_TD_STICKY,
  MD_TD_STATUS,
  MD_TH_ACTION,
  MD_TH_CENTER,
  MD_TH_STICKY,
  MD_TH_STATUS,
  MD_TABLE,
  MD_THEAD,
  MD_TR,
  RowActions,
  StatCards,
  StatusBadge,
} from "@/components/ui/admin";

export default function WorkflowTab({
  rows,
  docTypes = [],
  showDeleted,
  onShowDeletedChange,
  stats,
  onEdit,
  onDelete,
  onRestore,
}: {
  rows: WorkflowRecord[];
  docTypes?: DocumentTypeRecord[];
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  stats: { total: number; active: number; deleted: number };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const emptyContent = (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <Inbox className="size-10 text-slate-300" />
      <p className="text-sm text-slate-500">
        {showDeleted ? "ไม่มีรายการที่ปิดใช้งาน" : "ไม่มีข้อมูล"}
      </p>
      <p className="text-xs text-slate-400">
        {showDeleted
          ? "รายการที่กู้คืนจะแสดงในรายการปกติ"
          : "กดปุ่ม เพิ่ม เพื่อสร้างรายการใหม่"}
      </p>
    </div>
  );

  const getDocTypeName = (row: WorkflowRecord) => {
    const doc = docTypes.find((d) => d.id === row.documentTypeId || d.prefix === row.prefix);
    return doc ? `${doc.typeName} (${row.prefix})` : row.prefix || "-";
  };

  const mobileRows = rows.map((row) => ({
    id: row.id,
    title: row.name,
    badge: <StatusBadge active={row.isActive} />,
    fields: [
      { label: "ประเภทเอกสาร", value: getDocTypeName(row) },
      { label: "จำนวน Level (ระดับ)", value: `${row.levels} ระดับ` },
      {
        label: "สายการอนุมัติ",
        value: (row.steps || []).join(" ➔ ") || "-",
      },
    ],
    actions: row.isActive ? (
      <RowActions onEdit={() => onEdit(row.id)} onDelete={() => onDelete(row.id)} />
    ) : (
      <RowActions onRestore={() => onRestore(row.id)} />
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-slate-800">รายการ Workflow และสายการอนุมัติ</h2>
        <InactiveFilterCheckbox checked={showDeleted} onChange={onShowDeletedChange} />
      </div>

      <MasterDataTableWrap
        empty={rows.length === 0}
        emptyContent={emptyContent}
        mobile={<MasterDataMobileCardList rows={mobileRows} />}
      >
        <table className={MD_TABLE}>
          <thead className={MD_THEAD}>
            <tr>
              <th className={MD_TH_STICKY}>ชื่อ Workflow</th>
              <th className={MD_TH_CENTER}>ประเภทเอกสาร</th>
              <th className={MD_TH_CENTER}>จำนวน Level (ระดับ)</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                สายการอนุมัติ (บทบาทอนุมัติ)
              </th>
              <th className={MD_TH_STATUS}>สถานะ</th>
              <th className={MD_TH_ACTION}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`group ${MD_TR}`}>
                <td className={MD_TD_STICKY}>{row.name}</td>
                <td className="px-3 py-2.5 text-center text-xs font-semibold text-slate-700">
                  {getDocTypeName(row)}
                </td>
                <td className={MD_TD_NUM}>{row.levels} ระดับ</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(row.steps || []).map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                          {step}
                        </span>
                        {idx < (row.steps || []).length - 1 && (
                          <span className="text-slate-400 font-bold">›</span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td className={MD_TD_STATUS}>
                  <StatusBadge active={row.isActive} />
                </td>
                <td className={MD_TD_ACTION}>
                  {row.isActive ? (
                    <RowActions onEdit={() => onEdit(row.id)} onDelete={() => onDelete(row.id)} />
                  ) : (
                    <RowActions onRestore={() => onRestore(row.id)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </MasterDataTableWrap>

      <StatCards
        total={stats.total}
        active={stats.active}
        inactive={stats.deleted}
        icon={GitBranch}
      />
    </div>
  );
}
