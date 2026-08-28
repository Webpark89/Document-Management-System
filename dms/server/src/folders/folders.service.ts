import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import { FolderVisibility } from '@prisma/client';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async findAll(currentUserId: string, currentUserRole: string, currentUserDeptId?: string) {
    const isAdmin = currentUserRole === 'Administrator' || currentUserRole === 'Executive';

    const folders = await this.prisma.folder.findMany({
      where: { is_deleted: false },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, username: true },
        },
        department: { select: { id: true, name: true } },
        permissions: true,
        _count: {
          select: { documents: { where: { is_deleted: false, status: 'Approved' } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const visibleFolders = folders.filter((folder) =>
      this.canAccessFolder(folder, currentUserId, isAdmin, currentUserDeptId)
    );

    return visibleFolders.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      color: f.color,
      icon: f.icon,
      visibility: f.visibility,
      parent_id: f.parent_id,
      department_id: f.department_id,
      department_name: f.department?.name,
      document_count: f._count.documents,
      creator: {
        id: f.creator.id,
        full_name: `${f.creator.first_name || ''} ${f.creator.last_name || ''}`.trim() || f.creator.username,
      },
      can_edit: isAdmin || f.creator_id === currentUserId,
      created_at: f.created_at,
    }));
  }

  async findOne(id: string, currentUserId: string, currentUserRole: string, currentUserDeptId?: string) {
    const isAdmin = currentUserRole === 'Administrator' || currentUserRole === 'Executive';

    const folder = await this.prisma.folder.findFirst({
      where: { id, is_deleted: false },
      include: {
        creator: {
          select: { id: true, first_name: true, last_name: true, username: true },
        },
        department: true,
        permissions: true,
        children: {
          where: { is_deleted: false },
          include: {
            _count: { select: { documents: { where: { is_deleted: false, status: 'Approved' } } } },
          },
        },
        documents: {
          where: { is_deleted: false, status: 'Approved' },
          include: {
            type: true,
            creator: { select: { id: true, first_name: true, last_name: true, username: true } },
          },
        },
      },
    });

    if (!folder) throw new NotFoundException('Folder not found');

    if (!this.canAccessFolder(folder, currentUserId, isAdmin, currentUserDeptId)) {
      throw new ForbiddenException('No permission to view this folder');
    }

    return {
      ...folder,
      can_edit: isAdmin || folder.creator_id === currentUserId,
    };
  }

  async create(dto: CreateFolderDto, creatorId: string) {
    // Check parent depth if parent_id provided
    if (dto.parent_id) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: dto.parent_id },
      });
      if (!parent) throw new NotFoundException('Parent folder not found');
      if (parent.parent_id) {
        throw new BadRequestException('Max folder nesting depth is 2 levels');
      }
    }

    // Determine default department_id if visibility === Department
    let departmentId = dto.department_id;
    if (dto.visibility === 'Department' && !departmentId) {
      const user = await this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { department_id: true },
      });
      departmentId = user?.department_id || undefined;
    }

    const folder = await this.prisma.folder.create({
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color || '#4F81FF',
        icon: dto.icon || '📁',
        visibility: (dto.visibility as FolderVisibility) || 'CompanyWide',
        parent_id: dto.parent_id || null,
        creator_id: creatorId,
        department_id: departmentId || null,
      },
    });

    // Handle Shared permissions
    if (dto.visibility === 'Shared') {
      if (dto.shared_departments && dto.shared_departments.length > 0) {
        await this.prisma.folderPermission.createMany({
          data: dto.shared_departments.map((deptId) => ({
            folder_id: folder.id,
            department_id: deptId,
            can_view: true,
            can_edit: false,
          })),
          skipDuplicates: true,
        });
      }
      if (dto.shared_users && dto.shared_users.length > 0) {
        await this.prisma.folderPermission.createMany({
          data: dto.shared_users.map((userId) => ({
            folder_id: folder.id,
            user_id: userId,
            can_view: true,
            can_edit: false,
          })),
          skipDuplicates: true,
        });
      }
    }

    return folder;
  }

  async update(id: string, dto: UpdateFolderDto, currentUserId: string, currentUserRole: string) {
    const isAdmin = currentUserRole === 'Administrator' || currentUserRole === 'Executive';
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');

    if (!isAdmin && folder.creator_id !== currentUserId) {
      throw new ForbiddenException('Only owner or Admin can update folder');
    }

    const updated = await this.prisma.folder.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
        visibility: dto.visibility as FolderVisibility,
      },
    });

    if (dto.visibility === 'Shared') {
      await this.prisma.folderPermission.deleteMany({ where: { folder_id: id } });
      if (dto.shared_departments && dto.shared_departments.length > 0) {
        await this.prisma.folderPermission.createMany({
          data: dto.shared_departments.map((deptId) => ({
            folder_id: id,
            department_id: deptId,
            can_view: true,
          })),
          skipDuplicates: true,
        });
      }
      if (dto.shared_users && dto.shared_users.length > 0) {
        await this.prisma.folderPermission.createMany({
          data: dto.shared_users.map((userId) => ({
            folder_id: id,
            user_id: userId,
            can_view: true,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  }

  async remove(id: string, currentUserId: string, currentUserRole: string) {
    const isAdmin = currentUserRole === 'Administrator' || currentUserRole === 'Executive';
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');

    if (!isAdmin && folder.creator_id !== currentUserId) {
      throw new ForbiddenException('Only owner or Admin can delete folder');
    }

    // Soft delete folder and unassign documents
    await this.prisma.$transaction([
      this.prisma.document.updateMany({
        where: { folder_id: id },
        data: { folder_id: null },
      }),
      this.prisma.folder.update({
        where: { id },
        data: { is_deleted: true },
      }),
    ]);

    return { message: 'Folder deleted, documents moved to Unorganized' };
  }

  async moveDocument(dto: MoveDocumentDto, currentUserId: string, currentUserRole: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        is_deleted: false,
        OR: [
          { id: dto.document_id },
          { doc_number: dto.document_id },
        ],
      },
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (dto.target_folder_id) {
      const targetFolder = await this.prisma.folder.findFirst({
        where: { id: dto.target_folder_id, is_deleted: false },
      });
      if (!targetFolder) throw new NotFoundException('Target folder not found');
    }

    await this.prisma.document.update({
      where: { id: doc.id },
      data: { folder_id: dto.target_folder_id || null },
    });

    return { message: 'Document moved successfully' };
  }

  private canAccessFolder(folder: any, userId: string, isAdmin: boolean, userDeptId?: string): boolean {
    if (isAdmin) return true;
    switch (folder.visibility) {
      case 'CompanyWide':
        return true;
      case 'AdminOnly':
        return false;
      case 'Private':
        return folder.creator_id === userId;
      case 'Department':
        return !!userDeptId && folder.department_id === userDeptId;
      case 'Shared':
        if (folder.creator_id === userId) return true;
        return (folder.permissions || []).some(
          (p: any) => p.user_id === userId || (userDeptId && p.department_id === userDeptId)
        );
      default:
        return true;
    }
  }
}
