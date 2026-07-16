---
name: dms-tech-spec
description: >
  ข้อกำหนดทางเทคนิคสำหรับโปรเจกต์ Document Management & Electronic Approval System (DMS)
  ใช้เพื่อล็อคกรอบ stack, convention, file structure, database schema, API endpoints
  และ implementation rules ให้ครบถ้วน ป้องกันการทำงานหลุดออกจากแผนที่วางไว้
---

# DMS Technical Specification — Locked Framework

> **MANDATORY**: อ่าน SKILL นี้ให้ครบก่อนเขียนโค้ดทุกครั้ง ห้ามเบี่ยงเบนจาก spec นี้
> โดยไม่ได้รับการยืนยันจาก user อย่างชัดเจน

---

## 1. Project Overview

**ชื่อโปรเจกต์**: Document Management & Electronic Approval System (DMS)  
**บริบท**: ระบบจัดการเอกสารและการอนุมัติอิเล็กทรอนิกส์ภายในองค์กร รองรับ PR/PO/ใบรับรอง  
**Workspace root**: `d:\Document Management\document-management-system\`

---

## 2. Technology Stack (LOCKED — ห้ามเปลี่ยนโดยไม่ได้รับอนุญาต)

### 2.1 Frontend (ใน workspace root)
| รายการ | Version/Detail |
|--------|---------------|
| **Framework** | Next.js **16.2.10** — App Router เท่านั้น (ห้ามใช้ Pages Router) |
| **React** | React **19.2.4** |
| **Language** | TypeScript **^5** (ห้ามใช้ `.js` `.jsx` ในโค้ดหลัก) |
| **Styling** | Tailwind CSS **v4** — ใช้ `@import "tailwindcss"` syntax (ไม่ใช่ v3 `@tailwind` directives) |
| **Icons** | `lucide-react` เท่านั้น |
| **Class merging** | `clsx` + `tailwind-merge` ผ่าน `cn()` helper ใน `src/lib/utils.ts` |
| **HTTP Client** | `axios` (เมื่อต่อ backend) |
| **PDF Viewer** | `react-pdf` (Phase 2) |
| **Charts** | `recharts` (Phase 3 — Dashboard) |
| **File Upload** | `react-dropzone` (Phase 1.3) |
| **Bundler** | Turbopack (built-in ใน Next.js 16) |

### 2.2 Backend (แยกโปรเจกต์ — ยังไม่สร้าง)
| รายการ | Detail |
|--------|--------|
| **Framework** | NestJS |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Auth** | JWT (Access Token) + bcrypt (password hash) |
| **File Upload** | Multer (รับไฟล์) → เก็บบน File Server (local path) |
| **PDF Processing** | PDF-LIB (ประทับลายเซ็นลงไฟล์ PDF จริง) |
| **Email** | Nodemailer |

---

## 3. Next.js Conventions (CRITICAL — Next.js 16 + React 19)

### 3.1 Async Props — BREAKING CHANGE จาก v14
```typescript
// ✅ CORRECT — params และ searchParams ต้องเป็น Promise เสมอ
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
}

// ❌ WRONG — อย่าเข้าถึง params แบบ sync (deprecated)
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params; // ❌ deprecated
}
```

### 3.2 CSS — TailwindCSS v4 Syntax
```css
/* ✅ CORRECT — globals.css */
@import "tailwindcss";

@theme {
  --color-primary-600: #2563eb;
}

/* ❌ WRONG — v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3.3 PageProps Helper (Next.js 16)
```typescript
// ✅ ใช้ PageProps helper สำหรับ type safety
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
}
```

### 3.4 Server vs Client Components
- **Default**: Server Component (ไม่ต้องใส่ directive)
- **Client Component**: ใส่ `"use client"` ที่บรรทัดแรกเท่านั้นเมื่อต้องการ useState, useEffect, event handlers
- **Rule**: ใช้ Client Component ให้น้อยที่สุด — Push ลงไปที่ leaf component

### 3.5 Metadata
```typescript
// ใช้ metadata template จาก root layout
import type { Metadata } from "next";
export const metadata: Metadata = { title: "ชื่อหน้า" };
// จะ render เป็น "ชื่อหน้า | DMS - ระบบจัดการเอกสาร"
```

---

## 4. File Structure (LOCKED)

```
src/
├── app/
│   ├── (auth)/                          # Route Group — ไม่มี Sidebar
│   │   ├── login/page.tsx               # Phase 3
│   │   ├── forgot-password/page.tsx     # Phase 3
│   │   └── reset-password/page.tsx      # Phase 3
│   ├── (main)/                          # Route Group — มี Sidebar + Topbar
│   │   ├── layout.tsx                   # App Shell (Sidebar)
│   │   ├── dashboard/page.tsx           # ✅ DONE
│   │   ├── documents/
│   │   │   ├── page.tsx                 # ✅ DONE — List view
│   │   │   ├── upload/page.tsx          # ✅ DONE (stub) → Phase 1.3 complete
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # ✅ DONE — Detail view
│   │   │       └── versions/page.tsx    # Phase 1.2
│   │   ├── approvals/
│   │   │   ├── page.tsx                 # ✅ DONE — Inbox
│   │   │   └── [id]/page.tsx            # ✅ DONE (stub) → Phase 2.3 complete
│   │   └── admin/
│   │       ├── users/page.tsx           # ✅ DONE (stub) → Phase 3.2 complete
│   │       ├── roles/page.tsx           # ✅ DONE (stub) → Phase 3.2 complete
│   │       ├── master-data/page.tsx     # ✅ DONE (stub) → Phase 2.1 complete
│   │       ├── running-number/page.tsx  # ✅ DONE (stub) → Phase 2.1 complete
│   │       └── audit-logs/page.tsx      # ✅ DONE (stub) → Phase 3.3 complete
│   ├── globals.css                      # ✅ DONE — TailwindCSS v4 + tokens
│   ├── layout.tsx                       # ✅ DONE — Root layout (lang="th")
│   └── page.tsx                         # ✅ DONE — Redirect → /dashboard
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                  # ✅ DONE
│   │   └── Topbar.tsx                   # ✅ DONE
│   ├── ui/
│   │   ├── Badge.tsx                    # ✅ DONE — StatusBadge, TypeBadge
│   │   ├── Button.tsx                   # Phase 1 polish
│   │   ├── Modal.tsx                    # Phase 1 polish
│   │   ├── Toast.tsx                    # Phase 1 polish
│   │   └── Table.tsx                    # Phase 1 polish
│   ├── forms/
│   │   ├── PRForm.tsx                   # Phase 1.3 — Dynamic rows, auto total
│   │   └── POForm.tsx                   # Phase 1.3 — Dynamic rows, VAT 7%
│   ├── workflow/
│   │   └── WorkflowTracker.tsx          # Phase 2.2 — Step stepper component
│   └── pdf-viewer/
│       ├── PDFViewer.tsx                # Phase 2.3 — react-pdf
│       └── SignatureOverlay.tsx         # Phase 2.3 — Canvas drag-and-drop
├── lib/
│   ├── utils.ts                         # ✅ DONE — cn()
│   ├── mock-data.ts                     # ✅ DONE — Mock data + color constants
│   └── api.ts                           # Phase BE — Axios client
├── services/
│   ├── documents.service.ts             # Phase BE
│   ├── workflows.service.ts             # Phase BE
│   ├── auth.service.ts                  # Phase BE
│   └── admin.service.ts                 # Phase BE
└── types/
    └── index.ts                         # ✅ DONE — All domain types
```

---

## 5. Database Schema (PostgreSQL + Prisma)

### Group 1 — Master Data
```sql
departments   (id UUID, name, is_active, created_at)
positions     (id UUID, name, is_active, created_at)
document_types(id UUID, type_name, prefix, is_active, created_at)
-- prefix เช่น "PR", "PO", "CERT"
-- ต้องมี signature ใน master data ด้วย
```

### Group 2 — Users & Permissions
```sql
roles           (id UUID, name, is_active)
permissions     (id UUID, module, action, description)
-- module: Document | User | Workflow | Master Data
-- action: View | Add | Edit | Delete | Export
role_permissions(role_id FK, permission_id FK)  -- Many-to-Many
users           (
  id UUID, username, email, password_hash,
  first_name, last_name,
  department_id FK, position_id FK, role_id FK,
  signature_image_path,  -- path บน File Server
  is_active, reset_token, reset_token_expiry,
  created_at, updated_at
)
```

### Group 3 — Documents & Versions
```sql
documents (
  id UUID, doc_number, title, type_id FK,
  creator_id FK→users,
  status ENUM(Draft|Pending|Approved|Rejected|Cancelled),
  is_deleted BOOLEAN,  -- Soft Delete เท่านั้น ห้าม DELETE จริง
  created_at, updated_at
)
pr_forms (
  id UUID, document_id FK (1-to-1),
  requested_date, required_date,
  requester_id FK→users, department_id FK→departments,
  purpose, total_amount
)
pr_form_items (
  id UUID, pr_form_id FK (1-to-Many),
  item_name, quantity, unit,
  unit_price, total_price, remark
)
po_forms (
  id UUID, document_id FK (1-to-1),
  vendor_name, vendor_contact,
  delivery_date, payment_terms, total_amount
)
po_form_items (
  id UUID, po_form_id FK (1-to-Many),
  item_name, quantity, unit,
  unit_price, vat DECIMAL, total_price, remark
  -- total_price = unit_price * quantity * (1 + vat/100)
)
certificate_forms (
  id UUID, document_id FK (1-to-1),
  certificate_type,
  issued_to FK→users, issued_by FK→users,
  issue_date, expiry_date, detail
)
document_versions (
  id UUID, document_id FK,
  version_number INT (1,2,3...),
  file_path, file_size, file_extension,
  uploaded_by FK→users, remarks, created_at
)
```

### Group 4 — Workflow & Support
```sql
approval_matrix (
  id UUID, document_type_id FK,
  step_order INT (1-4),
  required_role_id FK→roles
)
workflows (
  id UUID, document_id FK,
  total_steps INT, current_step INT,
  status ENUM(Pending|Approved|Rejected),
  created_at
)
workflow_steps (
  id UUID, workflow_id FK,
  step_order INT, approver_id FK→users,
  status ENUM(Pending|Approved|Rejected),
  action_date, comment,
  signature_applied BOOLEAN,
  return_to_step INT NULL  -- ถ้า Reject ย้อนไป step ไหน
)
notifications (
  id UUID, user_id FK→users, message,
  document_id FK→documents,
  is_read BOOLEAN, created_at
)
running_numbers (
  id UUID, document_type_id FK,
  prefix, year_format, current_number INT, padding_length INT
  -- Auto-increment ทุกครั้งที่สร้างเอกสาร
  -- Format: {prefix}-{year}-{padded_number} เช่น PR-2026-0001
)
audit_logs (
  id UUID, user_id FK→users,
  action ENUM(Login|Upload|Download|View|Edit|Delete|Approve|Reject|Signature),
  module, target_id, details JSONB,
  ip_address, created_at
  -- Append-only: ห้าม UPDATE หรือ DELETE ตารางนี้เด็ดขาด
)
```

---

## 6. API Endpoints (NestJS — Backend Reference)

### Auth
```
POST /auth/login              → คืน JWT token
POST /auth/forgot-password    → ส่ง reset link ทางอีเมล
POST /auth/reset-password     → ตั้งรหัสผ่านใหม่ด้วย token
```

### Documents
```
GET    /documents             → list (filter: status, type, date) + pagination
POST   /documents/upload      → multipart/form-data → Multer → File Server + DB
GET    /documents/:id         → detail + version list
DELETE /documents/:id         → Soft Delete (set is_deleted=true) ไม่ DELETE จริง
GET    /documents/:id/download → stream ไฟล์ล่าสุด
GET    /documents/:id/versions → list ทุก version
```

### Forms (PR / PO / Certificate)
```
POST   /pr-forms              → สร้าง PR form + items
GET    /pr-forms/:documentId  → ดึง PR form ของเอกสาร
PUT    /pr-forms/:id          → แก้ไข PR form
(เหมือนกันสำหรับ /po-forms และ /certificate-forms)
```

### Workflows
```
POST   /workflows/:id/approve → Approve step ปัจจุบัน + ขยับ current_step
POST   /workflows/:id/reject  → Reject + บันทึก comment + return_to_step
GET    /workflows/:documentId → สถานะ workflow ของเอกสาร
```

### Signatures
```
POST   /signatures/apply      → { documentId, x, y, page, signatureImagePath }
                              → PDF-LIB ฝังลายเซ็นลง PDF → บันทึกเป็น version ใหม่
```

### Admin
```
GET/POST/PUT /admin/users          → CRUD users
GET/POST/PUT /admin/roles          → CRUD roles
POST         /admin/roles/:id/permissions → assign permissions (granular)
GET/POST/PUT /admin/departments    → CRUD
GET/POST/PUT /admin/positions      → CRUD
GET/POST/PUT /admin/document-types → CRUD
GET/POST/PUT /admin/approval-matrix → ตั้งค่า Approval Matrix
GET/POST/PUT /admin/running-numbers → ตั้งค่า Running Number
GET          /audit-logs           → query + filter (user, module, action, date)
GET          /dashboard/stats      → COUNT เอกสารแยก status
```

---

## 7. TypeScript Types (LOCKED — src/types/index.ts)

```typescript
type DocumentStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Cancelled";
type DocumentType   = "PR" | "PO" | "Certificate" | "General";
type UserRole       = "Administrator" | "Manager" | "Employee";
// Note: Role เป็น Dynamic จาก DB — UserRole type ใช้ แค่ Mock เท่านั้น

// Workflow step status
type WorkflowStepStatus = "Pending" | "Approved" | "Rejected";

// Permission modules & actions
type PermissionModule = "Document" | "User" | "Workflow" | "Master Data" | "Audit Log";
type PermissionAction = "View" | "Add" | "Edit" | "Delete" | "Export";
```

---

## 8. Design System Constants

### Color Tokens (globals.css)
```css
--color-sidebar-bg:      #0f172a  (Slate 900)
--color-sidebar-hover:   #1e293b  (Slate 800)
--color-sidebar-active:  #1d4ed8  (Blue 700)
--color-sidebar-text:    #94a3b8  (Slate 400)
--color-surface:         #ffffff
--color-surface-secondary: #f8fafc
--color-border:          #e2e8f0
```

### Status Badge Colors (src/lib/mock-data.ts)
```typescript
Draft:     "bg-gray-100 text-gray-600 border-gray-200"
Pending:   "bg-amber-50 text-amber-700 border-amber-200"
Approved:  "bg-green-50 text-green-700 border-green-200"
Rejected:  "bg-red-50 text-red-700 border-red-200"
Cancelled: "bg-slate-100 text-slate-500 border-slate-200"
```

### Document Type Badge Colors
```typescript
PR:          "bg-blue-50 text-blue-700 border-blue-200"
PO:          "bg-purple-50 text-purple-700 border-purple-200"
Certificate: "bg-emerald-50 text-emerald-700 border-emerald-200"
General:     "bg-gray-50 text-gray-600 border-gray-200"
```

---

## 9. Business Rules (LOCKED)

### Document Lifecycle
1. สร้างเอกสาร → สถานะ `Draft`
2. กด Submit → สถานะ `Pending` + สร้าง Workflow อัตโนมัติตาม Approval Matrix
3. แต่ละ Approver ต้องผ่านตามลำดับ step (ไม่ข้ามขั้นได้)
4. Approve ครบทุก Step → `Approved`
5. Reject ที่ Step ใดก็ได้ → `Rejected` + ส่ง Notification + อีเมลกลับผู้จัดทำ
6. ลบเอกสาร → **Soft Delete** (`is_deleted = true`) เท่านั้น ห้าม DELETE จริง

### Approval Workflow Rules (หน้าสร้างเอกสาร)
1. **ห้ามมีปุ่ม Add/Remove Step ในหน้าสร้างเอกสาร (PR, PO, Cert, General)**
2. จำนวน Step และตำแหน่งผู้อนุมัติ (Role) ต้องถูกดึงมาจาก Master Data เท่านั้น (โชว์เป็น Read-only)
3. ผู้ขอเอกสารสามารถกำหนด/เปลี่ยนได้เฉพาะ **ชื่อบุคคล (Approver Name)** ในแต่ละ Step ที่ระบบดึงมาให้เท่านั้น

### E-Signature Flow
1. Approver เปิดหน้าพิจารณาเอกสาร
2. ดู PDF ใน Browser (react-pdf)
3. Drag & Drop ลายเซ็นไปวางบนตำแหน่งที่ต้องการ
4. กด "ยืนยันการลงลายเซ็น" → ส่ง `{ documentId, x, y, page }` ไป Backend
5. Backend ใช้ PDF-LIB วางลายเซ็น → บันทึกเป็น Version ใหม่
6. ระบบถือว่า Approve Step นั้นอัตโนมัติ

### Running Number
- Format: `{PREFIX}-{YEAR}-{PADDED_NUMBER}` เช่น `PR-2026-0001`
- Auto-increment ทุกครั้งที่สร้างเอกสารใหม่
- Padding default = 4 หลัก (ตั้งค่าได้โดย Admin)

### PR Form Calculation
```
total_price per item = quantity × unit_price
total_amount = SUM(all item total_price)
```

### PO Form Calculation
```
total_price per item = quantity × unit_price × (1 + vat/100)
total_amount = SUM(all item total_price)
VAT default = 7%
```

---

## 10. Authentication Rules

- JWT เก็บใน **httpOnly Cookie** (ไม่ใช่ localStorage — security)
- ทุก request ต้องแนบ JWT ใน Header: `Authorization: Bearer <token>`
- Protected routes ใช้ **Next.js Middleware** (`middleware.ts` ที่ root src/)
- Role-based: Admin เท่านั้นที่เข้าหน้า `/admin/*` ได้
- Permission-based: ตรวจ granular permission ก่อนแสดง UI button (View/Add/Edit/Delete/Export)

---

## 11. Pages Inventory (ครบ 15 หน้า)

| # | หน้า | Route | สถานะ | Phase |
|---|------|-------|-------|-------|
| 1 | Login | `/login` | Stub | Phase 3.1 |
| 2 | Forgot Password | `/forgot-password` | Stub | Phase 3.1 |
| 3 | Reset Password | `/reset-password` | Stub | Phase 3.1 |
| 4 | Document Library | `/documents` | ✅ Done | Phase 1.2 |
| 5 | Upload Document | `/documents/upload` | ✅ Stub | Phase 1.3 |
| 6 | Document Detail | `/documents/[id]` | ✅ Done | Phase 1.2 |
| 7 | Version History | `/documents/[id]/versions` | Stub | Phase 1.2 |
| 8 | Approval Inbox | `/approvals` | ✅ Done | Phase 2.2 |
| 9 | Approval Task + PDF | `/approvals/[id]` | ✅ Stub | Phase 2.3 |
| 10 | Dashboard | `/dashboard` | ✅ Done | Phase 3.3 |
| 11 | User Management | `/admin/users` | ✅ Stub | Phase 3.2 |
| 12 | Role & Permission | `/admin/roles` | ✅ Stub | Phase 3.2 |
| 13 | Master Data | `/admin/master-data` | ✅ Stub | Phase 2.1 |
| 14 | Running Number | `/admin/running-number` | ✅ Stub | Phase 2.1 |
| 15 | Audit Log | `/admin/audit-logs` | ✅ Stub | Phase 3.3 |

---

## 12. Implementation Rules (DO / DON'T)

### ✅ DO
- ใช้ **Server Components** เป็น default
- ใช้ **`async/await params`** เสมอใน Next.js 16
- ใช้ **`cn()`** จาก `src/lib/utils.ts` สำหรับ class merging ทุกครั้ง
- ใช้ **`lucide-react`** สำหรับ icon ทุกตัว
- ใช้ **Tailwind CSS v4** utilities และ CSS custom properties (`--color-*`)
- ใช้ **Soft Delete** เสมอ (`is_deleted = true`) ไม่ลบจริง
- ใช้ **UUID** สำหรับทุก Primary Key
- ใช้ **Prisma** สำหรับ ORM ฝั่ง Backend
- บันทึก **Audit Log** ทุก action ใน Backend (interceptor)
- เขียน **TypeScript** ทุกไฟล์ (ห้ามใช้ `any` โดยไม่มีเหตุผล)

### ❌ DON'T
- ห้ามใช้ `Pages Router` (`pages/` directory)
- ห้ามใช้ `@tailwind base/components/utilities` (นั่นคือ v3 syntax)
- ห้ามใช้ `params.id` แบบ sync ใน Next.js 16 (ต้อง `await params` ก่อน)
- ห้ามใช้ library icon อื่นที่ไม่ใช่ `lucide-react`
- ห้ามใช้ CSS Modules หรือ styled-components
- ห้าม DELETE record จริงในฐานข้อมูล (ใช้ `is_deleted` หรือ `is_active`)
- ห้ามใช้ `localStorage` เก็บ JWT (ใช้ httpOnly cookie)
- ห้าม Hardcode role ใน Backend — Role ต้องมาจาก DB เสมอ
- ห้ามแก้ไขหรือลบข้อมูลใน `audit_logs`
- ห้ามสร้าง component ที่ทำได้เป็น Server Component แต่กลับใช้ `"use client"`

---

## 13. Phase Sequence (ทำตามลำดับ — ห้ามข้าม)

```
Phase 1 (Core Document) → Phase 2 (Workflow + E-Sig) → Phase 3 (Auth + Admin + Charts)
                                  ↑
         ต้องทำ Phase 2.1 (Master Data) ก่อน 2.2 (Workflow Engine)
         เพราะ Approval Matrix เป็น dependency ของ Workflow
```

### ลำดับการทำงานใน Phase 1 ที่เหลือ:
1. **Phase 1.3**: PR Form + PO Form (Dynamic item rows + auto calculation)
2. **Phase 1.2**: Version History page
3. Polish: Toast, Modal, Loading skeleton, Responsive mobile

---

## 14. Current State (ณ วันที่สร้าง SKILL นี้)

- **Next.js project**: สร้างแล้วที่ `d:\Document Management\document-management-system\`
- **Dev server**: `npm run dev` → `http://localhost:3000`
- **Phase 0**: เสร็จสมบูรณ์ (structure + stub pages ทุกหน้า + mock data)
- **Phase 1.1**: เสร็จ (Project Setup + Layout + Sidebar + Topbar)
- **Phase 1.2**: บางส่วน (Document List ✅, Document Detail ✅, Version History ยังไม่ทำ)
- **Phase 1.3**: ยังไม่ทำ (PR Form, PO Form)
- **Backend**: ยังไม่เริ่ม

### Dependencies ที่ install แล้ว:
```json
{
  "dependencies": {
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "lucide-react": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

### Dependencies ที่ต้อง install เพิ่มในอนาคต:
```bash
# Phase 1.3
npm install react-dropzone

# Phase 2.3
npm install react-pdf

# Phase 3 Dashboard
npm install recharts

# Phase BE connection
npm install axios

# Phase BE (Backend)
npm install @nestjs/jwt bcrypt nodemailer
npm install pdf-lib multer
npm install prisma @prisma/client
```
