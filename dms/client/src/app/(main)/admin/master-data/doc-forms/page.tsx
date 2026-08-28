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
import { useToast } from '@views/components/providers/ToastProvider';
import {
  type ApprovalMatrixState,
  type DocumentTypeRecord,
} from '@views/features/master-data';
import { DocumentTypesTab } from '@views/features/master-data/components';
import {
  MD_MASTER_ADD_BTN,
  MD_SECTION,
  MD_SIDEBAR_ICON,
  MD_SIDEBAR_ITEM,
  MD_SIDEBAR_ITEM_ACTIVE,
  MD_SIDEBAR_NAV,
  MasterDataLayout,
} from '@views/components/ui/admin';

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
];



export default function DocFormsPage() {
  const pathname = usePathname();
  const { showToast } = useToast();
  const [addRequest, setAddRequest] = useState(0);
  const [matrix, setMatrix] = useState<any>({});
  const [docTypes, setDocTypes] = useState<DocumentTypeRecord[]>([]);

  import("react").then((React) => {}); // Just for safety if we need to mock import

  const { useEffect } = require("react");
  
  useEffect(() => {
    async function fetchDocTypes() {
      try {
        const { adminService } = await import("@/controllers/services/admin.service");
        const list = await adminService.getDocumentTypesList();
        const mappedList: DocumentTypeRecord[] = list.map((dto: any) => ({
          id: dto.id,
          key: dto.prefix,
          typeName: dto.type_name,
          prefix: dto.prefix,
          formType: "OTHER-style" as import("@views/features/master-data").FormTypeStyle,
          formCode: dto.prefix + "-FRM",
          fieldsCount: 0,
          docCount: 0,
          isActive: dto.is_active,
        }));
        setDocTypes(mappedList);
      } catch (err) {
        console.error("Failed to fetch document types", err);
      }
    }
    fetchDocTypes();
  }, []);

  const toast = (message: string, type: "success" | "error") => showToast(message, type);

  const handleCreated = (key: string, typeName: string) => {
    // Left empty or can display toast since matrix tab is removed
    showToast(`สร้างฟอร์มเอกสาร ${typeName} สำเร็จ`, "success");
  };

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
        <button type="button" onClick={() => setAddRequest((n) => n + 1)} className={MD_MASTER_ADD_BTN}>
          <Plus className={MD_SIDEBAR_ICON} strokeWidth={1.75} />
          เพิ่ม
        </button>
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
        <DocumentTypesTab
          matrix={matrix}
          docTypes={docTypes}
          onMatrixChange={setMatrix}
          onDocTypesChange={setDocTypes}
          onCreated={handleCreated}
          showToast={toast}
          addRequest={addRequest}
        />
      </section>
    </MasterDataLayout>
  );
}
