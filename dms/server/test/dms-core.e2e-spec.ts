import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import cookieParser from 'cookie-parser';

describe('DMS Core Test Cases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let somchaiCookie: string;
  let wipaCookie: string;
  let createdDocId: string;
  let createdDocNumber: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup created test data if any
    if (createdDocId) {
      await prisma.notification.deleteMany({ where: { document_id: createdDocId } });
      const doc = await prisma.document.findUnique({
        where: { id: createdDocId },
        include: { workflow: true },
      });
      if (doc?.workflow) {
        await prisma.workflowStep.deleteMany({ where: { workflow_id: doc.workflow.id } });
        await prisma.workflow.delete({ where: { id: doc.workflow.id } });
      }
      await prisma.pRFormItem.deleteMany({ where: { pr_form: { document_id: createdDocId } } });
      await prisma.pRForm.deleteMany({ where: { document_id: createdDocId } });
      await prisma.document.delete({ where: { id: createdDocId } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe('TC-01 Auth Cookie', () => {
    it('POST /auth/login with valid credentials should set httpOnly cookie access_token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'somchai',
          password: 'folk2546',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('somchai');

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const hasAccessToken = cookies.some((cookie: string) => cookie.includes('access_token='));
      const isHttpOnly = cookies.some((cookie: string) => cookie.includes('HttpOnly'));
      expect(hasAccessToken).toBe(true);
      expect(isHttpOnly).toBe(true);

      // Save cookie for next steps
      const rawCookie = cookies.find((cookie: string) => cookie.includes('access_token='));
      const match = rawCookie.match(/access_token=[^;]+/);
      somchaiCookie = match ? match[0] : rawCookie;
    });

    it('GET /auth/me with Cookie should return 200 and user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', somchaiCookie)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'somchai');
      expect(response.body).toHaveProperty('signature_image_path');
    });

    it('POST /auth/logout should clear cookie, and GET /auth/me should return 401', async () => {
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(200);

      const cookies = logoutResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieCleared = cookies.some((cookie: string) => cookie.includes('access_token=;'));
      expect(cookieCleared).toBe(true);

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      // Log back in to restore cookie for subsequent test cases
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'somchai',
          password: 'folk2546',
        })
        .expect(200);
      const loginCookies = loginResponse.headers['set-cookie'];
      const rawLoginCookie = loginCookies.find((cookie: string) => cookie.includes('access_token='));
      const matchLogin = rawLoginCookie.match(/access_token=[^;]+/);
      somchaiCookie = matchLogin ? matchLogin[0] : rawLoginCookie;
    });
  });

  describe('TC-02 Doc Draft & Running Number', () => {
    it('POST /documents should create document with status Draft and formatted doc_number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', somchaiCookie)
        .send({
          title: 'ขอซื้อโต๊ะทำงานใหม่',
          prefix: 'PR',
          purpose: 'ใช้สำหรับพนักงานใหม่',
          items: [
            { item_name: 'โต๊ะทำงาน', quantity: 2, unit_price: 3000, remark: 'สีโอ๊คดำ' }
          ]
        })
        .expect(201);

      expect(response.body.status).toBe('Draft');
      expect(response.body.doc_number).toMatch(/^PR-\d{4}-\d{4}$/);
      createdDocId = response.body.real_id;
      createdDocNumber = response.body.doc_number;

      // Verify Audit Log is created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          target_id: createdDocId,
          action: 'Upload',
        },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.details).toHaveProperty('newState');
    });

    it('New Year reset test - should reset current_number when last_reset_year != currentYear', async () => {
      const currentYear = new Date().getFullYear();

      // Create a temporary document type and running number configuration
      const tempDocType = await prisma.documentType.create({
        data: {
          type_name: 'Temporary Form',
          prefix: 'TEMP',
        },
      });

      const tempRunningNumber = await prisma.runningNumber.create({
        data: {
          document_type_id: tempDocType.id,
          prefix: 'TEMP',
          year_format: 'YYYY',
          current_number: 5,
          padding_length: 4,
          last_reset_year: currentYear - 1, // Simulate old year
        },
      });

      // Create new document to trigger reset
      const response = await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', somchaiCookie)
        .send({
          title: 'เอกสารทดสอบรีเซ็ตปี',
          prefix: 'TEMP',
          purpose: 'Test Reset Year',
          items: [
            { item_name: 'ของทดสอบ', quantity: 1, unit_price: 100 }
          ]
        })
        .expect(201);

      expect(response.body.doc_number).toBe(`TEMP-${currentYear}-0001`);

      // Cleanup
      await prisma.pRFormItem.deleteMany({ where: { pr_form: { document_id: response.body.real_id } } });
      await prisma.pRForm.deleteMany({ where: { document_id: response.body.real_id } });
      await prisma.document.delete({ where: { id: response.body.real_id } });
      await prisma.runningNumber.delete({ where: { id: tempRunningNumber.id } });
      await prisma.documentType.delete({ where: { id: tempDocType.id } });
    });
  });

  describe('TC-03 Workflow & Role Approver', () => {
    it('POST /workflows/:id/submit should transit Draft to Pending and create role step', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/workflows/${createdDocNumber}/submit`)
        .set('Cookie', somchaiCookie)
        .send({
          // Submit without custom steps to use default Approval Matrix (role step)
        })
        .expect(201);

      expect(response.body.status).toBe('Pending');

      const workflow = await prisma.workflow.findUnique({
        where: { document_id: createdDocId },
        include: { steps: true },
      });

      expect(workflow).toBeDefined();
      expect(workflow.steps.length).toBeGreaterThan(0);
      
      // The matrix step order 1 for PR requires role Manager
      const firstStep = workflow.steps.find(s => s.step_order === 1);
      expect(firstStep).toBeDefined();
    });

    it('Notifications should be created for step 1 when assigned', async () => {
      // Let's create a temporary draft and submit with custom step with assigned approver_id to verify notification creation
      const draftResponse = await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', somchaiCookie)
        .send({
          title: 'เอกสารทดสอบระบบแจ้งเตือน',
          prefix: 'PR',
          purpose: 'Test Notification',
          items: [{ item_name: 'ปากกา', quantity: 10, unit_price: 15 }]
        });

      const testDocNumber = draftResponse.body.doc_number;
      const testDocId = draftResponse.body.real_id;

      const firstUser = await prisma.user.findFirst();
      await request(app.getHttpServer())
        .post(`/api/workflows/${testDocNumber}/submit`)
        .set('Cookie', somchaiCookie)
        .send({
          workflow_steps: [
            { step_order: 1, approver_id: firstUser.id }
          ]
        });

      // Fetch first user to check notification
      const user = await prisma.user.findFirst();
      const notification = await prisma.notification.findFirst({
        where: {
          user_id: user.id,
          document_id: testDocId,
        },
      });
      expect(notification).toBeDefined();

      // Clean up test doc
      await prisma.notification.deleteMany({ where: { document_id: testDocId } });
      const doc = await prisma.document.findUnique({ where: { id: testDocId }, include: { workflow: true } });
      if (doc?.workflow) {
        await prisma.workflowStep.deleteMany({ where: { workflow_id: doc.workflow.id } });
        await prisma.workflow.delete({ where: { id: doc.workflow.id } });
      }
      await prisma.pRFormItem.deleteMany({ where: { pr_form: { document_id: testDocId } } });
      await prisma.pRForm.deleteMany({ where: { document_id: testDocId } });
      await prisma.document.delete({ where: { id: testDocId } });
    });
  });

  describe('TC-04 E-Sign & Transaction Rollback', () => {
    it('[LIMITATION] E-Signature PDF-LIB embedding & transaction rollback are NOT yet implemented on backend', () => {
      console.warn('⚠️ E-Signature PDF-LIB embedding and rollback on DB failure are currently NOT implemented in workflows.service.ts.');
    });

    it('POST /workflows/:id/approve should approve step and advance current_step', async () => {
      // Find the created document workflow step 1
      const workflow = await prisma.workflow.findUnique({
        where: { document_id: createdDocId },
        include: { steps: { orderBy: { step_order: 'asc' } } },
      });

      // We login as somchai to approve (somchai is Manager, which matches step 1 required role)
      const approveResponse = await request(app.getHttpServer())
        .post(`/api/workflows/${createdDocNumber}/approve`)
        .set('Cookie', somchaiCookie)
        .send({
          comment: 'อนุมัติขั้นต้น',
        })
        .expect(201);

      expect(approveResponse.body.success).toBe(true);

      const updatedWorkflow = await prisma.workflow.findUnique({
        where: { document_id: createdDocId },
      });
      expect(updatedWorkflow.current_step).toBe(2);
    });
  });

  describe('TC-05 Soft Delete Safety', () => {
    it('DELETE /documents/:id by NON-OWNER should return 403 Forbidden', async () => {
      // Login as wipa
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'manager01', password: 'folk2546' })
        .expect(200);
      
      const rawCookie = loginRes.header['set-cookie'][0];
      const match = rawCookie.match(/access_token=[^;]+/);
      wipaCookie = match ? match[0] : rawCookie;

      // Create a doc as somchai
      const res = await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', somchaiCookie)

        .send({
          title: 'Test Doc for Permission',
          prefix: 'BK',
          purpose: 'Testing permission',
        });
      const docId = res.body.id;

      // Try to delete as wipa (not owner, not admin)
      await request(app.getHttpServer())
        .delete(`/api/documents/${docId}`)
        .set('Cookie', wipaCookie) // Wipa is a Department Head, but not owner and not Admin
        .expect(403);
    });

    it('DELETE /documents/:id should perform Soft Delete (is_deleted: true) when requested by Owner', async () => {
      await request(app.getHttpServer())
        .delete(`/api/documents/${createdDocId}`)
        .set('Cookie', somchaiCookie)
        .expect(200);

      // Verify still exists in DB but is_deleted: true
      const doc = await prisma.document.findUnique({
        where: { id: createdDocId },
      });
      expect(doc).toBeDefined();
      expect(doc.is_deleted).toBe(true);
    });

    it('PATCH /admin/users/:id/toggle-active should return 403 for non-admin and 200 for Administrator', async () => {
      const somchai = await prisma.user.findUnique({ where: { username: 'somchai' } });
      expect(somchai.is_active).toBe(true);

      // Non-admin should get 403
      await request(app.getHttpServer())
        .patch(`/api/admin/users/${somchai.id}/toggle-active`)
        .set('Cookie', somchaiCookie)
        .expect(403);

      // Admin login
      const adminLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'folk2546' })
        .expect(200);
      const adminCookie = adminLogin.header['set-cookie'][0];

      // Admin should get 200
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/users/${somchai.id}/toggle-active`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.is_active).toBe(false);

      // Restore active status
      await prisma.user.update({
        where: { id: somchai.id },
        data: { is_active: true },
      });
    });
  });
});
