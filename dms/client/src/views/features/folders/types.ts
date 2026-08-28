export type FolderVisibility = 'Private' | 'Department' | 'Shared' | 'CompanyWide' | 'AdminOnly';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  visibility: FolderVisibility;
  parent_id?: string | null;
  department_id?: string | null;
  department_name?: string;
  children?: Folder[];
  document_count: number;
  can_edit: boolean;
  creator: { id: string; full_name: string };
  created_at?: string;
}

export const VISIBILITY_LABEL: Record<FolderVisibility, string> = {
  Private: '🔒 ส่วนตัว',
  Department: '🏢 แผนก',
  Shared: '🔗 แชร์',
  CompanyWide: '🌐 ทั้งองค์กร',
  AdminOnly: '🛡️ Admin',
};

export const VISIBILITY_COLOR: Record<FolderVisibility, string> = {
  Private: 'text-slate-600 bg-slate-100 border-slate-200',
  Department: 'text-blue-700 bg-blue-50 border-blue-200',
  Shared: 'text-violet-700 bg-violet-50 border-violet-200',
  CompanyWide: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  AdminOnly: 'text-rose-700 bg-rose-50 border-rose-200',
};

export interface CreateFolderPayload {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  visibility: FolderVisibility;
  parent_id?: string | null;
  department_id?: string;
  shared_departments?: string[];
  shared_users?: string[];
}

export interface UpdateFolderPayload {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  visibility?: FolderVisibility;
  shared_departments?: string[];
  shared_users?: string[];
}

export interface MoveDocumentPayload {
  document_id: string;
  target_folder_id?: string | null;
}
