import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import {
  Actor,
  lockEntity,
  requireDocumentAccess,
  visibleDocuments,
} from '../common/document-policy';

const folderInclude = {
  permissions: true,
  creator: {
    select: { id: true, first_name: true, last_name: true, username: true },
  },
  department: { select: { id: true, name: true } },
} satisfies Prisma.FolderInclude;
@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}
  private async folder(
    id: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const f = await tx.folder.findFirst({
      where: { id, is_deleted: false },
      include: folderInclude,
    });
    if (!f) throw new NotFoundException('ไม่พบโฟลเดอร์');
    return f;
  }
  async findAll(user: Actor) {
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
    return rows.map((f) => ({
      ...f,
      department_name: f.department?.name,
      creator: {
        ...f.creator,
        full_name: `${f.creator.first_name} ${f.creator.last_name}`,
      },
      document_count: f._count.documents,
      can_edit: true,
      can_add_document: true,
      shared_departments: f.permissions
        .filter((p) => p.department_id)
        .map((p) => p.department_id),
      shared_users: f.permissions
        .filter((p) => p.user_id)
        .map((p) => p.user_id),
    }));
  }
  async findOne(id: string, user: Actor) {
    const f = await this.folder(id);
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
      can_edit: true,
      can_add_document: true,
    };
  }
  async create(dto: CreateFolderDto, user: Actor) {
    if (!dto.name.trim())
      throw new BadRequestException('กรุณาระบุชื่อโฟลเดอร์');
    return this.prisma.$transaction(async (tx) => {
      if (dto.parent_id) {
        const parent = await this.folder(dto.parent_id, tx);
        if (parent.parent_id)
          throw new BadRequestException('รองรับโฟลเดอร์สองระดับ');
      }
      const folder = await tx.folder.create({
        data: {
          name: dto.name.trim(),
          description: dto.description,
          color: dto.color ?? '#4F81FF',
          icon: dto.icon ?? 'folder',
          visibility: 'CompanyWide',
          parent_id: dto.parent_id ?? null,
          creator_id: user.id,
          department_id: null,
        },
      });
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
    if (dto.name !== undefined && !dto.name.trim())
      throw new BadRequestException('กรุณาระบุชื่อโฟลเดอร์');
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `folder:${id}`);
      const old = await this.folder(id, tx);
      const updated = await tx.folder.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description,
          color: dto.color,
          icon: dto.icon,
          visibility: 'CompanyWide',
          department_id: null,
        },
      });
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
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `folder:${id}`);
      await this.folder(id, tx);
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
      if (dto.target_folder_id) {
        await this.folder(dto.target_folder_id, tx);
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
