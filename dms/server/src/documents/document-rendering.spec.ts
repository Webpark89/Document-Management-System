import { DocumentsService } from './documents.service';
jest.mock('puppeteer-core', () => ({ __esModule: true, default: {} }));

describe('Document fidelity', () => {
  const service = new DocumentsService(
    {} as any,
    { decrypt: (value: string) => value } as any,
  );
  const image = 'data:image/png;base64,registered-image';
  const actor = {
    id: 'creator',
    first_name: 'Real',
    last_name: 'Creator',
    signature_encrypted: image,
    department: { name: 'IT' },
  };
  const make = (prefix = 'PR') => ({
    id: 'doc',
    doc_number: `${prefix}-2026-0001`,
    title: 'Actual subject',
    type: { prefix },
    created_at: new Date('2026-11-01'),
    status: 'Approved',
    creator: actor,
    pr_form: { items: [], total_amount: 0 },
    po_form: { items: [], total_amount: 0 },
    workflow: {
      steps: [
        {
          step_order: 1,
          status: 'Approved',
          action_date: '2026-11-02',
          signature_applied: true,
          approver: {
            id: 'approver',
            first_name: 'Real',
            last_name: 'Approver',
            signature_encrypted: image,
            role: { name: 'Manager' },
          },
        },
      ],
    },
  });
  it('renders stored signatures instead of generating approval stamps', () => {
    const html = (service as any).buildDocumentHtml(make());
    expect(html).toContain(`src="${image}"`);
    expect(html).toContain('Real Approver');
    expect(html).not.toContain('DEMO APPROVAL');
    expect(html).toContain('SIGNED & APPROVED');
  });
  it('does not claim a signed approval when image evidence is missing', () => {
    const doc = make();
    doc.workflow.steps[0].approver.signature_encrypted = '';
    const html = (service as any).buildDocumentHtml(doc);
    expect(html).not.toContain('SIGNED & APPROVED');
  });
  it('does not invent requester or department when records are missing', () => {
    const doc = { ...make(), creator: null, pr_form: null, workflow: null };
    const html = (service as any).buildDocumentHtml(doc);
    expect(html).not.toContain('วิภา รักดี');
    expect(html).not.toContain('แผนกจัดซื้อ');
  });
  it('renders the historical signer and title rather than the current profile', () => {
    const doc = make();
    const historical = {
      form_data: {
        items: [],
        _meta: {
          ...doc,
          title: 'Historical title',
          creator: { ...actor, first_name: 'Historical' },
        },
      },
    };
    const html = (service as any).buildDocumentHtml(doc, historical);
    expect(html).toContain('Historical title');
    expect(html).toContain('Historical Creator');
  });
  it.each(['PR', 'PO', 'BK'])(
    '%s stamps replacement PDFs instead of regenerating form content',
    (prefix) => {
      expect(
        service.usesGeneratedForm(make(prefix), {
          form_data: { _meta: { file_source: 'uploaded_pdf' } },
        }),
      ).toBe(false);
      expect(
        service.usesGeneratedForm(make(prefix), {
          form_data: { _meta: { file_source: 'generated_form' } },
        }),
      ).toBe(true);
      expect(service.usesGeneratedForm(make(prefix))).toBe(true);
    },
  );
  it('never generates a form for DOC uploads', () => {
    expect(service.usesGeneratedForm(make('DOC'))).toBe(false);
  });
});
