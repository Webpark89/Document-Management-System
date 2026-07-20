"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ElementType } from "react";
import {
  Briefcase,
  Building2,
  LayoutTemplate,
  ListOrdered,
  Plus,
  Signature,
  Workflow,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  APPROVAL_MATRIX,
  matrixToDocumentTypes,
  type ApprovalMatrixState,
  type DocumentTypeRecord,
} from "@/features/master-data";
import { ApprovalMatrixTab, DocumentTypesTab } from "@/features/master-data/components";
import {
  MD_MASTER_ADD_BTN,
  MD_SECTION,
  MD_SIDEBAR_ICON,
  MD_SIDEBAR_ITEM,
  MD_SIDEBAR_ITEM_ACTIVE,
  MD_SIDEBAR_NAV,
  MasterDataLayout,
  PageTabSwitcher,
} from "@/components/ui/admin";

type PageTab = "types" | "matrix";

const PAGE_TABS: { key: PageTab; label: string }[] = [
  { key: "types", label: "ประเภทเอกสาร" },
  { key: "matrix", label: "สายการอนุมัติ" },
];

const MASTER_DATA_NAV: {
  href: string;
  label: string;
  icon: ElementType;
  tab?: string;
}[] = [
  { href: "/admin/master-data/doc-forms", label: "จัดการฟอร์มเอกสาร", icon: LayoutTemplate },
  { href: "/admin/master-data", label: "แผนก", icon: Building2, tab: "department" },
  { href: "/admin/master-data", label: "ตำแหน่ง", icon: Briefcase, tab: "position" },
  { href: "/admin/master-data", label: "Workflow", icon: Workflow, tab: "workflow" },
  { href: "/admin/master-data", label: "ลายเซ็น", icon: Signature, tab: "signature" },
  { href: "/admin/master-data", label: "รูปแบบเลขที่เอกสาร", icon: ListOrdered, tab: "running" },
];

function cloneMatrix(matrix: ApprovalMatrixState): ApprovalMatrixState {
  return Object.fromEntries(
    Object.entries(matrix).map(([key, entry]) => [key, { ...entry, steps: [...entry.steps] }])
  );
}

export default function DocFormsPage() {
  const pathname = usePathname();
  const { showToast } = useToast();
  const [pageTab, setPageTab] = useState<PageTab>("types");
  const [addRequest, setAddRequest] = useState(0);
  const [matrix, setMatrix] = useState<ApprovalMatrixState>(() => cloneMatrix(APPROVAL_MATRIX));
  const [docTypes, setDocTypes] = useState<DocumentTypeRecord[]>(() =>
    matrixToDocumentTypes(cloneMatrix(APPROVAL_MATRIX))
  );
  const [selectedKey, setSelectedKey] = useState<string>("PR");
  const [setupNotice, setSetupNotice] = useState<string | null>(null);

  const toast = (message: string, type: "success" | "error") => showToast(message, type);

  const handleCreated = (key: string, typeName: string) => {
    setSelectedKey(key);
    setPageTab("matrix");
    setSetupNotice(typeName);
  };

  const matrixKeys = useMemo(() => Object.keys(matrix), [matrix]);

  const resolvedSelectedKey = matrixKeys.includes(selectedKey)
    ? selectedKey
    : matrixKeys[0] ?? "";

  return (
    <MasterDataLayout
      sidebarCompact
      breadcrumb={
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <Link href="/admin/master-data" className="text-slate-500 hover:text-slate-700">
            Master Data
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-600">จัดการฟอร์มเอกสาร</span>
        </nav>
      }
      title="Master Data"
      subtitle="In-memory demo — resets on refresh"
      actions={
        pageTab === "types" ? (
          <button type="button" onClick={() => setAddRequest((n) => n + 1)} className={MD_MASTER_ADD_BTN}>
            <Plus className={MD_SIDEBAR_ICON} strokeWidth={1.75} />
            เพิ่ม
          </button>
        ) : undefined
      }
      sidebar={
        <nav className={MD_SIDEBAR_NAV}>
          {MASTER_DATA_NAV.map(({ href, label, icon: Icon, tab }) => {
            const isActive = tab ? false : pathname === href;
            const linkHref = tab ? `${href}?tab=${tab}` : href;
            return (
              <Link
                key={label}
                href={linkHref}
                className={isActive ? MD_SIDEBAR_ITEM_ACTIVE : MD_SIDEBAR_ITEM}
              >
                <Icon className={MD_SIDEBAR_ICON} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
      }
    >
      <section className={MD_SECTION}>
        <div className="w-fit">
          <PageTabSwitcher
            tabs={PAGE_TABS}
            active={pageTab}
            onChange={(key) => setPageTab(key as PageTab)}
          />
        </div>

        {pageTab === "types" ? (
          <DocumentTypesTab
            matrix={matrix}
            docTypes={docTypes}
            onMatrixChange={setMatrix}
            onDocTypesChange={setDocTypes}
            onCreated={handleCreated}
            showToast={toast}
            addRequest={addRequest}
          />
        ) : (
          <ApprovalMatrixTab
            matrix={matrix}
            docTypes={docTypes}
            selectedKey={resolvedSelectedKey}
            onSelectKey={setSelectedKey}
            onMatrixChange={setMatrix}
            showToast={toast}
            setupNotice={setupNotice}
            onDismissSetupNotice={() => setSetupNotice(null)}
          />
        )}
      </section>
    </MasterDataLayout>
  );
}
