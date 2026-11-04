import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DocumentsService } from './documents.service';

jest.mock('puppeteer-core', () => ({ __esModule: true, default: {} }));

describe('Upload document versions after filing', () => {
  let service: DocumentsService;
  let db: any;
  let doc: any;
  const bytes = Buffer.from('%PDF-new-version');
  beforeEach(() => {
    doc = {
      id: 'doc',
      creator_id: 'owner',
      status: 'Approved',
      title: 'Document',
      folder_id: 'archive',
      approved_at: new Date('2026-11-01'),
      workflow: { id: 'old-workflow', status: 'Approved' },
      versions: [
        {
          id: 'previous',
          version_number: 3,
          file_data: Buffer.from('old'),
          form_data: {
            _meta: { workflow: { id: 'old-workflow', status: 'Approved' } },
          },
        },
      ],
    };
    db = {
      $executeRaw: jest.fn(),
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'owner',
          is_active: true,
          is_deleted: false,
          role: {
            is_active: true,
            name: 'Employee',
            permissions: [
              {
                permission: {
                  module: 'document.view_detail',
                  action: 'view',
                },
              },
            ],
          },
        }),
      },
      document: {
        update: jest
          .fn()
          .mockImplementation(({ data }) => Object.assign(doc, data)),
      },
      workflow: {
        delete: jest.fn().mockImplementation(() => {
          doc.workflow = null;
        }),
      },
      auditLog: { create: jest.fn() },
    };
    db.$transaction = (fn: any) => fn(db);
    service = new DocumentsService(db, {} as any);
    jest
      .spyOn(service, 'getDocument')
      .mockImplementation(async () => ({ ...doc }));
    jest.spyOn(service, 'preserveLegacyVersion').mockResolvedValue(undefined);
    jest.spyOn(service, 'appendVersion').mockResolvedValue({} as any);
    jest
      .spyOn(service as any, 'mapDocumentToResponse')
      .mockImplementation((value: any) => value);
  });
  it.each(['PR', 'PO', 'BK', 'DOC'])(
    '%s requires new approval for replacement bytes and preserves signed history',
    async (prefix) => {
      doc.type = { prefix };
      const previous = doc.versions[0];
      await service.uploadNewVersion(
        'doc',
        'owner',
        { buffer: bytes } as any,
        undefined,
        'Updated attachment',
      );
      expect(doc.status).toBe('Draft');
      expect(db.workflow.delete).toHaveBeenCalledWith({
        where: { id: 'old-workflow' },
      });
      expect(doc.folder_id).toBe('archive');
      expect(doc.approved_at).toBeNull();
      expect(doc.versions[0]).toBe(previous);
      expect(service.preserveLegacyVersion).toHaveBeenCalled();
      expect(service.appendVersion).toHaveBeenCalledWith(
        db,
        expect.objectContaining({ status: 'Draft', workflow: null }),
        'owner',
        expect.stringContaining('Updated attachment'),
        bytes,
        undefined,
        expect.objectContaining({
          _meta: expect.objectContaining({
            file_source: 'uploaded_pdf',
            workflow_history: [expect.objectContaining({ id: 'old-workflow' })],
          }),
        }),
      );
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: expect.objectContaining({ extra: { version: 4 } }),
          }),
        }),
      );
    },
  );
  it.each(['Draft', 'Returned'])(
    'preserves existing %s upload behavior',
    async (status) => {
      doc.status = status;
      await service.uploadNewVersion('doc', 'owner', { buffer: bytes } as any);
      expect(doc.status).toBe('Draft');
      expect(doc.approved_at).toBeNull();
    },
  );
  it.each(['Pending', 'Cancelled', 'Rejected'])(
    'blocks upload while %s',
    async (status) => {
      doc.status = status;
      await expect(
        service.uploadNewVersion('doc', 'owner', { buffer: bytes } as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(service.appendVersion).not.toHaveBeenCalled();
    },
  );
  it.each(['PR', 'PO', 'BK', 'DOC'])('allows a visible non-owned %s without edit permission', async (prefix) => {
    doc.type = { prefix };
    doc.creator_id = 'someone-else';
    doc.visibility_type = 'CompanyWide';
    await service.uploadNewVersion('doc', 'owner', { buffer: bytes } as any);
    expect(doc.status).toBe('Draft');
    expect(service.appendVersion).toHaveBeenCalledWith(db, expect.anything(), 'owner', expect.anything(), bytes, undefined, expect.anything());
    expect(db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({data: expect.objectContaining({user_id: 'owner', action: 'Upload'})}));
  });
  it('blocks a non-owner outside the document audience', async () => {
    doc.creator_id = 'someone-else';
    doc.visibility_type = 'SpecificUsers';
    doc.visibility_users = ['another-user'];
    await expect(service.uploadNewVersion('doc', 'owner', { buffer: bytes } as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.appendVersion).not.toHaveBeenCalled();
    expect(db.document.update).not.toHaveBeenCalled();
  });
  it('still requires document detail access permission', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'owner',
      is_active: true,
      role: { is_active: true, permissions: [] },
    });
    await expect(
      service.uploadNewVersion('doc', 'owner', { buffer: bytes } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
