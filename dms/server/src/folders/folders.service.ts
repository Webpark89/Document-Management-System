import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, FolderVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import {
  Actor,
  hasAny,
  lockEntity,
  permissions,
  requireDocumentAccess,
  requirePermission,
  visibleDocuments,
} from '../common/document-policy';

const folderInclude = {
  permissions: true,
  creator: {
    select: { id: true, first_name: true, last_name: true, username: true },
  },
  department: { select: { id: true, name: true } },
} satisfies Prisma.FolderInclude;
type Folder = Prisma.FolderGetPayload<{ include: typeof folderInclude }>;
@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}
  private canView(folder: Folder, user: Actor) {
    if (
      folder.creator_id === user.id ||
      hasAny(user, permissions.viewAll) ||
      hasAny(user, ['document.move_any_to_folder:edit'])
    )
      return true;
    if (folder.visibility === 'CompanyWide') return true;
    if (folder.visibility === 'Department')
      return (
        !!user.department_id && folder.department_id === user.department_id
      );
    return (
      folder.visibility === 'Shared' &&
      folder.permissions.some(
        (p) =>
          p.can_view &&
          (p.user_id === user.id ||
            (!!user.department_id && p.department_id === user.department_id)),
      )
    );
  }
  private canEdit(folder: Folder, user: Actor) {
    return (
      folder.creator_id === user.id ||
      (hasAny(user, permissions.viewAll) &&
        hasAny(user, ['document.manage_folders:edit'])) ||
      folder.permissions.some(
        (p) =>
          p.can_edit &&
          (p.user_id === user.id ||
            (!!user.department_id && p.department_id === user.department_id)),
      )
    );
  }
  private canAddDocument(folder: Folder, user: Actor) {
    return (
      this.canEdit(folder, user) ||
      hasAny(user, ['document.move_any_to_folder:edit'])
    );
  }
  private async folder(
    id: string,
    user: Actor,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const f = await tx.folder.findFirst({
      where: { id, is_deleted: false },
      include: folderInclude,
    });
    if (!f) throw new NotFoundException('ไม่พบโฟลเดอร์');
    if (!this.canView(f, user))
      throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงโฟลเดอร์');
    return f;
  }
  async findAll(user: Actor) {
    requirePermission(user, ['document.view_folders:view']);
    const rows = await this.prisma.folder.findMany({
      where: { is_deleted: false },
      include: {
        ...folderInclude,
        _count: {
          select: {
            documents: {
              where: { AND: [visibleDocuments(user), { status: 'Approved' }] },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return rows
      .filter((f) => this.canView(f, user))
      .map((f) => ({
        ...f,
        department_name: f.department?.name,
        creator: {
          ...f.creator,
          full_name: `${f.creator.first_name} ${f.creator.last_name}`,
        },
        document_count: f._count.documents,
        can_edit:
          this.canEdit(f, user) &&
          hasAny(user, ['document.manage_folders:edit']),
        can_add_document: this.canAddDocument(f, user),
        shared_departments: f.permissions
          .filter((p) => p.department_id)
          .map((p) => p.department_id),
        shared_users: f.permissions
          .filter((p) => p.user_id)
          .map((p) => p.user_id),
      }));
  }
  async findOne(id: string, user: Actor) {
    requirePermission(user, ['document.view_folders:view']);
    const f = await this.folder(id, user);
    const documents = await this.prisma.document.findMany({
      where: {
        folder_id: id,
        status: 'Approved',
        AND: [visibleDocuments(user)],
      },
      include: {
        type: true,
        creator: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    const children = (await this.findAll(user)).filter(
      (child) => child.parent_id === id,
    );
    return {
      ...f,
      documents,
      children,
      can_edit:
        this.canEdit(f, user) && hasAny(user, ['document.manage_folders:edit']),
    };
  }
  private async shares(
    tx: Prisma.TransactionClient,
    folderId: string,
    departments: string[] = [],
    users: string[] = [],
  ) {
    departments = [...new Set(departments)];
    users = [...new Set(users)];
    if (
      departments.length &&
      (await tx.department.count({
        where: { id: { in: departments }, is_active: true },
      })) !== departments.length
    )
      throw new BadRequestException('แผนกที่แชร์ไม่ถูกต้อง');
    if (
      users.length &&
      (await tx.user.count({
        where: { id: { in: users }, is_active: true, is_deleted: false },
      })) !== users.length
    )
      throw new BadRequestException('ผู้ใช้ที่แชร์ไม่ถูกต้อง');
    await tx.folderPermission.deleteMany({ where: { folder_id: folderId } });
    await tx.folderPermission.createMany({
      data: [
        ...departments.map((department_id) => ({
          folder_id: folderId,
          department_id,
          can_view: true,
        })),
        ...users.map((user_id) => ({
          folder_id: folderId,
          user_id,
          can_view: true,
        })),
      ],
    });
  }
  async create(dto: CreateFolderDto, user: Actor) {
    requirePermission(user, ['document.manage_folders:create']);
    if (!dto.name.trim())
      throw new BadRequestException('กรุณาระบุชื่อโฟลเดอร์');
    if (dto.visibility === 'AdminOnly' && !hasAny(user, permissions.viewAll))
      throw new ForbiddenException('ไม่มีสิทธิ์สร้างโฟลเดอร์ผู้ดูแล');
    return this.prisma.$transaction(async (tx) => {
      if (dto.parent_id) {
        const parent = await this.folder(dto.parent_id, user, tx);
        if (parent.parent_id)
          throw new BadRequestException('รองรับโฟลเดอร์สองระดับ');
        if (!this.canEdit(parent, user))
          throw new ForbiddenException('ไม่มีสิทธิ์สร้างโฟลเดอร์ย่อย');
      }
      const dept = dto.department_id ?? user.department_id;
      if (
        dto.visibility === 'Department' &&
        (!dept ||
          !(await tx.department.findFirst({
            where: { id: dept, is_active: true },
          })))
      )
        throw new BadRequestException('ไม่พบแผนกสำหรับโฟลเดอร์');
      const folder = await tx.folder.create({
        data: {
          name: dto.name.trim(),
          description: dto.description,
          color: dto.color ?? '#4F81FF',
          icon: dto.icon ?? 'folder',
          visibility: (dto.visibility as FolderVisibility) ?? 'CompanyWide',
          parent_id: dto.parent_id ?? null,
          creator_id: user.id,
          department_id: dto.visibility === 'Department' ? dept : null,
        },
      });
      if (dto.visibility === 'Shared')
        await this.shares(
          tx,
          folder.id,
          dto.shared_departments,
          dto.shared_users,
        );
      await tx.auditLog.create({
        data: {
          user_id: user.id,
          action: 'Upload',
          module: 'Folder',
          target_id: folder.id,
          details: {
            oldState: {},
            newState: { name: folder.name, visibility: folder.visibility },
            extra: {},
          },
        },
      });
      return folder;
    });
  }
  async update(id: string, dto: UpdateFolderDto, user: Actor) {
    requirePermission(user, ['document.manage_folders:edit']);
    if (dto.name !== undefined && !dto.name.trim())
      throw new BadRequestException('กรุณาระบุชื่อโฟลเดอร์');
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `folder:${id}`);
      const old = await this.folder(id, user, tx);
      if (!this.canEdit(old, user))
        throw new ForbiddenException('ไม่มีสิทธิ์แก้ไขโฟลเดอร์');
      if (dto.visibility === 'AdminOnly' && !hasAny(user, permissions.viewAll))
        throw new ForbiddenException('ไม่มีสิทธิ์ตั้งโฟลเดอร์ผู้ดูแล');
      if (dto.visibility === 'Department' && !user.department_id)
        throw new BadRequestException('ไม่พบแผนก');
      const updated = await tx.folder.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description,
          color: dto.color,
          icon: dto.icon,
          visibility: dto.visibility,
          ...(dto.visibility === 'Department'
            ? { department_id: old.department_id ?? user.department_id }
            : {}),
        },
      });
      if (
        updated.visibility === 'Shared' &&
        (dto.shared_departments !== undefined || dto.shared_users !== undefined)
      )
        await this.shares(
          tx,
          id,
          dto.shared_departments ??
            old.permissions
              .filter((p) => p.department_id)
              .map((p) => p.department_id!),
          dto.shared_users ??
            old.permissions.filter((p) => p.user_id).map((p) => p.user_id!),
        );
      if (updated.visibility !== 'Shared')
        await tx.folderPermission.deleteMany({ where: { folder_id: id } });
      await tx.auditLog.create({
        data: {
          user_id: user.id,
          action: 'Edit',
          module: 'Folder',
          target_id: id,
          details: {
            oldState: { name: old.name, visibility: old.visibility },
            newState: { name: updated.name, visibility: updated.visibility },
            extra: {},
          },
        },
      });
      return updated;
    });
  }
  async remove(id: string, user: Actor) {
    requirePermission(user, ['document.manage_folders:delete']);
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `folder:${id}`);
      const old = await this.folder(id, user, tx);
      if (!this.canEdit(old, user))
        throw new ForbiddenException('ไม่มีสิทธิ์ลบโฟลเดอร์');
      if (
        await tx.folder.count({ where: { parent_id: id, is_deleted: false } })
      )
        throw new ConflictException('กรุณาลบโฟลเดอร์ย่อยก่อน');
      await tx.document.updateMany({
        where: { folder_id: id },
        data: { folder_id: null },
      });
      await tx.folder.update({ where: { id }, data: { is_deleted: true } });
      await tx.auditLog.create({
        data: {
          user_id: user.id,
          action: 'Delete',
          module: 'Folder',
          target_id: id,
          details: {
            oldState: { is_deleted: false },
            newState: { is_deleted: true },
            extra: {},
          },
        },
      });
      return { message: 'ลบโฟลเดอร์แล้ว เอกสารยังคงอยู่ในคลัง' };
    });
  }
  async moveDocument(dto: MoveDocumentDto, user: Actor) {
    requirePermission(user, ['document.move_to_folder:edit']);
    const original = await this.prisma.document.findFirst({
      where: {
        OR: [{ id: dto.document_id }, { doc_number: dto.document_id }],
        is_deleted: false,
      },
    });
    if (!original) throw new NotFoundException('ไม่พบเอกสาร');
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `document:${original.id}`);
      const doc = await tx.document.findUniqueOrThrow({
        where: { id: original.id },
        include: { workflow: { include: { steps: true } } },
      });
      requireDocumentAccess(doc, user);
      if (doc.status !== 'Approved')
        throw new ConflictException('ย้ายเข้าคลังได้หลังอนุมัติครบแล้ว');
      if (
        doc.creator_id !== user.id &&
        !hasAny(user, permissions.viewAll) &&
        !hasAny(user, ['document.move_any_to_folder:edit'])
      )
        throw new ForbiddenException(
          'เฉพาะเจ้าของหรือผู้มีสิทธิ์จัดการทั้งหมด',
        );
      if (dto.target_folder_id) {
        const target = await this.folder(dto.target_folder_id, user, tx);
        if (!this.canAddDocument(target, user))
          throw new ForbiddenException(
            'ไม่มีสิทธิ์เพิ่มเอกสารในโฟลเดอร์ปลายทาง',
          );
      }
      await tx.document.update({
        where: { id: doc.id },
        data: { folder_id: dto.target_folder_id ?? null },
      });
      await tx.auditLog.create({
        data: {
          user_id: user.id,
          action: 'Edit',
          module: 'Folder',
          target_id: doc.id,
          details: {
            oldState: { folder_id: doc.folder_id },
            newState: { folder_id: dto.target_folder_id ?? null },
            extra: {},
          },
        },
      });
      return { message: 'ย้ายเอกสารแล้ว' };
    });
  }
}
