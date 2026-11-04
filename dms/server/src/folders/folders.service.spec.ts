import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Folders shared by all authenticated users', () => {
  const actor = { id: 'reader', permissions: [] };
  const folder = {
    id: 'folder',
    name: 'Shared folder',
    creator_id: 'another-user',
    parent_id: null,
    visibility: 'AdminOnly',
    permissions: [],
    creator: { first_name: 'Other', last_name: 'User' },
    _count: { documents: 1 },
  };
  let db: any;
  let service: FoldersService;
  beforeEach(() => {
    db = {
      $executeRaw: jest.fn(),
      folder: {
        findFirst: jest.fn().mockResolvedValue(folder),
        findMany: jest.fn().mockResolvedValue([folder]),
        create: jest
          .fn()
          .mockImplementation(({ data }) => ({ id: 'new', ...data })),
        update: jest
          .fn()
          .mockImplementation(({ data }) => ({ ...folder, ...data })),
        count: jest.fn().mockResolvedValue(0),
      },
      document: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: 'doc' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'doc',
          creator_id: 'another-user',
          visibility_type: 'CompanyWide',
          status: 'Approved',
        }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      folderPermission: { deleteMany: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    db.$transaction = (fn: any) => fn(db);
    service = new FoldersService(db as PrismaService);
  });
  it.each(['Private', 'Department', 'Shared', 'CompanyWide', 'AdminOnly'])(
    'lists legacy %s folders with edit and move enabled without role permissions',
    async (visibility) => {
      db.folder.findMany.mockResolvedValue([{ ...folder, visibility }]);
      const result = await service.findAll(actor);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        can_edit: true,
        can_add_document: true,
      });
    },
  );
  it('opens a folder owned by another user', async () => {
    expect(await service.findOne('folder', actor)).toMatchObject({
      id: 'folder',
      can_edit: true,
    });
    expect(db.document.findMany.mock.calls[0][0].where.AND[0]).toMatchObject({
      is_deleted: false,
    });
  });
  it('creates a child of a restricted folder as company-wide', async () => {
    const result = await service.create(
      { name: ' New ', parent_id: 'folder', visibility: 'Private' } as any,
      actor,
    );
    expect(result).toMatchObject({
      name: 'New',
      visibility: 'CompanyWide',
      department_id: null,
    });
  });
  it('edits another user folder without permissions and clears legacy sharing', async () => {
    expect(
      await service.update('folder', { name: 'Changed' }, actor),
    ).toMatchObject({ name: 'Changed', visibility: 'CompanyWide' });
    expect(db.folderPermission.deleteMany).toHaveBeenCalledWith({
      where: { folder_id: 'folder' },
    });
  });
  it('soft deletes another user folder and retains its documents', async () => {
    await service.remove('folder', actor);
    expect(db.document.updateMany).toHaveBeenCalledWith({
      where: { folder_id: 'folder' },
      data: { folder_id: null },
    });
    expect(db.folder.update).toHaveBeenCalledWith({
      where: { id: 'folder' },
      data: { is_deleted: true },
    });
  });
  it.each(['folder', null])(
    'moves accessible approved documents to %s without role permissions',
    async (target) => {
      await service.moveDocument(
        { document_id: 'doc', target_folder_id: target },
        actor,
      );
      expect(db.document.update).toHaveBeenCalledWith({
        where: { id: 'doc' },
        data: { folder_id: target },
      });
    },
  );
  it('still rejects documents the user cannot access', async () => {
    db.document.findUniqueOrThrow.mockResolvedValue({
      creator_id: 'other',
      visibility_type: 'Private',
      status: 'Approved',
    });
    await expect(
      service.moveDocument({ document_id: 'doc' }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.document.update).not.toHaveBeenCalled();
  });
  it('rejects unapproved documents', async () => {
    db.document.findUniqueOrThrow.mockResolvedValue({
      creator_id: actor.id,
      status: 'Pending',
    });
    await expect(
      service.moveDocument({ document_id: 'doc' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects missing or deleted target folders', async () => {
    db.folder.findFirst.mockResolvedValue(null);
    await expect(
      service.moveDocument(
        { document_id: 'doc', target_folder_id: 'deleted' },
        actor,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.document.update).not.toHaveBeenCalled();
  });
  it('does not delete folders with children', async () => {
    db.folder.count.mockResolvedValue(1);
    await expect(service.remove('folder', actor)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(db.document.updateMany).not.toHaveBeenCalled();
  });
});
