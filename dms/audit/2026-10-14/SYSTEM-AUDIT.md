> เอกสารนี้เป็นผลตรวจ **ก่อนแก้ไข** โปรดอ่านผลปัจจุบันและข้อจำกัดใน [ผลแก้ไขและทดสอบ 15 ต.ค. 2569](FLOW-VERIFICATION-2026-10-15.md) ประกอบ ตัวเลขทดสอบและตำแหน่งโค้ดด้านล่างเป็น baseline เดิม

# ผลตรวจระบบ DMS ตาม flow ปัจจุบัน

วันที่ตรวจ: 14 ตุลาคม 2026

## ข้อสรุป

ระบบ build ได้ มีการสร้าง PR / PO / BK / PDF และโครงสร้าง workflow เชื่อมฐานข้อมูลจริงแล้ว แต่ **ยังไม่ควรระบุในเล่มว่าทุก flow ทำงานสมบูรณ์** เพราะพบปัญหาที่ทำให้อนุมัติผิดคน เปิดเผยเอกสารจำกัดสิทธิ์ ประวัติเอกสารเปลี่ยนย้อนหลัง และแสดงผลสำเร็จทั้งที่ข้อมูลไม่ได้บันทึกจริง

รายงานนี้ยึดพฤติกรรมที่หน้าจอและ API ปัจจุบันสื่อกับผู้ใช้ ไม่ใช้ความแตกต่างจาก requirement เดิมเป็นข้อผิดพลาด จำนวนขั้นอนุมัติสามารถต่างกันตามประเภทเอกสารได้ การลงลายเซ็นจะใช้ version เดิมระหว่างขั้นหรือสร้าง version ใหม่ก็ได้ แต่ API ต้องรายงาน version จริง และเอกสารย้อนหลังต้องคงหลักฐานเดิม

งานนี้เป็นการตรวจและสร้างหลักฐานทดสอบ **ไม่ได้แก้ source ของระบบหรือเปลี่ยนเอกสารจริง**

## หลักฐานและข้อจำกัด

| วิธีตรวจ | ผล |
| --- | --- |
| อ่าน code ของ server ทุก module และเส้นทาง frontend ที่เกี่ยวข้อง | ตรวจ auth, documents, workflows, users/signatures, folders, admin, notifications, dashboard และหน้าจอหลัก |
| Backend TypeScript `tsc --noEmit --incremental false` | ผ่าน |
| Frontend TypeScript `tsc --noEmit --incremental false` | ผ่าน |
| Backend `nest build` | ผ่าน |
| Frontend `next build` | ผ่าน หลังรันนอก sandbox ที่ติด Windows Access denied |
| ESLint server `src test` โดยไม่ใช้ `--fix` | 261 errors, 9 warnings |
| ESLint client `src` | 506 errors, 25 warnings |
| ชุดทดสอบ flow ปัจจุบัน | 34 กรณี: ผ่าน 9, ไม่ผ่าน 25 |
| PostgreSQL จริง | เชื่อมต่อได้ อ่านใน transaction `READ ONLY` |
| Browser E2E ใช้ผู้ใช้จริงตั้งแต่ต้นจนจบ | ยังไม่ได้ทำ |
| SMTP ส่งอีเมลจริง, ทดสอบโหลดพร้อมกัน, backup/restore | ยังไม่ได้ยืนยัน |

ชุดทดสอบ 34 กรณีเน้นตรวจกรณีผิดสิทธิ์และความถูกต้องของสถานะ จึง **ไม่ใช่อัตราความสำเร็จของทุกฟีเจอร์** บางกรณีล้มเหลวจากสาเหตุเดียวกัน ใช้ service ที่ compile จาก source จริง พร้อม Nest routing, JWT และ ValidationPipe จริง แต่แทน Prisma ด้วยข้อมูลจำลอง ไม่เขียนฐานข้อมูลจริง

ไฟล์หลักฐาน:

- [ผลทดสอบ flow ปัจจุบัน](<D:/Document Management/dms/audit/2026-10-14/current-flow-results.json>)
- [Script ทดสอบที่รันซ้ำได้](<D:/Document Management/dms/scripts/audit-current-flow.cjs>)
- [ผลตรวจฐานข้อมูลแบบอ่านอย่างเดียว](<D:/Document Management/dms/audit/2026-10-14/database-readonly.json>)
- [ESLint server](<D:/Document Management/dms/audit/2026-10-14/server-lint.json>) และ [ESLint client](<D:/Document Management/dms/audit/2026-10-14/client-lint.json>)

ข้อมูลจริงที่ตรวจพบ: documents 127 รายการ, document_versions 252 รายการ, users 8 รายการ ทุกเอกสารตั้ง `CompanyWide` ขณะตรวจ ไม่พบเลข version ซ้ำหรือคู่สถานะ document/workflow ผิดกันในข้อมูลชุดนี้ แต่ไม่ได้หมายความว่า API ป้องกันการเกิดปัญหาเหล่านั้นแล้ว

Approval Matrix ปัจจุบัน: PR 3 ขั้น, PO 2 ขั้น, BK 1 ขั้น, DOC 1 ขั้น รายงานไม่ถือจำนวนนี้เป็นข้อผิดพลาด

พบ workflow_steps 95 รายการที่ตั้ง `signature_applied=true` แต่เอกสารไม่มี version ที่เก็บ `file_data` ข้อนี้เป็นข้อมูลประกอบ ไม่ยืนยันว่า 95 รายการลงลายเซ็นผิดทั้งหมด เพราะฟอร์มสามารถสร้าง PDF ตอนดาวน์โหลด และข้อมูลเดิมอาจมาจาก seed

## สิ่งที่ตรวจผ่านในขอบเขตทดสอบ

- Service สร้างเอกสารทั้ง PR / PO / BK / DOC เป็น Draft พร้อม version 1 ได้ในข้อมูลจำลอง
- ผู้อนุมัติที่ถูกกำหนดกดอนุมัติแล้วขยับขั้น พร้อมสร้าง notification ให้ขั้นถัดไปได้
- ผู้ที่ไม่ใช่เจ้าของและไม่ใช่ Administrator ถูกปฏิเสธเมื่อ soft delete เอกสาร
- HTTP รายละเอียดเอกสารปฏิเสธผู้ไม่ login ด้วย 401 และปฏิเสธผู้ไม่เกี่ยวข้องกับเอกสารจำกัดสิทธิ์ด้วย 403
- Query อ่าน notification และ mark-read ผูกกับผู้ใช้ปัจจุบัน
- การตรวจรอบแรกยืนยัน AES-GCM ถอดรหัสได้ และตรวจจับ payload ที่ถูกเปลี่ยนได้ แต่การจัดการ key ยังมีปัญหาตามข้อ A12

## A. ปัญหาที่ต้องแก้ก่อนใช้เป็นหลักฐานว่า flow สมบูรณ์

ระดับ P1: กระทบสิทธิ์หรือความน่าเชื่อถือของผลอนุมัติและเอกสาร / P2: กระทบการใช้งาน ข้อมูล หรือหน้าจอ / P3: ข้อจำกัดและหลักฐานที่ยังขาด

### A01 — P1: อนุมัติ/ปฏิเสธแทนคนที่กำหนด และส่ง/แก้เอกสารคนอื่นได้

**เหตุการณ์:** ผู้ใช้ login คนใดก็ได้เรียก API approve/reject ของเอกสารที่มี workflow โดยไม่ต้องเป็น `approver_id` ของขั้นปัจจุบัน ระบบเขียน `approver_id=userId` ทับผู้ที่กำหนดไว้ การ submit และ updateFull ไม่ตรวจเจ้าของเช่นกัน

**หลักฐาน:** `AUTH-APPROVE`, `AUTH-REJECT`, `AUTH-SUBMIT`, `AUTH-EDIT` ไม่ผ่าน

ตำแหน่ง: [approveStep](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:552>), [rejectStep](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:795>), [submitWorkflow](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:22>), [updateDocumentFull](<D:/Document Management/dms/server/src/documents/documents.service.ts:1344>)

**แก้:** ตรวจ permission การกระทำและความเกี่ยวข้องกับเอกสารใน backend ก่อนเขียนข้อมูล เมื่อระบุคนแล้วต้องตรง UUID ของคนนั้น หากมีขั้นแบบ role ให้ใช้กติกาของขั้นนั้นอย่างชัดเจน ไม่ใช้การเขียนชื่อผู้กดทับผู้รับผิดชอบเดิม

Frontend ยังให้ผู้ใช้ role เดียวกันผ่าน แม้ขั้นระบุคนอื่น: [isAssignedApprover](<D:/Document Management/dms/client/src/app/(main)/approvals/[id]/page.tsx:87>) ต้องให้กติกา UI ตรง backend

### A02 — P1: จำกัดสิทธิ์ดูได้ แต่ดาวน์โหลดไฟล์ได้

**เหตุการณ์:** รายละเอียดเอกสารตอบ 403 ให้ผู้ไม่เกี่ยวข้อง แต่ `/documents/:id/download` ส่ง PDF ให้คนเดียวกันได้ เพราะไม่ส่ง user ไปตรวจ visibility ก่อนอ่าน bytes

**หลักฐาน HTTP:** `HTTP-PRIVATE-DETAIL` ผ่านด้วย 403 แต่ `HTTP-PRIVATE-DOWNLOAD` ไม่ผ่าน เพราะตอบ 200

ตำแหน่ง: [downloadFile](<D:/Document Management/dms/server/src/documents/documents.controller.ts:96>), [getFileBuffer](<D:/Document Management/dms/server/src/documents/documents.service.ts:658>), [signed-url](<D:/Document Management/dms/server/src/documents/documents.controller.ts:82>)

**แก้:** ใช้การตรวจสิทธิ์เอกสารชุดเดียวกันกับ detail, versions, signed-url, preview และ download ทุก version

### A03 — P1: เลือกสิทธิ์การมองเห็นแล้วข้อมูลไม่ถูกบันทึก

**เหตุการณ์:** PO/BK ส่ง `visibility` ใน JSON แต่ DTO ไม่มี field นี้ จึงถูก ValidationPipe whitelist ตัดทิ้ง Service ไม่เรียก `processVisibility` และไม่ใส่ค่าลง document record PR ไม่ส่ง visibility ออกจาก form handler ส่วน DOC ไม่ append visibility ใน multipart

**หลักฐาน:** `PRIVATE-DTO`, `PRIVATE-SAVE` ไม่ผ่าน; ข้อมูลจริงทั้ง 127 เอกสารเป็น CompanyWide ซึ่งสอดคล้องกับ default แต่ไม่พิสูจน์เจตนาของผู้สร้างแต่ละราย

ตำแหน่ง: [DTO](<D:/Document Management/dms/server/src/documents/dto/create-document.dto.ts:35>), [docData](<D:/Document Management/dms/server/src/documents/documents.service.ts:416>), [PR handleSubmit](<D:/Document Management/dms/client/src/views/components/forms/PRForm.tsx:218>), [DOC payload](<D:/Document Management/dms/client/src/app/(main)/submissions/create/page.tsx:356>)

มีปัญหาข้อมูลอีกสองจุด: Step2Visibility ส่งชื่อแผนก/username แต่ backend เทียบ department UUID/user UUID และ JWT response ไม่มี `department_id`

ตำแหน่ง: [เลือกแผนก](<D:/Document Management/dms/client/src/views/components/forms/Step2Visibility.tsx:145>), [เลือกผู้ใช้](<D:/Document Management/dms/client/src/views/components/forms/Step2Visibility.tsx:237>), [JWT user](<D:/Document Management/dms/server/src/auth/jwt.strategy.ts:69>), [ตรวจสิทธิ์](<D:/Document Management/dms/server/src/documents/documents.service.ts:326>)

**แก้:** ใช้ UUID ตลอดเส้นทาง บันทึก visibility ทั้งสร้างและแก้ไข เพิ่มเจ้าของ/ผู้อนุมัติที่ต้องเข้าถึงโดยอัตโนมัติ และทดสอบ CompanyWide/Department/SpecificUsers บนทุกประเภทเอกสาร

### A04 — P1: Client ลดขั้นหรือเปลี่ยนผู้อนุมัติออกจาก master ได้

**เหตุการณ์:** Submit รับ `customSteps` แล้วใช้รายการนั้นเป็นทั้ง workflow ไม่มีการเทียบจำนวน ลำดับ หรือ role กับ matrix ที่ UI แสดงเป็น read-only หากชื่อผู้อนุมัติไม่ถูกต้องจะเลือกคนอื่นให้เงียบ ๆ เช่น manager/admin

**หลักฐาน:** `MATRIX` ไม่ผ่าน; รอบแรกทดสอบ step_order ข้ามขั้นแล้วระบบยอมรับ

ตำแหน่ง: [custom steps](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:55>), [fallback](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:97>), [current_step](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:253>)

**แก้:** สร้างขั้นจาก master ปัจจุบันบน server แล้วรับเฉพาะ UUID ของผู้รับผิดชอบในแต่ละขั้น ตรวจ role และสถานะ active ตามกติกาปัจจุบัน ลำดับต้องครบต่อเนื่อง หากระบุคนไม่ได้ให้แจ้งข้อผิดพลาด ไม่เปลี่ยนผู้อนุมัติเองโดยไม่แจ้ง

### A05 — P1: กระทำซ้ำหลังจบ workflow และสถานะขัดกันได้

**เหตุการณ์:** approve/reject ไม่ตรวจ `doc.status`, `workflow.status`, `currentStep.status` หรือ `is_deleted` ก่อนกระทำ จึงอนุมัติเอกสารที่ Approved/Rejected แล้วได้ การแก้ Pending ตั้ง document เป็น Draft แต่ workflow เดิมยัง Pending

**หลักฐาน:** `STATE-Approved`, `STATE-Rejected` ไม่ผ่าน; การตรวจรอบแรกยืนยัน deleted document และ Pending edit ด้วย

ตำแหน่ง: [approveStep](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:552>), [rejectStep](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:795>), [edit reset Draft](<D:/Document Management/dms/server/src/documents/documents.service.ts:1377>)

**แก้:** ตรวจและเปลี่ยนสถานะอย่าง atomic ใน transaction เช่น update โดยมีเงื่อนไขว่า step ยัง Pending และคนยังตรงผู้รับผิดชอบ การแก้เอกสารระหว่างอนุมัติต้องถูกปฏิเสธหรือยุติ workflow เดิมอย่างครบถ้วนก่อนเริ่มรอบใหม่ ทดสอบ double-click และ approve/reject พร้อมกัน

### A06 — P1: ข้อมูลสำคัญของผู้อนุมัติรั่วผ่านรายละเอียดเอกสาร

**เหตุการณ์:** Query include ผู้อนุมัติทั้ง record แล้ว response spread `step.approver` จึงมี `password_hash`, `reset_token`, `signature_encrypted` และ field ภายในติดออกไปด้วย ผู้ที่มีสิทธิ์ดูเอกสารไม่จำเป็นต้องมีสิทธิ์ข้อมูลเหล่านี้

**หลักฐาน:** `SENSITIVE-RESPONSE` ไม่ผ่านด้วย record จำลองที่ใส่ค่า marker

ตำแหน่ง: [include approver](<D:/Document Management/dms/server/src/documents/documents.service.ts:314>), [response spread](<D:/Document Management/dms/server/src/documents/documents.service.ts:1560>)

**แก้:** Prisma select เฉพาะ field ที่ UI ต้องใช้ และสร้าง response ที่ระบุ field ชัดเจน ตรวจทุก endpoint ที่ส่ง user record เช่น toggle-active/reset-password ด้วย

### A07 — P1: อ่าน workflow/รูปลายเซ็นโดยไม่ต้อง login

**เหตุการณ์:** GET workflow และ GET `/users/:id/signature` ไม่มี JwtAuthGuard ตัวหลังถอดรหัสและส่งรูปต้นฉบับให้ผู้เรียก ซึ่งทำให้การเข้ารหัสใน DB ไม่ได้จำกัดการนำรูปออกไปใช้

**หลักฐาน HTTP:** `HTTP-WORKFLOW`, `HTTP-SIGNATURE` ไม่ผ่าน เพราะตอบ 200 แทน 401

ตำแหน่ง: [workflow GET](<D:/Document Management/dms/server/src/workflows/workflows.controller.ts:38>), [signature GET](<D:/Document Management/dms/server/src/users/users.controller.ts:27>)

**แก้:** Require login และตรวจสิทธิ์ตามบริบท การดูเอกสารที่เซ็นแล้วควรดูจากเอกสาร/snapshot การเข้าถึงรูปลายเซ็นต้นฉบับควรจำกัดให้เจ้าของหรือสิทธิ์จัดการที่เหมาะสม

### A08 — P1: Version ย้อนหลังไม่เป็นหลักฐานเดิม

**เหตุการณ์:** เมื่อแก้ Returned จะเขียน `form_data` ลง version เก่า จากนั้น submit จึงค่อยสร้าง version ใหม่ ทั้งสอง version อาจเป็นข้อมูลที่แก้แล้ว และ submit query ไม่ include form data ที่พยายามเก็บ

PDF ที่สร้างจากฟอร์มยังอ่าน live form ก่อน snapshot และอ่าน workflow/รูปลายเซ็นปัจจุบัน รวมถึง title/ชื่อบริษัทปัจจุบัน จึงดาวน์โหลด version เดิมแล้วเนื้อหาหรือรูปลายเซ็นเปลี่ยนได้หลังแก้ข้อมูล

**หลักฐาน:** `HISTORICAL-EDIT`, `HISTORICAL-BK` ไม่ผ่าน

ตำแหน่ง: [แก้ snapshot เดิม](<D:/Document Management/dms/server/src/documents/documents.service.ts:1428>), [submit snapshot](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:310>), [BK PDF](<D:/Document Management/dms/server/src/documents/documents.service.ts:827>), [PR/PO PDF](<D:/Document Management/dms/server/src/documents/documents.service.ts:892>), [ลายเซ็นปัจจุบัน](<D:/Document Management/dms/server/src/documents/documents.service.ts:781>)

**แก้:** Freeze version ที่ใช้เป็นประวัติ เก็บไฟล์ PDF จริงหรือ snapshot ครบทั้ง content, title, metadata, ผู้ลงนาม, รูปลายเซ็น ณ เวลานั้น และ action time การแก้/ส่งใหม่สร้างข้อมูลรอบใหม่โดยไม่เขียนทับหลักฐานเก่า

### A09 — P1: เปลี่ยนไฟล์เอกสารที่อนุมัติแล้ว แต่ยังแสดง Approved

**เหตุการณ์:** เจ้าของ upload-new-version ของเอกสาร Approved ได้ backend สร้าง version ใหม่แต่ไม่ reset การอนุมัติ Latest download กลายเป็นไฟล์ใหม่ที่ยังไม่มีใครอนุมัติ

**หลักฐาน:** `APPROVED-REPLACE` ไม่ผ่าน

ตำแหน่ง: [uploadNewVersion](<D:/Document Management/dms/server/src/documents/documents.service.ts:545>)

**แก้:** แยกฉบับอนุมัติแล้วกับฉบับแก้ไขรอส่งใหม่ให้ชัด หรือปฏิเสธการ upload บน Approved จนเปิดรอบแก้ไขที่ถูกต้อง ต้องผูกผลอนุมัติกับ version ของไฟล์เสมอ

### A10 — P1: แสดงว่าลงลายเซ็นแล้ว แม้ฝังลายเซ็นไม่สำเร็จ

**เหตุการณ์:** `signature_applied` ใช้เพียงการมีพิกัด หากไม่มี PDF ไม่มีรูป signature หรือ PDF-LIB error ระบบ warn แล้ว approve ต่อ พร้อมบันทึกว่าลงลายเซ็นแล้ว นอกจากนี้ response ส่ง `new_version=2` แต่ DB update version 1

**หลักฐาน:** `SIGN-MISSING`, `SIGN-VERSION-TRUTH` ไม่ผ่าน; กรณีหลังใช้ PDF-LIB และ PNG จริงในข้อมูลจำลอง

ตำแหน่ง: [skip embed](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:589>), [signature_applied](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:664>), [version update](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:669>), [response](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:787>)

**แก้:** แยก requested signature กับ embed สำเร็จ หาก flow นี้ต้องเซ็นแล้วฝังไม่ได้ต้องหยุด หากอนุญาต approve without signature ต้องบันทึกความจริงว่าไม่มีลายเซ็น Response ต้องใช้เลข version ที่ persist จริง

UI ส่งตำแหน่งคงที่หน้า 1 `(400,100)` สำหรับทุกผู้อนุมัติ จึงเสี่ยงเซ็นทับกันใน DOC และไม่ตรงตำแหน่ง preview; เครื่องมือข้อความ/วันที่เก็บแค่ state และไม่ส่งให้ backend

ตำแหน่ง: [พิกัดคงที่](<D:/Document Management/dms/client/src/views/components/workflow/ApprovalActions.tsx:58>), [stamp state](<D:/Document Management/dms/client/src/views/components/workflow/DocumentSignerViewer.tsx:73>)

**แก้เพิ่ม:** ส่ง page/ตำแหน่งที่ผู้ใช้เลือกจริง หรือกำหนดช่องตาม step ให้ตรงทั้ง UI และ PDF; เก็บข้อความ/วันที่จริงหากยังคงปุ่มเหล่านี้ใน flow

### A11 — P1: สิทธิ์ master data ไม่ถูกบังคับบน API บางรายการ

**เหตุการณ์:** `PATCH /admin/workflows/:id` ไม่มี @Permissions แม้ใช้ PermissionsGuard ที่ controller เมื่อไม่มี metadata guard จะอนุญาต ผู้ login ที่ไม่มี permission จึงล้าง/แก้ matrix ได้ `GET audit-logs` ไม่มีสิทธิ์กำกับ ส่วน POST settings ใช้สิทธิ์ view เพื่อเขียน

**หลักฐาน:** `HTTP-MASTER` ไม่ผ่าน เพราะ user permission ว่างเปลี่ยน workflow สำเร็จ

ตำแหน่ง: [master workflow PATCH](<D:/Document Management/dms/server/src/admin/admin.controller.ts:205>), [guard default](<D:/Document Management/dms/server/src/auth/permissions.guard.ts:21>), [settings permission](<D:/Document Management/dms/server/src/admin/admin.controller.ts:26>), [audit logs](<D:/Document Management/dms/server/src/admin/admin.controller.ts:219>)

**แก้:** Map permission ให้ทุก operation ของ Document/Workflow/Folder/Admin บน server การซ่อนปุ่มบน frontend ไม่พอ จัด read-only lookup สำหรับรายชื่อที่ฟอร์มต้องใช้แยกจากข้อมูล admin

### A12 — P1/P2: การเข้าถึง folder และสถานะบัญชียังมีช่องว่าง

Folder move ไม่รับ current user และไม่ตรวจเจ้าของเอกสาร/สิทธิ์แก้ไข/สิทธิ์ปลายทาง ผู้ login สามารถย้ายเอกสารคนอื่นไป private folder ได้ ส่วน folder detail ตรวจแค่สิทธิ์ folder แล้วคืน documents ภายในโดยไม่ตรวจ visibility ของเอกสารแต่ละฉบับ

ตำแหน่ง: [move controller](<D:/Document Management/dms/server/src/folders/folders.controller.ts:78>), [move service](<D:/Document Management/dms/server/src/folders/folders.service.ts:282>), [folder documents](<D:/Document Management/dms/server/src/folders/folders.service.ts:114>)

JWT validate ตรวจ `is_active` แต่ไม่ตรวจ `is_deleted` และ `role.is_active` การปิด role จึงไม่ได้หยุดสิทธิ์ของสมาชิกโดยอัตโนมัติ

ตำแหน่ง: [JWT validate](<D:/Document Management/dms/server/src/auth/jwt.strategy.ts:56>), [ปิด role](<D:/Document Management/dms/server/src/admin/admin.service.ts:264>)

**แก้:** ตรวจสิทธิ์ต้นทาง/ปลายทางและเอกสารทุกครั้ง ใช้ active/deleted policy เดียวกันทั้ง login และ JWT validation กำหนดผลของการปิด role ให้สอดคล้องกับ UI

Signature ใช้ AES-GCM แต่ environment ปัจจุบันไม่มี ENCRYPTION_KEY จึงใช้ key fallback ที่อยู่ใน source ต้องกำหนด key ที่เหมาะสมและวางแผนย้ายข้อมูลเดิมก่อนเปลี่ยน key มิฉะนั้นถอดลายเซ็นเดิมไม่ได้

ตำแหน่ง: [EncryptionService](<D:/Document Management/dms/server/src/common/encryption/encryption.service.ts:14>), [PDF decrypt](<D:/Document Management/dms/server/src/documents/documents.service.ts:725>)

## B. ปัญหาการใช้งานและความถูกต้องของข้อมูล

### B01 — P2: บางการตั้งค่า master data ไม่ persist

- DocumentRunningTab เรียก `getRunningConfigs()` ที่คืน [] และ `updateRunningConfig()` เป็น no-op; มี API wrapper GET running-numbers แต่ controller ไม่มี GET route นี้
- หน้า admin signature บันทึก/เปลี่ยนสถานะเฉพาะ React context ไม่มี backend save; refresh แล้วกลับข้อมูลเดิม ขณะที่ profile upload signature มี backend จริง
- ปิด/restore workflow ใน master page เปลี่ยน local data โดยไม่มี API operation ของ workflow ใน branch นี้
- การเพิ่ม department/position/doc type ใช้ id ฝั่งหน้าเว็บแทน id ที่ API สร้าง จึงเสี่ยงแก้/ลบรายการที่เพิ่งเพิ่มไม่เจอจน refresh

ตำแหน่ง: [running no-op](<D:/Document Management/dms/client/src/views/features/master-data/utils.ts:32>), [admin signature no-op](<D:/Document Management/dms/client/src/app/(main)/admin/master-data/page.tsx:681>), [local id](<D:/Document Management/dms/client/src/app/(main)/admin/master-data/page.tsx:693>), [delete workflow branch](<D:/Document Management/dms/client/src/app/(main)/admin/master-data/page.tsx:815>)

**แก้:** ทุก toast บันทึกสำเร็จต้องมาจาก API ที่ persist แล้ว ใช้ id/record ที่ API คืน Reload page ต้องได้ค่าเดิมที่เพิ่งบันทึก

### B02 — P2: จำนวนเงิน PR/PO และวันที่ไม่สอดคล้องกัน

- PR preview เพิ่ม VAT 7% แต่ backend PR จาก payload ปัจจุบันเก็บ subtotal ตัวอย่าง 2 × 100: preview 214 แต่ list/DB 200
- PO ส่ง VAT 0 เป็น 7 เพราะ `vatPercent || 7` เมื่อส่ง VAT 10 ตรง API ยอดรวมเป็น 220 แต่ item ถูกเก็บ VAT 7 และ total_price 200
- PDF generator ใช้ VAT 7% คงที่ทั้ง PR/PO โดยไม่อ่าน VAT ของแต่ละ item
- requestedDate/requiredDate ของ PR มีใน UI แต่ submit payload/DTO ไม่ส่ง/รับค่าดังกล่าว backend ตั้ง requested_date เป็นเวลาปัจจุบันและไม่บันทึก required_date

หลักฐาน: `PO-VAT` ไม่ผ่าน

ตำแหน่ง: [PR total](<D:/Document Management/dms/client/src/views/components/forms/PRForm.tsx:211>), [PO VAT payload](<D:/Document Management/dms/client/src/app/(main)/submissions/create/page.tsx:176>), [backend calculation](<D:/Document Management/dms/server/src/documents/documents.service.ts:400>), [PO items](<D:/Document Management/dms/server/src/documents/documents.service.ts:445>), [PDF VAT](<D:/Document Management/dms/server/src/documents/documents.service.ts:904>), [PR payload](<D:/Document Management/dms/client/src/app/(main)/submissions/create/page.tsx:91>)

**แก้:** ใช้สูตร/นิยาม total ชุดเดียวกัน UI, API, DB, PDF, reports รองรับ VAT 0 ด้วย `??` ส่งและ validate วันที่ที่ UI เปิดให้กรอก ไม่ใช้ตัวเลขแสดงผลอย่างเดียว

### B03 — P2: แก้เอกสาร PDF เดิมโดยไม่เลือกไฟล์ใหม่ไม่ได้

UploadOnlyForm ตรวจ `initialData.versions[0].file_data` เพื่อยืนยันมีไฟล์เดิม แต่ document detail ไม่คืน file_data ดังนั้นผู้ใช้เปิดแก้ metadata ของ DOC เดิมโดยไม่ upload ใหม่จะติด validation ทั้งที่ backend มี branch แก้ without file

รายละเอียด DOC ที่ใส่ใน `purpose` ก็ไม่ได้ถูกเก็บเป็น field ใน document หรือ form ของ DOC จึงหายหลังเปิดเอกสารใหม่

ตำแหน่ง: [ตรวจไฟล์เดิม](<D:/Document Management/dms/client/src/views/components/forms/UploadOnlyForm.tsx:105>), [document response](<D:/Document Management/dms/server/src/documents/documents.service.ts:1587>), [ข้อมูล DOC](<D:/Document Management/dms/server/src/documents/documents.service.ts:416>)

**แก้:** ใช้ metadata เช่น has_file/file_extension/download_url ตรวจไฟล์เดิม ไม่ส่ง binary ทั้งก้อนเพื่อ validation และเก็บ description ในข้อมูล/snapshot ที่สอดคล้องกับแบบปัจจุบัน

### B04 — P2: ยกเลิกเอกสารไม่ได้ยุติ workflow ตามข้อความบนหน้าจอ

CancelDocumentButton เรียก DELETE ซึ่ง soft delete เอกสารเท่านั้น ไม่ตั้ง Cancelled ไม่หยุด workflow และไม่ส่งเหตุผลที่กรอกไป backend Approval inbox ไม่กรอง document.is_deleted ใน query ด้วย

ตำแหน่ง: [Cancel API call](<D:/Document Management/dms/client/src/views/components/documents/CancelDocumentButton.tsx:31>), [softDelete](<D:/Document Management/dms/server/src/documents/documents.service.ts:1502>), [approval inbox](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:370>)

**แก้:** แยก cancel กับ delete ตามผลที่ผู้ใช้เห็น Cancel ต้องเก็บเหตุผล เปลี่ยนสถานะ ยุติขั้นค้าง และไม่ให้เกิด action ต่อหลังยกเลิก

### B05 — P2: Transaction ยังไม่ครอบคลุมการเปลี่ยนข้อมูลทั้งชุด

Create แยก running number, document, version และ audit ออกจากกัน; full update และ new-version upload ก็หลายคำสั่งนอก transaction Reject เปลี่ยน step, workflow, document, notification, audit, version ทีละคำสั่ง หากคำสั่งหลัง fail อาจได้สถานะค้างครึ่งหนึ่ง

การ update role permissions และ master workflow ล้างค่าทั้งชุดก่อนสร้างใหม่ หากข้อมูลไม่ถูกต้อง/DB fail ค่าที่เคยใช้งานได้หายหรือเหลือไม่ครบ; submit รอบใหม่ลบ workflow/steps เดิม จึงเสียประวัติรายชื่อ/ความเห็นจากรอบก่อน เว้นแต่เก็บเป็น snapshot ก่อน

ตำแหน่ง: [create](<D:/Document Management/dms/server/src/documents/documents.service.ts:363>), [reject](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:813>), [role permissions](<D:/Document Management/dms/server/src/admin/admin.service.ts:240>), [master workflow](<D:/Document Management/dms/server/src/admin/admin.service.ts:436>), [ลบ workflow เดิม](<D:/Document Management/dms/server/src/workflows/workflows.service.ts:240>)

**แก้:** Validate ทั้งชุดก่อน mutation และใช้ transaction สำหรับข้อมูลที่ต้องเปลี่ยนพร้อมกัน เก็บประวัติแต่ละรอบก่อนสร้าง workflow ใหม่ ทดสอบ failure กลาง transaction

### B06 — P2: Running number/version มีความเสี่ยงตอนกดพร้อมกัน

Running number อ่าน current_number แล้วค่อย update เป็นค่าคงที่ Transaction แบบเดิมไม่ล็อกการอ่าน จึงมี interleaving ที่สอง request ได้เลขเดียวกันแล้วหนึ่งรายการติด unique constraint Version ใช้ latest + 1 โดย schema ไม่มี composite unique `(document_id, version_number)`

Partial PATCH running-number ไม่ส่ง last_reset_year แล้ว service เขียน `Number(undefined)` เป็น NaN; backend ใช้เลขปี/format คงที่แม้ UI มีตัวเลือกตั้งค่า

หลักฐาน: `RUNNING-PARTIAL` ไม่ผ่าน; การตรวจรอบแรกจำลอง concurrent readers ยืนยันเลขชนกัน ทั้งนี้ยังไม่ได้ stress test PostgreSQL พร้อมกันจริง

ตำแหน่ง: [เลขถัดไป](<D:/Document Management/dms/server/src/documents/documents.service.ts:383>), [version ถัดไป](<D:/Document Management/dms/server/src/documents/documents.service.ts:586>), [schema version](<D:/Document Management/dms/server/prisma/schema.prisma:298>), [partial PATCH](<D:/Document Management/dms/server/src/admin/admin.service.ts:534>)

**แก้:** Allocate number แบบ atomic/lock พร้อม retry ที่เหมาะสม ใช้ unique constraint กับเลข version และไม่เขียน field ที่ไม่ได้ส่งมา กำหนด UI setting ให้ตรงกับความสามารถ backend

### B07 — P2: หน้ารายงานและเวลาอนุมัติคลาดเคลื่อน

ReportsPage return ก่อนเรียก hooks เมื่อไม่มีสิทธิ์ Lint พบ `react-hooks/rules-of-hooks` 16 จุดในหน้านี้ ยังไม่ได้ยืนยันว่าเกิด runtime error ใน browser ปัจจุบัน เพราะ admin layout มี loading/permission gate อยู่ด้วย ควรย้าย hooks หรือแยก component ให้ถูกต้องเพื่อไม่พึ่งเงื่อนไขของ parent

ค่า approvalDays ใช้ `created_at`/`updated_at` แต่ document response ไม่ส่ง updated_at จึง fallback เป็น 1 วัน ทั้งที่มี approved_at; submittedDate ใช้เวลาสร้างเอกสารแทนเวลาส่งอนุมัติ PDF signature date ใช้ doc.created_at และฟอร์มอ่าน `s.approved_at` แต่ workflowStep field จริงชื่อ action_date

ตำแหน่ง: [early return](<D:/Document Management/dms/client/src/app/(main)/admin/reports/page.tsx:90>), [approvalDays](<D:/Document Management/dms/client/src/app/(main)/admin/reports/page.tsx:207>), [submittedDate](<D:/Document Management/dms/server/src/documents/documents.service.ts:1599>), [PDF sign date](<D:/Document Management/dms/server/src/documents/documents.service.ts:801>), [BK sign date](<D:/Document Management/dms/client/src/views/components/forms/BKForm.tsx:90>)

**แก้:** ย้าย hooks ก่อนเงื่อนไขหรือแยก component ใช้เวลาจาก event ของ flow จริง และใช้ชื่อ field ให้ตรงกัน

Reports/list หลายหน้าโหลดสูงสุด 1000 เอกสารแล้วคำนวณบน client ไม่ใช้ pagination ต่อ จึงยังไม่รับรองความครบถ้วนเมื่อข้อมูลเกิน 1000 Dashboard count ทั้งองค์กรโดยไม่ใช้ visibility เดียวกับ list และ data chart/trend บางส่วนคืน array ว่าง

### B08 — P2: Input ไม่ถูก validate และ upload signature กว้างเกินความสามารถ PDF-LIB

Items มีแค่ IsArray ไม่มี ValidateNested/Type และ quantity ไม่บังคับ integer/positive จึงรับจำนวนติดลบหรือ field ผิดรูปแบบ ก่อนถึง Prisma quantity Int โดย backend คำนวณ `quantity || 1` ทำให้ quantity 0 ถูกคำนวณเป็น 1

Signature ยอมรับ `image/*` แต่ embed รองรับ PNG/JPEG เป็นหลัก SVG/GIF/WebP อาจ upload ได้แล้วเซ็นไม่สำเร็จ ไม่มีขนาด upload ของ signature ที่ endpoint กำกับเหมือน document upload

หลักฐาน: `NEGATIVE-INPUT` ไม่ผ่าน; รอบแรกทดสอบ SVG upload แล้วรับได้

ตำแหน่ง: [items DTO](<D:/Document Management/dms/server/src/documents/dto/create-document.dto.ts:48>), [quantity calculation](<D:/Document Management/dms/server/src/documents/documents.service.ts:401>), [signature MIME](<D:/Document Management/dms/server/src/users/users.service.ts:21>), [signature upload](<D:/Document Management/dms/server/src/users/users.controller.ts:35>)

**แก้:** Validate nested input, integer/range/date และชนิดไฟล์จริงก่อนบันทึก Allowlist PNG/JPEG หรือ convert เป็นชนิดที่รองรับ กำหนดขนาดรูปและ bounds ของลายเซ็นบน PDF

### B09 — P2: การดาวน์โหลดอาจได้เอกสารผิดฉบับหรือ PDF ที่ไม่มีเนื้อหา

ขอ version ที่ไม่มีแล้วระบบคืน latest เงียบ ๆ แทน 404 (`MISSING-VERSION` ไม่ผ่าน) PDF จากฟอร์มอาศัย Chrome/Edge ตำแหน่ง Windows คงที่ เมื่อใช้ไม่ได้ fallback PDF-LIB สร้างเพียง header บริษัท ไม่วาด form, items หรือ signature

HTML generator interpolate ข้อความจากผู้ใช้โดยไม่ escape จึงมีความเสี่ยงต่อ HTML/script injection ใน headless rendering ข้อนี้พบจาก code ยังไม่ได้ทดสอบโจมตีจริง

ตำแหน่ง: [missing version](<D:/Document Management/dms/server/src/documents/documents.service.ts:700>), [Chromium path](<D:/Document Management/dms/server/src/documents/documents.service.ts:1266>), [fallback PDF](<D:/Document Management/dms/server/src/documents/documents.service.ts:1322>), [HTML items](<D:/Document Management/dms/server/src/documents/documents.service.ts:918>)

**แก้:** Missing version ต้องแจ้งตรงไปตรงมา Renderer ไม่พร้อมต้อง fail ชัดเจนหรือมี fallback ที่สร้างเนื้อหาครบ Escape ข้อมูลผู้ใช้ และกำหนด runtime PDF ที่ตรวจตอนเริ่มระบบ

### B10 — P2: แจ้งสำเร็จแม้ submit ไม่สำเร็จ และ audit ยังไม่ครบ

workflow service ฝั่ง client กลืน error แล้วคืน false แต่ PR handler และ DOC edit ไม่ตรวจ false ทำให้ผู้ใช้เห็น Pending success ทั้งที่เอกสารยัง Draft; PO/BK/new DOC ตรวจ false แล้ว แต่แสดง error จาก API wrapper ที่ reject string ได้ไม่ครบ

Notification mark-read ไม่เก็บ read_at (`READ-TIME` ไม่ผ่าน) Admin mutations/Folder operations หลายรายการไม่มี audit log และ details บางรายการไม่คง oldState/newState การ approve ที่เซ็นบันทึก action Signature เพียงรายการเดียว จึงต้องกำหนดความหมายรายงาน audit ให้ชัด

ตำแหน่ง: [submit false](<D:/Document Management/dms/client/src/controllers/services/workflows.service.ts:34>), [PR success](<D:/Document Management/dms/client/src/app/(main)/submissions/create/page.tsx:123>), [DOC edit](<D:/Document Management/dms/client/src/app/(main)/submissions/create/page.tsx:329>), [read_at](<D:/Document Management/dms/server/src/notifications/notifications.service.ts:22>), [admin mutations](<D:/Document Management/dms/server/src/admin/admin.service.ts:72>)

Department/position delete ใช้ hard delete เมื่อไม่มี user แม้ master UI มีแนวคิดปิดใช้งาน/restore และอาจยังมี form อ้างอิงอยู่ ต้องเลือก soft delete สม่ำเสมอตาม flow ปัจจุบัน

ตำแหน่ง: [department delete](<D:/Document Management/dms/server/src/admin/admin.service.ts:301>), [position delete](<D:/Document Management/dms/server/src/admin/admin.service.ts:343>)

## C. สรุปตามระบบที่ขอตรวจ

| ระบบ | ผลประเมินตาม code และการทดสอบ |
| --- | --- |
| สร้าง PR/PO/BK/DOC | โครงสร้างสร้าง Draft ได้; ต้องแก้ visibility, fields ที่หาย, totals และ transaction |
| ส่งอนุมัติ | สร้าง workflow ได้; ต้องบังคับ matrix/เจ้าของ/permission และจัดการ error ให้ UI ถูกต้อง |
| อนุมัติตามรายชื่อ | ยังรับรองไม่ได้ มีทางอนุมัติแทนคนที่กำหนด |
| ลงลายเซ็น | ฝัง PNG ลง PDF ที่มี bytes ได้ในข้อมูลจำลอง; flag/version response และ UI placement ยังไม่ถูกต้อง |
| เก็บเอกสาร/ลายเซ็น | ปัจจุบันเก็บ PDF bytes กับ signature ciphertext ใน PostgreSQL; ต้องแก้ public access, key และ freeze หลักฐาน |
| Version control | มี list/upload/download; ประวัติเดิมถูกแก้ได้และ PDF ย้อนหลังใช้ข้อมูลปัจจุบัน |
| โหลด/preview/download | มีเส้นทางจริง; สิทธิ์แต่ละเส้นทางไม่ตรงกัน, missing version/fallback PDF ต้องแก้ |
| Permission | มี UI gate/JWT/บาง admin guards; ขาด enforcement ของ actions หลักและ resource access |
| Master data | CRUD หลายส่วนจริง; running/signature/workflow state บางส่วนยัง no-op/local only |
| Cancel/return/resubmit | มี UI/API; cancel ไม่หยุด workflow และ resubmit ลบประวัติรอบเก่า |
| Audit/notification | มีข้อมูลและแจ้งขั้นถัดไปได้; action coverage/read_at/error consistency ยังขาด |
| Dashboard/reports/search | เชื่อมเอกสารจริง; reports hooks/เวลา/pagination และ metric scope ต้องตรวจแก้ |

ไม่สรุปว่าการเก็บใน DB เป็นข้อผิดพลาดเพียงเพราะต่างจาก File Server เดิม แต่เมื่อใช้ PostgreSQL เก็บ binary แล้วต้องสำรอง DB รวมข้อมูลไฟล์ และทดสอบ restore ให้ได้ bytes/ลายเซ็น/versions ครบ

## D. ลำดับแก้ที่แนะนำ

1. **สิทธิ์และข้อมูลรั่ว:** A01–A07, A11–A12 ให้ทุก action และทุกช่องทางอ่านไฟล์มีเงื่อนไขเดียวกัน
2. **ความน่าเชื่อถือเอกสาร:** A08–A10, B04–B06 ผูก approval กับ version, freeze ประวัติ, ทำ state transition/transaction ให้ครบ
3. **ฟอร์มและการตั้งค่าปัจจุบัน:** B01–B03, B07–B10 ให้ข้อมูลที่หน้าจอบอกว่าบันทึกตรง DB/PDF และ error แสดงตรงเหตุการณ์
4. **ทดสอบก่อนทำเล่ม:** รันชุดทดสอบนี้ซ้ำ ตามด้วย UAT จริงบนฐานข้อมูลแยกที่ใช้ schema/config ปัจจุบัน และเก็บภาพ/ผลลัพธ์ตามรายการด้านล่าง

## E. รายการ UAT ที่ใช้เป็นหลักฐานในเล่มได้หลังแก้

ใช้บัญชีทดสอบแยก: ผู้สร้าง, ผู้อนุมัติแต่ละขั้น, บุคคล role เดียวกับผู้อนุมัติแต่ไม่ได้รับมอบหมาย, บุคคลไม่เกี่ยวข้อง, admin ที่มี/ไม่มี permission ที่ทดสอบ ห้ามใช้ผลผ่านของ mock เป็นผล Browser E2E

| กรณี | ผลที่ต้องยืนยัน |
| --- | --- |
| PR / PO / BK / DOC บันทึกร่าง เปิดใหม่ และส่ง | field/ไฟล์ครบ ไม่มี duplicate, status/ขั้นตรง master ปัจจุบัน |
| แก้ชื่อ วันที่ รายการ VAT 0/7/10 และรายละเอียด DOC | UI/list/detail/PDF/DB ได้ค่าเดียวกัน |
| เลือกผู้อนุมัติเป็นคน | คนอื่นรวมถึง role เดียวกันกดไม่ได้ทั้ง UI/API |
| อนุมัติทุกขั้นที่ master กำหนดจริง | ต่อขั้นถูกต้อง notification ไปคนถูก เอกสารจบเฉพาะเมื่อครบ |
| Return ที่ขั้นกลาง แก้ แล้ว resubmit | เก็บเหตุผล/ผู้กระทำ/เวลารอบเดิม, version เก่าไม่เปลี่ยน |
| Reject/Cancel | ยุติ workflow ไม่แสดงใน pending inbox และ action หลังจบถูกปฏิเสธ |
| กดอนุมัติซ้ำ/สองหน้าต่าง/approve กับ reject พร้อมกัน | เกิดผลเพียงครั้งเดียว ไม่มี version/notification ซ้ำ |
| เซ็น PNG/JPEG, ไม่มีรูป, รูปผิดชนิด, PDF เสีย, หน้าหรือพิกัดผิด | แจ้ง error ถูกต้อง ไม่เกิด signed=true เมื่อฝังไม่ได้ |
| DOC หลายหน้าและหลายผู้อนุมัติ | หน้า/พิกัดตรง preview ไม่ทับลายเซ็นเดิม ข้อความ/วันที่ persist หากเปิดให้ใช้ |
| ดู/ดาวน์โหลดทุก version หลังเปลี่ยน profile signature | เนื้อหา ชื่อ ลายเซ็น เวลา ของ version เก่าคงเดิม |
| Upload new version หลัง Approved | ไฟล์ใหม่ไม่รับสถานะอนุมัติของไฟล์เก่าโดยอัตโนมัติ |
| CompanyWide / Department / SpecificUsers ทุกประเภท | detail/preview/versions/download/workflow/folders ถูกอนุญาตหรือปฏิเสธตรงกัน |
| ปรับ permission/ปิดบัญชี/ปิด role | ผลบน API ตรงค่าปัจจุบัน และ response ไม่มี hash/token ภายใน |
| Master create/edit/deactivate/restore แล้ว refresh | ค่าคงอยู่ ใช้ id ของ DB และค่ามีผลใน flow จริง |
| ทำให้ DB fail กลาง mutation ใน test DB | ไม่มีข้อมูลครึ่งชุดและไม่ส่ง success toast |
| ข้อมูลเกิน 1000 และหลายคนใช้งานพร้อมกัน | list/search/reports ครบและ running/version ไม่ชนกัน |
| สำรองแล้ว restore ใน DB แยก | เอกสาร ไฟล์ versions workflow ลายเซ็น และ audit ครบ |

## F. วิธีรันหลักฐานที่แนบ

ใช้ PowerShell จาก `D:\Document Management\dms`:

```powershell
Push-Location server
& ..\node_modules\.bin\nest.cmd build
Pop-Location
node scripts/audit-current-flow.cjs
```

Script คืน exit code 1 เมื่อมีกรณีไม่ผ่านตามผลปัจจุบัน และ 2 ถ้า setup รันไม่ได้ ไม่ควรตีความ exit 1 ว่า script เสีย ผลจะถูกเขียนลง current-flow-results.json การเชื่อม HTTP localhost อาจต้องรันนอก sandbox ของเครื่องมือตรวจ

ไม่รัน e2e เดิมกับ DB จริง เพราะ test ปัจจุบันอ้าง seed credentials, cleanup ด้วย hard delete และ app.e2e ยังตรวจ Hello World route ที่ไม่มีใน AppModule อีกทั้ง test E-sign เดิมมีเพียง console.warn ที่ไม่ assert PDF bytes จึงใช้ยืนยัน flow ปัจจุบันไม่ได้

ยังไม่รับรองส่งอีเมลจริง: environment ที่อ่านจาก server/.env ไม่มี SMTP config และ forgot-password กลืน send error ส่วน reject ไม่ส่งอีเมลใน code ปัจจุบัน หาก flow ที่ปรับแล้วต้องใช้เฉพาะ in-app notification ให้ระบุเช่นนั้นในเล่ม ส่วน password reset ต้องมีวิธีรับ reset link ที่ใช้งานจริง

ยังไม่รับรอง backup/restore หรือความสามารถรองรับผู้ใช้พร้อมกันจากการ build ผ่าน ไม่พบหลักฐานทดสอบ restore อัตโนมัติใน code ที่ตรวจ และไม่ได้เปลี่ยนค่า/รัน seed/migrate กับ DB จริง
