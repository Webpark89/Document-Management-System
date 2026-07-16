"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ElementType } from "react";
import {
  Building2,
  FileStack,
  FileType2,
  FormInput,
  GitBranch,
  Hash,
  PenLine,
  Stamp,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  APPROVAL_MATRIX,
  matrixToDocumentTypes,
  type ApprovalMatrixState,
  type DocumentTypeRecord,
} from "@/lib/config-mock";
import DocumentTypesTab from "./DocumentTypesTab";
import ApprovalMatrixTab from "./ApprovalMatrixTab";

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
  { href: "/admin/master-data/doc-forms", label: "จัดการฟอร์มเอกสาร", icon: FileStack },
  { href: "/admin/master-data", label: "แผนก", icon: Building2, tab: "department" },
  { href: "/admin/master-data", label: "ตำแหน่ง", icon: Stamp, tab: "position" },
  { href: "/admin/master-data", label: "Workflow", icon: GitBranch, tab: "workflow" },
  { href: "/admin/master-data", label: "ลายเซ็น", icon: PenLine, tab: "signature" },
  { href: "/admin/master-data", label: "รูปแบบเลขที่เอกสาร", icon: Hash, tab: "running" },
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
    <div className="h-fit w-full bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <Link href="/admin/master-data" className="text-slate-500 hover:text-slate-700">
              Master Data
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-600">จัดการฟอร์มเอกสาร</span>
          </nav>
          <div className="flex items-center gap-2">
            <FileStack className="size-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-slate-800">Master Data</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">In-memory demo — resets on refresh</p>
        </div>
      </header>

      <div className="flex items-start gap-6 p-6">
        <aside className="w-[220px] shrink-0 self-start rounded-lg border border-gray-200 bg-white shadow-sm">
          <nav className="space-y-1 p-6">
            {MASTER_DATA_NAV.map(({ href, label, icon: Icon, tab }) => {
              const isActive = tab
                ? false
                : pathname === href;
              const linkHref = tab ? `${href}?tab=${tab}` : href;
              return (
                <Link
                  key={label}
                  href={linkHref}
                  className={`flex w-full items-center gap-2 rounded-md border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                      : "border-transparent text-slate-600 hover:bg-gray-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPageTab(tab.key)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  pageTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-gray-50 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {pageTab === "types" ? (
            <DocumentTypesTab
              matrix={matrix}
              docTypes={docTypes}
              onMatrixChange={setMatrix}
              onDocTypesChange={setDocTypes}
              onCreated={handleCreated}
              showToast={toast}
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
      </div>
    </div>
  );
}
