---
name: dms-tech-spec
description: >
  ข้อกำหนดทางเทคนิคสำหรับโปรเจกต์ Document Management & Electronic Approval System (DMS)
  ล็อคกรอบ stack, convention, file structure, database schema, API endpoints
  และ implementation rules ป้องกันการทำงานหลุดออกจากแผนที่วางไว้
---

# DMS Technical Specification — LOCKED (อ่านก่อนเขียนโค้ดทุกครั้ง)

> **MANDATORY**: อ่าน SKILL นี้ให้ครบก่อนเขียนโค้ดทุกครั้ง ห้ามเบี่ยงเบนจาก spec นี้โดยไม่ได้รับการยืนยันจาก user อย่างชัดเจน

---

## 0. Workspace Root (LOCKED)

```
Monorepo Root : D:\Document Management\dms\
Frontend      : D:\Document Management\dms\client\
Backend       : D:\Document Management\dms\server\
```

> ห้ามเขียนโค้ดโปรเจกต์นอก `D:\Document Management\dms\` เด็ดขาด  
> โฟลเดอร์เก่า `dms-backend/` และ `document-management-system/` เป็นของเก่า — **อย่าแตะ**

---

## 1. Project Overview

**ชื่อ**: Document Management & Electronic Approval System (DMS)  
**ลูกค้า**: นิสซุย (ประเทศไทย)  
**บริบท**: จัดการเอกสาร + ลงลายเซ็นอิเล็กทรอนิกส์ภายในองค์กร รองรับ PR / PO / บันทึกข้อความ (BK) / PDF ทั่วไป  
**ผู้ใช้**: ~100 คน (Employee, Manager, Executive, Administrator)  
**แหล่ง Requirement**: `Requirement Document Management System นิสซุย.pdf` — ยึดเป็นหลัก

---

## 2. Technology Stack (LOCKED)

### 2.1 Frontend — `dms/client/`

| รายการ | Detail |
|--------|--------|
| Framework | **Next.js 16** (App Router เท่านั้น — ห้าม Pages Router) |
| Language | **TypeScript** (ห้ามใช้ `.js` `.jsx` ในโค้ดหลัก) |
| Styling | **Tailwind CSS v4** — ใช้ `@import "tailwindcss"` (**ห้าม** `@tailwind base/components/utilities`) |
| Icons | **lucide-react** เท่านั้น |
| Class merging | `cn()` จาก `src/lib/utils.ts` |
| HTTP Client | `axios` |
| PDF Viewer | `react-pdf` (Phase 2) |
| Charts | `recharts` (Phase 3) |
| File Upload | `react-dropzone` (Phase 1.3) |

### 2.2 Backend — `dms/server/`

| รายการ | Detail |
|--------|--------|
| Framework | **NestJS 11** |
| ORM | **Prisma** |
| Database | **PostgreSQL** |
| Auth | JWT (httpOnly Cookie) + bcrypt |
| File Upload | Multer → File Server (local path) |
| PDF Processing | PDF-LIB (ฝังลายเซ็น) |
| Email | Nodemailer |

---

## 3. Next.js 16 Breaking Changes (CRITICAL)

### 3.1 Async params/searchParams — MUST AWAIT

```typescript
// ✅ CORRECT
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ต้อง await เสมอ
}

// ❌ WRONG — deprecated ใน Next.js 15+
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params; // ❌ พัง
}
```

### 3.2 CSS — Tailwind v4 Syntax

```css
/* ✅ CORRECT */
@import "tailwindcss";

/* ❌ WRONG — v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3.3 Server vs Client Components

- **Default**: Server Component (ไม่ต้องใส่ directive)
- **Client Component**: ใส่ `"use client"` เฉพาะเมื่อต้องการ useState / useEffect / event handlers
- **Rule**: Push `"use client"` ลงไปที่ leaf component ให้ลึกที่สุด

---

## 4. Project File Structure (LOCKED — สถานะจริง ณ ปัจจุบัน)

```
dms/                                    ← Monorepo Root
├── package.json                        ← รัน "concurrently" ทั้ง client+server พร้อมกัน
│
├── client/                             ← Frontend: Next.js 16
│   ├── src/
│   │   ├── app/                        ← [Router] Next.js App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   └── (main)/
│   │   │       ├── layout.tsx          ← App Shell (Sidebar+Topbar)
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── documents/
│   │   │       │   ├── page.tsx        ← Document List
│   │   │       │   ├── upload/page.tsx ← อัปโหลด/สร้างเอกสาร
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx    ← Document Detail
│   │   │       │       └── versions/page.tsx
│   │   │       ├── approvals/
│   │   │       │   ├── page.tsx        ← Approval Inbox
│   │   │       │   ├── history/page.tsx
│   │   │       │   └── [id]/page.tsx  ← Approval Task + PDF
│   │   │       ├── notifications/page.tsx
│   │   │       ├── profile/page.tsx
│   │   │       └── admin/
│   │   │           ├── audit-logs/page.tsx
│   │   │           ├── reports/page.tsx
│   │   │           ├── master-data/
│   │   │           │   ├── page.tsx
│   │   │           │   └── doc-forms/page.tsx
│   │   │           └── config/
│   │   │               ├── page.tsx
│   │   │               ├── roles/page.tsx
│   │   │               └── users/page.tsx
│   │   │
│   │   ├── models/                     ← [M] TypeScript Types/Interfaces (Source of Truth)
│   │   │   └── index.ts               ← ALL domain types อยู่ที่นี่
│   │   │
│   │   ├── views/                      ← [V] UI Components ล้วนๆ (Dumb — รับ Props แล้ว Render)
│   │   │   ├── components/
│   │   │   │   ├── forms/             ← PRForm.tsx, POForm.tsx, BKForm.tsx, UploadOnlyForm.tsx
│   │   │   │   ├── layout/            ← Sidebar.tsx, Topbar.tsx
│   │   │   │   ├── ui/                ← Button, Modal, Table, Toast, Badge, Card
│   │   │   │   ├── dashboard/         ← StatCard, ActivityFeed, Charts
│   │   │   │   ├── workflow/          ← WorkflowTracker, ApprovalActions, DocumentSignerViewer
│   │   │   │   ├── pdf-viewer/        ← PDFViewer.tsx, SignatureOverlay.tsx
│   │   │   │   ├── providers/         ← AuthProvider, SidebarProvider, ToastProvider, SignatureProvider
│   │   │   │   └── shared/            ← PageHeader, DashboardLayout
│   │   │   ├── features/              ← Feature-specific UI + Mock Data
│   │   │   │   ├── master-data/       ← DocumentTypesTab, ApprovalMatrixTab, WorkflowTab, etc.
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── mock/          ← data.ts, store.ts (mock data)
│   │   │   │   │   └── types.ts
│   │   │   │   ├── roles-users/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── mock/
│   │   │   │   │   └── types.ts
│   │   │   │   ├── documents/         ← api.ts, types.ts
│   │   │   │   ├── auth/
│   │   │   │   ├── notifications/
│   │   │   │   ├── profile/
│   │   │   │   └── workflow/
│   │   │   └── layouts/               ← Sidebar.tsx, Topbar.tsx (layout-level)
│   │   │
│   │   ├── controllers/                ← [C] Business Logic & Data Fetching
│   │   │   ├── services/              ← HTTP API calls (Axios → NestJS)
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── documents.service.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   └── workflows.service.ts
│   │   │   └── hooks/                 ← Custom React Hooks (State + Services)
│   │   │
│   │   └── lib/                        ← Utilities
│   │       ├── utils.ts               ← cn() helper
│   │       ├── api-client.ts          ← Axios instance
│   │       ├── api.ts
│   │       ├── document-status.ts
│   │       ├── document-type-icon.tsx
│   │       └── config-mock.ts
│   │
│   ├── tsconfig.json                   ← Path Aliases: @models, @views, @controllers, @lib
│   └── .env.local                      ← NEXT_PUBLIC_API_URL=http://localhost:4000
│
└── server/                             ← Backend: NestJS 11
    ├── src/
    │   ├── main.ts                     ← Entry point (port 4000)
    │   ├── app.module.ts
    │   ├── auth/                       ← auth.controller.ts, auth.service.ts, jwt.strategy.ts
    │   │   └── dto/login.dto.ts
    │   ├── documents/                  ← documents.controller.ts, documents.service.ts
    │   │   └── dto/create-document.dto.ts
    │   ├── admin/                      ← admin.controller.ts, admin.service.ts
    │   │   └── dto/create-user.dto.ts
    │   ├── workflows/                  ← workflows.controller.ts, workflows.service.ts
    │   │   └── dto/approve-step.dto.ts, reject-step.dto.ts
    │   ├── notifications/
    │   └── prisma/                     ← prisma.module.ts, prisma.service.ts
    ├── prisma/
    │   └── schema.prisma               ← Database Schema (ยึด ERD นี้เป็นหลัก)
    └── .env                            ← DATABASE_URL, JWT_SECRET
```

### 4.1 Path Aliases (tsconfig.json)

```json
{
  "paths": {
    "@/*":          ["./src/*"],
    "@models":      ["./src/models/index"],
    "@models/*":    ["./src/models/*"],
    "@views":       ["./src/views/index"],
    "@views/*":     ["./src/views/*"],
    "@controllers": ["./src/controllers/index"],
    "@controllers/*":["./src/controllers/*"],
    "@lib/*":       ["./src/lib/*"]
  }
}
```

---

## 5. Database Schema — ERD Final (Prisma)

> ยึดตาม ERD รูปที่แนบ — ห้ามเพิ่ม/ลบตาราง/ฟิลด์โดยไม่ได้รับอนุมัติ

### Group 1 — Master Data

```
departments      (id UUID PK, name UNIQUE, is_active, created_at, updated_at)
positions        (id UUID PK, name UNIQUE, is_active, created_at, updated_at)
document_types   (id UUID PK, type_name UNIQUE, prefix UNIQUE, is_active, created_at, updated_at)
                  prefix values: "PR" | "PO" | "BK" | "DOC"
running_numbers  (id UUID PK, document_type_id FK, prefix, year_format,
                  current_number INT=0, padding_length INT=4,
                  last_reset_year INT NULL, created_at, updated_at)
```

### Group 2 — Users & Permissions

```
roles            (id UUID PK, name UNIQUE, is_active, created_at, updated_at)
                  values: Employee | Manager | Executive | Administrator
permissions      (id UUID PK, module, action, description, created_at, updated_at)
                  module: Document | User | Workflow | Master Data | Audit Log
                  action: View | Create | Edit | Delete | Approve
role_permissions (role_id FK, permission_id FK — Composite PK)
users            (id UUID PK, username UNIQUE, email UNIQUE, password_hash,
                  first_name, last_name,
                  department_id FK NULL, position_id FK NULL, role_id FK NULL,
                  signature_image_path NULL,
                  is_active=true, is_deleted=false,
                  reset_token NULL, reset_token_expiry NULL,
                  created_at, updated_at)
```

### Group 3 — Documents & Versions

```
documents        (id UUID PK, doc_number UNIQUE, title,
                  type_id FK, creator_id FK→users,
                  status ENUM(Draft|Pending|Approved|Rejected|Cancelled),
                  search_text TEXT NULL, tags TEXT[],
                  is_deleted=false, created_at, updated_at)

pr_forms         (id UUID PK, document_id FK UNIQUE,
                  requested_date NULL, required_date NULL,
                  requester_id FK→users, department_id FK→departments,
                  purpose TEXT NULL, total_amount DECIMAL=0,
                  created_at, updated_at)
pr_form_items    (id UUID PK, pr_form_id FK,
                  item_name, quantity INT, unit NULL,
                  unit_price DECIMAL, total_price DECIMAL, remark TEXT NULL,
                  created_at, updated_at)

po_forms         (id UUID PK, document_id FK UNIQUE,
                  vendor_name, vendor_contact NULL,
                  delivery_date NULL, payment_terms NULL, total_amount DECIMAL=0,
                  created_at, updated_at)
po_form_items    (id UUID PK, po_form_id FK,
                  item_name, quantity INT, unit NULL,
                  unit_price DECIMAL, vat DECIMAL=7, total_price DECIMAL,
                  remark TEXT NULL, created_at, updated_at)

bk_forms         (id UUID PK, document_id FK UNIQUE,
                  subject, detail TEXT NULL,
                  department_id FK→departments, created_at, updated_at)

document_versions(id UUID PK, document_id FK,
                  version_number INT, file_path, file_size NULL, file_extension NULL,
                  uploaded_by_id FK→users, remarks TEXT NULL,
                  created_at, updated_at)
```

### Group 4 — Workflow & Support

```
approval_matrix  (id UUID PK, document_type_id FK,
                  step_order INT, required_role_id FK→roles,
                  created_at, updated_at)

workflows        (id UUID PK, document_id FK UNIQUE,
                  total_steps INT, current_step INT=1,
                  status ENUM(Pending|Approved|Rejected),
                  created_at, updated_at)

workflow_steps   (id UUID PK, workflow_id FK,
                  step_order INT,
                  approver_id FK→users NULL,  ← Nullable! ระบุแค่ Role ได้ ค่อยอัปเดตตอนกดอนุมัติ
                  status ENUM(Pending|Approved|Rejected),
                  action_date NULL, comment TEXT NULL,
                  signature_applied BOOLEAN=false,
                  return_to_step INT NULL, created_at, updated_at)

notifications    (id UUID PK, user_id FK→users, document_id FK NULL,
                  message TEXT, is_read=false,
                  read_at TIMESTAMP NULL, ← เวลาอ่านจริง
                  created_at, updated_at)

audit_logs       (id UUID PK, user_id FK NULL,
                  action ENUM(Login|Upload|Download|View|Edit|Delete|Approve|Reject|Signature),
                  module, target_id NULL,
                  details JSONB NULL,  ← โครงสร้าง: { oldState: {...}, newState: {...}, extra: any }
                  ip_address NULL, created_at)
                  ⚠️ Append-only: ห้าม UPDATE หรือ DELETE ตารางนี้เด็ดขาด
```

---

## 6. Document Flow (DFD — ยึดตามรูป)

### 6.1 Document Creation Flow
```
User Login (Employee / Manager / Executive)
  → เลือกประเภทเอกสาร: PR | PO | บันทึก (BK) | PDF ทั่วไป
  → กรอกฟอร์ม
  → ระบบ Auto-Generate เลขเอกสาร: {PREFIX}-{YEAR}-{XXXX}  เช่น PR-2026-0001
  → บันทึก: สถานะ = Draft
  → กดส่งอนุมัติ?
      YES → เปลี่ยนสถานะ = Pending
           → ดึง Approval Matrix ตามประเภทเอกสาร (3-4 ระดับ)
           → สร้าง Workflow + Steps (step_order 1..N)
           → ส่ง Notification ไปผู้อนุมัติ Step 1
      NO  → คงอยู่ที่ Draft
```

### 6.2 Approval Flow
```
ผู้อนุมัติรับ Notification
  → เปิดเอกสาร PDF ในเบราว์เซอร์ (react-pdf)
  → ตัดสินใจ:
      REJECT → บันทึก Comment, WorkflowStep.status = Rejected
             → Document.status = Rejected
             → ส่ง Notification + Email กลับผู้สร้าง
      APPROVE → Drag-and-Drop ลายเซ็นบนหน้า PDF
             → ส่ง { documentId, x, y, page } ไป Backend
             → Backend เริ่ม $transaction:
                 1. PDF-LIB ฝังลายเซ็น → เซฟไฟล์ชั่วคราว
                 2. สร้าง DocumentVersion ใหม่ใน DB
                 3. อัปเดต WorkflowStep.status = Approved, signature_applied = true
                 4. เพิ่ม current_step + 1
                 5. บันทึก AuditLog (action: Approve + Signature)
                 ⚠️ Rollback: หาก DB fail → ลบไฟล์ชั่วคราวทิ้ง ไม่มีขยะ
             → ผ่านครบทุก Step?
                 YES → Document.status = Approved
                      → Notification แจ้งผู้สร้าง
                 NO  → ขยับ current_step → ส่ง Notification ผู้อนุมัติ Step ถัดไป
```

### 6.3 Running Number Logic
```
สร้างเอกสารใหม่:
  1. ดึง RunningNumber ของ document_type
  2. ตรวจ last_reset_year vs ปีปัจจุบัน
     - ถ้าปีใหม่ → reset current_number = 0, อัปเดต last_reset_year
  3. current_number + 1
  4. Format: {prefix}-{YYYY}-{padded_number}
     เช่น PR-2026-0001, BK-2027-0001 (รีเซ็ตใหม่)
  5. อัปเดต current_number ใน DB
```

### 6.4 AuditLog Details Structure
```json
{
  "oldState": { "status": "Draft", "title": "เดิม" },
  "newState": { "status": "Pending", "title": "เดิม" },
  "extra": { "ip": "192.168.1.1", "note": "กดส่งอนุมัติ" }
}
```

---

## 7. API Endpoints (NestJS Backend — port 4000)

### Auth
```
POST /auth/login                → คืน JWT (set httpOnly Cookie)
POST /auth/forgot-password      → ส่ง reset link ทาง Email
POST /auth/reset-password       → ตั้งรหัสผ่านใหม่ด้วย token
```

### Documents
```
GET    /documents               → list (filter: status, type, date) + pagination
POST   /documents/upload        → multipart/form-data → Multer → DB + File Server
GET    /documents/:id           → detail + versions
PATCH  /documents/:id           → แก้ไข (Draft เท่านั้น)
DELETE /documents/:id           → Soft Delete (is_deleted=true) ห้าม DELETE จริง
GET    /documents/:id/download  → stream ไฟล์ล่าสุด
GET    /documents/:id/versions  → list ทุก version
```

### Forms
```
POST   /pr-forms                → สร้าง PR form + items
GET    /pr-forms/:documentId    → ดึง PR form
PUT    /pr-forms/:id            → แก้ไข (เหมือนกันสำหรับ /po-forms, /bk-forms)
```

### Workflows
```
POST   /workflows/:id/submit    → Submit Draft → Pending + สร้าง Workflow
POST   /workflows/:id/approve   → Approve step + ฝัง E-Signature (Transaction)
POST   /workflows/:id/reject    → Reject + comment
GET    /workflows/:documentId   → สถานะ workflow ของเอกสาร
```

### Notifications
```
GET    /notifications           → list ของ user ปัจจุบัน (filter: is_read)
PATCH  /notifications/:id/read  → อัปเดต is_read=true, read_at=now()
```

### Admin
```
GET/POST/PATCH /admin/users          → CRUD users (Soft Delete: is_active=false)
GET/POST/PATCH /admin/roles          → CRUD roles
GET/POST/PATCH /admin/departments    → CRUD (Soft Delete: is_active=false)
GET/POST/PATCH /admin/document-types → CRUD
GET/POST/PATCH /admin/approval-matrix → ตั้งค่า Matrix ต่อประเภทเอกสาร
GET/POST/PATCH /admin/running-numbers → ตั้งค่า Running Number
GET            /audit-logs           → query + filter
GET            /dashboard/stats      → COUNT เอกสารแยก status
GET            /admin/reports        → รายงานสรุป
```

---

## 8. TypeScript Types (LOCKED — `client/src/models/index.ts`)

```typescript
// Document Status — ตรงตาม Prisma Enum
type DocumentStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Cancelled";

// ประเภทเอกสาร (ใช้ภาษาไทยใน UI, ใช้ prefix ใน DB)
type DocumentTypeLabel = "PR" | "PO" | "บันทึก" | "Other";
type DocFormTypeKey    = "PR" | "PO" | "BK" | "OTHER"; // ← ใช้ใน DB/API

// Form Style (ใน Master Data UI)
type FormTypeStyle = "PR-style" | "PO-style" | "BK-style" | "OTHER-style";

// Roles
type UserRole = "Administrator" | "Executive" | "Manager" | "Employee";

// Workflow
type WorkflowStatus = "Pending" | "Approved" | "Rejected";

// Permissions
type PermissionModule = "Document" | "User" | "Workflow" | "Master Data" | "Audit Log";
type PermissionAction = "View" | "Create" | "Edit" | "Delete" | "Approve";
```

---

## 9. Business Rules (LOCKED)

### Soft Delete — ห้ามลบจริงเด็ดขาด
| ตาราง | ฟิลด์ที่ใช้ |
|-------|------------|
| `documents` | `is_deleted = true` |
| `users` | `is_deleted = true` |
| `departments`, `positions`, `document_types`, `roles` | `is_active = false` |

### Document Lifecycle
1. สร้าง → `Draft`
2. Submit → `Pending` + สร้าง Workflow + ส่ง Notification Step 1
3. Approve ทีละ Step → ขยับ `current_step`
4. ครบทุก Step → `Approved` + Notification ผู้สร้าง
5. Reject Step ใดก็ได้ → `Rejected` + Email + Notification

### Approval Workflow Rules
1. **ห้ามมีปุ่ม Add/Remove Step ในหน้าสร้างเอกสาร** (PR, PO, BK, Other)
2. จำนวน Step + Role มาจาก ApprovalMatrix ใน Master Data เท่านั้น (Read-only)
3. ผู้ขอสามารถกำหนดเฉพาะ **ชื่อบุคคล (approver_id)** ในแต่ละ Step ที่ระบบดึงมา

### E-Signature & Transaction Safety
- ทุกการฝัง E-Sign ต้องใช้ Prisma `$transaction`
- PDF-LIB เซฟไฟล์ชั่วคราวก่อน → อัปเดต DB → ย้ายไฟล์ไปตำแหน่งจริง
- หาก DB fail → ลบไฟล์ชั่วคราวทิ้ง (ไม่มีขยะ)

### PR Form Calculation
```
total_price = quantity × unit_price
total_amount = SUM(total_price ทุก item)
```

### PO Form Calculation
```
total_price = quantity × unit_price × (1 + vat/100)
total_amount = SUM(total_price ทุก item)
VAT default = 7%
```

---

## 10. Design System

### Document Type Badge Colors
```typescript
PR:    "bg-blue-50 text-blue-700 border-blue-200"
PO:    "bg-purple-50 text-purple-700 border-purple-200"
BK:    "bg-amber-50 text-amber-700 border-amber-200"
Other: "bg-gray-50 text-gray-600 border-gray-200"
```

### Status Badge Colors
```typescript
Draft:     "bg-gray-100 text-gray-600 border-gray-200"
Pending:   "bg-amber-50 text-amber-700 border-amber-200"
Approved:  "bg-green-50 text-green-700 border-green-200"
Rejected:  "bg-red-50 text-red-700 border-red-200"
Cancelled: "bg-slate-100 text-slate-500 border-slate-200"
```

### CSS Tokens (globals.css)
```css
--color-sidebar-bg:        #0f172a
--color-sidebar-hover:     #1e293b
--color-sidebar-active:    #1d4ed8
--color-sidebar-text:      #94a3b8
--color-surface:           #ffffff
--color-surface-secondary: #f8fafc
--color-border:            #e2e8f0
```

---

## 11. Implementation Rules — DO / DON'T

### ✅ DO
- เขียนโค้ดทั้งหมดใน `D:\Document Management\dms\` เท่านั้น
- ใช้ **Server Components** เป็น default
- ใช้ **`async/await params`** ใน Next.js 16
- ใช้ **`cn()`** จาก `@lib/utils` ทุกครั้ง
- ใช้ **lucide-react** สำหรับ icon ทุกตัว
- ใช้ **Tailwind CSS v4** (`@import "tailwindcss"`)
- ใช้ **Soft Delete** เสมอ — ห้าม DELETE จริง
- ใช้ **UUID** สำหรับทุก Primary Key
- ใช้ **Prisma `$transaction`** ทุกครั้งที่มี PDF + DB พร้อมกัน
- บันทึก **AuditLog** ทุก action ที่ Backend
- เก็บ AuditLog.details แบบ `{ oldState, newState, extra }` เสมอ
- อ้างอิง Types ทั้งหมดจาก `@models` เท่านั้น

### ❌ DON'T
- ห้ามเขียนโค้ดนอก `D:\Document Management\dms\`
- ห้ามแตะโฟลเดอร์ `dms-backend/` หรือ `document-management-system/`
- ห้ามใช้ `Pages Router` (`pages/` directory)
- ห้ามใช้ `@tailwind base/components/utilities`
- ห้ามใช้ `params.id` แบบ sync ใน Next.js 16
- ห้ามใช้ icon library อื่นที่ไม่ใช่ `lucide-react`
- ห้าม DELETE record จริง (ใช้ is_deleted / is_active)
- ห้ามใช้ `localStorage` เก็บ JWT (ใช้ httpOnly cookie)
- ห้าม Hardcode role ใน Backend
- ห้าม UPDATE/DELETE `audit_logs`
- ห้ามใช้ `any` ใน TypeScript โดยไม่มีเหตุผล
- ห้ามทำ Out-of-Scope:
  - Mobile App / SSO / ERP Integration
  - Digital Signature (CA Certificate มาตรฐาน)
  - OCR / AI
  - Multi-company / Multi-language
  - Data Migration จากระบบเก่า

---

## 12. Phase Sequence (ทำตามลำดับ — ห้ามข้าม)

```
Phase 1: Core Document
  1.1 Layout + Sidebar + Topbar                       ✅ Done
  1.2 Document List + Detail + Version History        ✅ Done
  1.3 Upload + PRForm + POForm + BKForm               ✅ Done (UI)

Phase 2: Workflow + E-Signature
  2.1 Master Data UI (DocTypes, ApprovalMatrix, RunningNumber) ✅ Done (UI)
  2.2 Workflow Engine (Submit → Steps → Approve/Reject)
  2.3 Approval Task Page + PDF Viewer + E-Signature Drag&Drop

Phase 3: Auth + Admin + Dashboard
  3.1 Login / Forgot Password / Reset Password
  3.2 User Management + Role & Permission
  3.3 Dashboard Stats + Charts + Audit Logs + Reports

Phase BE: Backend Integration
  - เชื่อม Axios (controllers/services/) กับ NestJS API
  - JWT Auth + Middleware protection
  - Real DB (PostgreSQL + Prisma migrate)
```

---

## 13. Current Status (อัปเดต 2026-07-24)

- **Monorepo**: `D:\Document Management\dms\` — ✅ Ready
- **Frontend Dev**: `npm run dev --workspace=client` → `http://localhost:3000`
- **Backend Dev**: `npm run start:dev --workspace=server` → `http://localhost:4000`
- **Both**: `npm run dev` (root) → รัน concurrently
- **Phase 1-2.1**: UI เสร็จ (Mock Data)
- **Phase 2.2+**: รอ Backend พร้อม
- **Prisma Schema**: อัปเดตล่าสุด — มี updated_at ทุกตาราง, approver_id Nullable, read_at, last_reset_year
