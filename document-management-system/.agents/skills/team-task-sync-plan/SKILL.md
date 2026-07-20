---
name: team-task-sync-plan
description: >
  แผนงานทีม DMS แยก Developer A (Workflow/PDF) และ Developer B (Admin/Auth)
  พร้อม Merge Sync Checkpoints สำหรับรวมโค้ด ใช้เมื่อวางแผนงานทีม แบ่งหน้าที่
  merge branch หรือตรวจสอบ checkpoint การเชื่อมระบบ
---

# Team To-Do List & Merge Checkpoints

แผนการทำงานนี้ถูกออกแบบมาเพื่อแยกงานคุณและเพื่อนให้ขาดจากกัน (ลด Merge Conflict) แต่กำหนด **"จุดรวมโค้ด (Sync Checkpoints)"** อย่างชัดเจน เพื่อให้ทั้งสองระบบนำมาเชื่อมต่อกันได้อย่างสมบูรณ์

---

## Developer A (คุณ - รับผิดชอบ Core Workflow & PDF)
**Branch:** `feat/workflow-pdf`

### ภารกิจช่วงที่ 1 (Core Workflow UI)
- `[ ]` สร้างไฟล์ `src/components/workflow/WorkflowTracker.tsx` (แถบ Stepper แสดงสถานะอนุมัติ)
- `[ ]` นำ `WorkflowTracker` ไปใส่ในหน้า `/documents/[id]` และ `/approvals/[id]`
- `[ ]` สร้าง API จำลองสำหรับเปลี่ยนสถานะ (Approve / Reject)

### ภารกิจช่วงที่ 2 (E-Signature & PDF)
- `[ ]` ติดตั้ง `react-pdf` และสร้าง `src/components/pdf-viewer/PDFViewer.tsx`
- `[ ]` สร้าง `SignatureOverlay.tsx` สำหรับระบบลากวางรูปภาพลายเซ็น
- `[ ]` นำระบบ PDF ไปใส่ในหน้า `/approvals/[id]`

### ภารกิจช่วงที่ 3 (Dashboard)
- `[ ]` ติดตั้ง `recharts` และทำกราฟสรุปจำนวนเอกสารในหน้า `/dashboard`

---

## Developer B (เพื่อน - รับผิดชอบ Admin & Auth)
**Branch:** `feat/admin-auth`

### ภารกิจช่วงที่ 1 (Master Data)
- `[ ]` สร้างหน้า `/admin/master-data/page.tsx` (เพิ่ม/ลด แผนก, ตำแหน่ง, ประเภทเอกสาร)
- `[ ]` สร้างหน้า `/admin/running-number/page.tsx` (ตั้งค่าฟอร์แมตเลขเอกสาร)
- `[ ]` ทำระบบ API Backend ที่เกี่ยวข้องกับ Master Data

### ภารกิจช่วงที่ 2 (Authentication & Security)
- `[ ]` สร้างหน้า Login (`/login`)
- `[ ]` สร้าง `middleware.ts` สำหรับป้องกันการเข้าถึงหน้าเว็บ (ถ้ายังไม่ล็อกอินให้เด้งไปหน้า Login)
- `[ ]` ทำระบบคืนค่า JWT Token จำลอง (Mock JWT)

### ภารกิจช่วงที่ 3 (User Management)
- `[ ]` สร้างหน้า `/admin/users/page.tsx` (ตารางพนักงาน)
- `[ ]` สร้างหน้า `/admin/roles/page.tsx` (จัดการสิทธิ์)
- `[ ]` ทำ API สำหรับ CRUD ผู้ใช้งาน

---

# Checkpoints การรวมโค้ด (Merge Sync Points)

*นี่คือจุดที่ทั้งสองคนต้องหยุดเขียนโค้ดชั่วคราว ดึงโค้ดมารวมกันที่ `main` และทดสอบระบบร่วมกัน*

### Sync Point 1: "ระบบเอกสารเชื่อม Master Data"
**เมื่อไหร่ที่ต้องรวม:**
- เมื่อ Dev A ทำ "ภารกิจช่วงที่ 1" เสร็จ และ Dev B ทำ "ภารกิจช่วงที่ 1" เสร็จ

**ต้องเช็คอะไรหลังรวมโค้ด:**
- ทดสอบสร้างเอกสารใบใหม่ แล้วเช็คว่าระบบสามารถดึง "ประเภทเอกสาร" และ "รันเลขเอกสารอัตโนมัติ" จากระบบที่ Dev B สร้าง มาแสดงบนหน้า UI ของ Dev A ได้ถูกต้องหรือไม่

**Git Command:**
```bash
# บนเครื่อง Dev A (หรือ B)
git checkout main
git pull origin main
git merge feat/workflow-pdf
git merge feat/admin-auth
git push origin main
```

### Sync Point 2: "เซ็นเอกสารด้วยตัวตนจริง"
**เมื่อไหร่ที่ต้องรวม:**
- เมื่อ Dev A ทำ "ภารกิจช่วงที่ 2" เสร็จ และ Dev B ทำ "ภารกิจช่วงที่ 2" เสร็จ

**ต้องเช็คอะไรหลังรวมโค้ด:**
- ให้ Dev B ล็อกอินด้วยบัญชีจำลอง (เช่น `user1`)
- ให้ Dev A เปิดหน้าลงนาม PDF แล้วเช็คว่า "ลายเซ็น" ที่นำมาแปะลง PDF ดึงมาจากบัญชีของ `user1` ที่ล็อกอินอยู่จริงๆ หรือไม่ (Auth + E-Signature รวมร่างกัน)

### Sync Point 3: "เปิดระบบ Dashboard และส่งมอบ"
**เมื่อไหร่ที่ต้องรวม:**
- เมื่อภารกิจช่วงที่ 3 ของทั้งสองคนเสร็จสิ้น

**ต้องเช็คอะไรหลังรวมโค้ด:**
- ล็อกอินด้วยไอดีพนักงานทั่วไป -> ต้องเข้าหน้า `/admin` ไม่ได้ (โดนเด้งออก)
- หน้า Dashboard แสดงสถิติเอกสารที่ดึงมาจากฐานข้อมูลรวมได้อย่างแม่นยำ
