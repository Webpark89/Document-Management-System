import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { documentApproverIds, requireDocumentAccess } from './document-policy';
import { DocumentsService } from '../documents/documents.service';
jest.mock('puppeteer-core', () => ({ __esModule: true, default: {} }));

describe('Document visibility and current approval assignment', () => {
  const actor = {
    id: 'approver',
    department_id: 'unselected-department',
    permissions: [],
  };
  const document = (type: string) => ({
    creator_id: 'owner',
    visibility_type: type,
    visibility_users: ['manual-viewer'],
    visibility_departments: ['selected-department'],
    workflow: {
      steps: [
        { approver_id: 'first' },
        { approver_id: actor.id },
        { approver_id: 'third' },
      ],
    },
  });
  it.each(['Department', 'SpecificUsers'])(
    '%s automatically permits every assigned approver outside the manual audience',
    (type) => {
      const doc = document(type);
      for (const id of ['first', actor.id, 'third'])
        expect(() =>
          requireDocumentAccess(doc, { ...actor, id }),
        ).not.toThrow();
      expect(documentApproverIds(doc)).toEqual(['first', actor.id, 'third']);
      expect(doc.visibility_users).toEqual(['manual-viewer']);
    },
  );
  it.each(['Department', 'SpecificUsers'])(
    '%s does not grant the rest of an approver department',
    (type) => {
      expect(() =>
        requireDocumentAccess(document(type), { ...actor, id: 'colleague' }),
      ).toThrow(ForbiddenException);
    },
  );
  it('uses only the audience relevant to the selected mode', () => {
    expect(() =>
      requireDocumentAccess(
        { ...document('Department'), workflow: null },
        { id: 'manual-viewer' },
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      requireDocumentAccess(
        { ...document('SpecificUsers'), workflow: null },
        { id: 'other', department_id: 'selected-department' },
      ),
    ).toThrow(ForbiddenException);
  });
  it('revokes derived access when an approver is replaced', () => {
    const doc = document('SpecificUsers');
    doc.workflow.steps[1].approver_id = 'replacement';
    expect(() => requireDocumentAccess(doc, actor)).toThrow(ForbiddenException);
    expect(() =>
      requireDocumentAccess(doc, { id: 'replacement' }),
    ).not.toThrow();
    expect(documentApproverIds(doc)).not.toContain(actor.id);
  });
  it('deduplicates assigned identities and ignores unassigned steps', () => {
    expect(
      documentApproverIds({
        workflow: {
          steps: [
            { approver_id: 'a' },
            {},
            { approver_id: null },
            { approver_id: 'a' },
          ],
        },
      }),
    ).toEqual(['a']);
  });
  it('preserves explicit manual access after assignment changes', () => {
    const doc = {
      ...document('SpecificUsers'),
      visibility_users: [actor.id],
      workflow: null,
    };
    expect(() => requireDocumentAccess(doc, actor)).not.toThrow();
  });
});

describe('Visibility validates live master records', () => {
  const service = new DocumentsService({} as any, {} as any);
  const actor = { id: 'owner' };
  let tx: any;
  beforeEach(() => {
    tx = {
      department: { count: jest.fn().mockResolvedValue(1) },
      user: { count: jest.fn().mockResolvedValue(1) },
    };
  });
  it('ignores stale person selections when switching to Department', async () => {
    const result = await (service as any).visibility(
      {
        visibility: {
          type: 'Department',
          departments: ['dept'],
          users: ['inactive-from-previous-mode'],
        },
      },
      actor,
      tx,
    );
    expect(result).toEqual({
      visibility_type: 'Department',
      visibility_departments: ['dept'],
      visibility_users: [],
    });
    expect(tx.user.count).not.toHaveBeenCalled();
  });
  it('rejects inactive or unknown departments', async () => {
    tx.department.count.mockResolvedValue(0);
    await expect(
      (service as any).visibility(
        { visibility: { type: 'Department', departments: ['missing'] } },
        actor,
        tx,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects disabled users or roles', async () => {
    tx.user.count.mockResolvedValue(0);
    await expect(
      (service as any).visibility(
        { visibility: { type: 'SpecificUsers', users: ['inactive'] } },
        actor,
        tx,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.user.count).toHaveBeenCalledWith({
      where: {
        id: { in: ['inactive'] },
        is_active: true,
        is_deleted: false,
        role: { is_active: true },
      },
    });
  });
  it('keeps explicit user selections unique and includes the owner', async () => {
    const result = await (service as any).visibility(
      {
        visibility: {
          type: 'SpecificUsers',
          users: ['viewer', 'viewer'],
          departments: ['inactive-from-previous-mode'],
        },
      },
      actor,
      tx,
    );
    expect(result.visibility_users).toEqual(['viewer', 'owner']);
    expect(result.visibility_departments).toEqual([]);
    expect(tx.department.count).not.toHaveBeenCalled();
  });
});
