import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeDashboardPermissions } from './dashboard-permissions';

export interface Actor {
  id: string;
  role?: string;
  role_id?: string | null;
  department_id?: string | null;
  permissions?: string[];
}

export const permissions = {
  view: [
    'document.view_list:view',
    'document.view_detail:view',
    'document.preview_document:view',
    'submissions.view_list:view',
    'submissions.view_all:view',
    'approvals.view_list:view',
    'approvals.open_doc_detail:view',
    'reports.view_reports:view',
  ],
  detail: [
    'document.view_detail:view',
    'submissions.open_doc_detail:view',
    'approvals.open_doc_detail:view',
  ],
  history: ['document.view_version_history:view'],
  submit: [
    'submissions.submit_document:create',
    'document.submit_document:create',
  ],
  preview: ['document.preview_document:view', 'approvals.open_doc_detail:view'],
  create: [
    'submissions.create_document:create',
    'document.create_document:create',
  ],
  edit: ['submissions.edit_document:edit', 'document.edit_document:edit'],
  delete: [
    'submissions.delete_document:delete',
    'document.delete_document:delete',
  ],
  download: [
    'document.download_document:view',
    'submissions.download_document:view',
    'approvals.download_document:view',
  ],
  viewAll: ['document.view_all:view', 'submissions.view_all:view'],
};

export function hasAny(actor: Actor, keys: string[]): boolean {
  return keys.some((key) => actor.permissions?.includes(key));
}

export function requirePermission(actor: Actor, keys: string[]): void {
  if (!hasAny(actor, keys))
    throw new ForbiddenException('ไม่มีสิทธิ์ดำเนินการนี้');
}

export async function loadActor(
  prisma: PrismaService | Prisma.TransactionClient,
  id: string,
): Promise<Actor> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });
  if (!user || !user.is_active || user.is_deleted || !user.role?.is_active)
    throw new UnauthorizedException('บัญชีหรือบทบาทถูกปิดใช้งาน');
  return {
    id: user.id,
    role_id: user.role_id,
    role: user.role.name,
    department_id: user.department_id,
    permissions: normalizeDashboardPermissions(
      user.role.permissions.map(
        (p) => `${p.permission.module}:${p.permission.action}`,
      ),
    ),
  };
}

export function visibleDocuments(actor: Actor): Prisma.DocumentWhereInput {
  if (hasAny(actor, permissions.viewAll)) return { is_deleted: false };
  return {
    is_deleted: false,
    OR: [
      { creator_id: actor.id },
      { visibility_type: 'CompanyWide' },
      { visibility_users: { has: actor.id } },
      ...(actor.department_id
        ? [{ visibility_departments: { has: actor.department_id } }]
        : []),
      { workflow: { steps: { some: { approver_id: actor.id } } } },
    ],
  };
}

export function requireDocumentAccess(
  doc: {
    creator_id: string;
    visibility_type?: string;
    visibility_users?: string[];
    visibility_departments?: string[];
    workflow?: { steps?: { approver_id?: string | null }[] } | null;
  },
  actor: Actor,
): void {
  const allowed =
    doc.creator_id === actor.id ||
    hasAny(actor, permissions.viewAll) ||
    doc.visibility_type === 'CompanyWide' ||
    doc.visibility_users?.includes(actor.id) ||
    (!!actor.department_id &&
      doc.visibility_departments?.includes(actor.department_id)) ||
    doc.workflow?.steps?.some((s) => s.approver_id === actor.id);
  if (!allowed) throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้');
}

export function requireDocumentOwner(
  doc: { creator_id: string },
  actor: Actor,
): void {
  if (doc.creator_id !== actor.id)
    throw new ForbiddenException(
      'เฉพาะผู้สร้างเอกสารเท่านั้นที่ดำเนินการนี้ได้',
    );
}

export async function lockEntity(
  tx: Prisma.TransactionClient,
  key: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

export function jsonSnapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export const safeUserSelect = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  email: true,
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
  role: { select: { id: true, name: true } },
} as const;
