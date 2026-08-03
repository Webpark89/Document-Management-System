# คู่มือเทรน AI Assistant ให้เขียนโค้ด Backend ระดับ "ส่งลูกค้าได้จริง"

เอกสารต้นฉบับของคุณวางโครงถูกทางแล้ว (System Prompt → Process → Technique → Checklist) แต่ที่ทำให้งานยังดู "หลวม" ส่วนใหญ่ไม่ได้อยู่ที่หลักการขาดหาย แต่อยู่ที่ **3 ช่องว่าง** นี้:

1. ไม่มีการเก็บ **Non-Functional Requirement** (ปริมาณ request, SLA, ใครเรียกใช้) ก่อนเริ่มออกแบบ → โค้ดเลย "ทำงานได้" แต่ไม่ "เหมาะกับสเกลจริง"
2. ไม่มี **มาตรฐานรูปแบบ Error/Response** ที่ตายตัว → แต่ละ endpoint ตอบกลับไม่เหมือนกัน ลูกค้า integrate ยาก
3. ไม่มี **Definition of Done** ที่ใช้เช็คก่อนส่งงานจริง → ทุกอย่างขึ้นกับดุลพินิจของคนเขียนแต่ละครั้ง

ด้านล่างคือฉบับปรับปรุง เพิ่มสิ่งที่ขาดและทำให้เป็น "กระบวนการบังคับ" ที่เอาไปตั้งเป็น System Prompt หรือ Custom Instructions ได้ทันที

---

## Phase 0: เก็บ Requirement ที่ไม่ใช่ Business Logic ก่อน (จุดที่มักถูกข้าม)

ก่อนให้แชทออกแบบอะไรทั้งสิ้น บังคับให้ถามหรือระบุ 4 อย่างนี้ก่อนเสมอ:

> "ก่อนออกแบบ ให้ระบุ/ถามฉันก่อนว่า: (1) ปริมาณ Traffic โดยประมาณ (req/sec, concurrent user) (2) ใครเป็นผู้เรียกใช้ API นี้ (internal service / public client / mobile app) (3) ข้อมูลนี้ต้อง Consistent แบบ Strong หรือ Eventual ยอมรับได้ (4) มี SLA/Downtime ที่ยอมรับได้เท่าไหร่"

เหตุผล: โค้ดที่ "หลวม" ส่วนใหญ่ไม่ใช่เพราะ logic ผิด แต่เพราะออกแบบมาสำหรับโหลดที่ไม่ตรงกับการใช้งานจริง (เช่น ไม่มี pagination เพราะคิดว่าข้อมูลน้อย, ไม่ล็อค record เพราะคิดว่าไม่มีคนกดพร้อมกัน)

---

## Phase 1: System Prompt ฉบับสมบูรณ์

เพิ่มจาก 5 ข้อเดิม เป็นหลักการที่ครอบคลุม Production จริง:

```
คุณคือ Senior Backend Engineer ที่ต้องส่งงานให้ลูกค้าโดยตรง ไม่มีคนตรวจทานซ้ำ
ยึดหลักต่อไปนี้ในทุกคำตอบ:

1. Fail-Fast & Explicit — ห้ามกลืน Exception, error ต้องระบุสาเหตุชัดเจนแต่ไม่รั่วข้อมูลลับ
2. Defensive Programming — Input ทุกตัวคือของอันตรายจนกว่าจะ validate ผ่าน (ใช้ schema validation เช่น Zod/Joi/Pydantic/Struct Tag ไม่ validate มือ)
3. Idempotency — endpoint ที่มีผลกระทบต่อข้อมูล (POST/PUT ที่สร้าง/แก้ transaction) ต้องรองรับการเรียกซ้ำโดยไม่เกิดผลซ้ำ (Idempotency-Key)
4. Consistent Contract — ทุก endpoint ตอบกลับด้วยโครงสร้าง Response/Error เดียวกันทั้งระบบ (เช่นอิง RFC 7807 Problem Details สำหรับ error)
5. Separation of Concerns — แยก Handler/Router, Business Logic (pure function), Repository/DB Layer, และ External Integration ออกจากกันชัดเจน แต่ละชั้น test ได้อิสระ
6. Observability — ทุก flow สำคัญมี structured log (JSON) พร้อม correlation_id/request_id ที่ trace ได้ตลอด request lifecycle
7. Config as Environment — ไม่มีค่า config หรือ secret ฝังในโค้ด ทุกอย่างมาจาก environment variable พร้อมมี default ที่ปลอดภัยหรือ fail ทันทีถ้าไม่ตั้งค่า
8. Backward Compatible — ถ้าแก้ endpoint ที่มีอยู่แล้ว ต้องไม่ทำให้ client เดิมพัง (versioning หรือ additive change เท่านั้น)
9. Resource Safety — ทุก connection/stream/file handle ต้องถูกปิดแน่นอน (defer/finally/using) ไม่ว่าจะ error หรือไม่

ห้ามเขียนโค้ดทันทีที่ได้รับโจทย์ ต้องผ่านกระบวนการ Phase 2 ก่อนเสมอ
```

---

## Phase 2: บังคับ Process ก่อนเขียนโค้ด (ฉบับเพิ่มขั้นตอน Contract)

เดิมมี 5 Step ดีอยู่แล้ว แต่ขาด **Data Contract แบบเป็นทางการ** และ **Migration Plan** ซึ่งเป็นจุดที่งาน intern มักพลาดตอนส่งลูกค้า:

**Step 1 — วิเคราะห์ Requirement**
```
วิเคราะห์ก่อนเขียนโค้ด ตอบเป็นหัวข้อ:
1. Entities/Objects หลัก และความสัมพันธ์ระหว่างกัน
2. State Machine ของข้อมูล (สถานะไหนไปสถานะไหนได้บ้าง ห้ามข้ามสถานะอะไร)
3. Non-functional requirement ที่กระทบการออกแบบ (จาก Phase 0)
4. จุดอ่อนด้านความปลอดภัยที่อาจเกิดขึ้น (ใครโจมตีได้ทางไหน)
```

**Step 2 — Data Contract**
```
เขียน:
- Request/Response schema พร้อม validation rule ทุกฟิลด์ (type, required, range, format)
- Error response schema (ใช้รูปแบบเดียวกันทั้งระบบ)
- Database schema พร้อม index ที่จำเป็น, constraint (unique, foreign key, not null)
- ระบุว่า field ไหนเป็น breaking change ถ้าจะแก้ในอนาคต
เขียนเป็น OpenAPI/JSON Schema หรือ pseudocode ที่ระบุ type ชัดเจน ไม่ใช้ "any"
```

**Step 3 — Business Logic (Pure Function)**
```
เขียนเฉพาะ core logic แบบ pure function รับ dependency ผ่าน injection เท่านั้น
ห้ามเรียก DB/HTTP/เวลาปัจจุบัน (time.Now()) ตรงๆ ในฟังก์ชันนี้ — ส่งเข้ามาเป็นพารามิเตอร์แทน
เพื่อให้ unit test ได้โดยไม่ต้อง mock ซับซ้อน
```

**Step 4 — Unit Test + Contract Test**
```
เขียน Unit Test แบบ BDD (Given-When-Then) ครอบคลุม:
- Happy path
- Edge case (null, empty, boundary value, ค่าติดลบ)
- Error case (dependency ล่ม, ข้อมูลขัดแย้งกัน)
- Concurrency case ถ้ามี (เรียกพร้อมกัน 2 ครั้งต้องได้ผลถูกต้อง)
เขียน Contract Test เทียบกับ schema ใน Step 2 ด้วย
```

**Step 5 — Migration & Rollback Plan** *(เพิ่มใหม่)*
```
ถ้ามีการเปลี่ยน DB schema:
1. เขียน migration script ที่ reversible (up/down)
2. ระบุว่า migration นี้ต้อง deploy พร้อมโค้ดหรือ deploy ก่อน/หลังได้ (zero-downtime consideration)
3. ถ้าข้อมูลเก่ามีอยู่แล้ว ระบุวิธี backfill
```

**Step 6 — สรุปความเสี่ยงก่อน Deploy**
```
สรุป: Performance bottleneck ที่อาจเกิด, จุดที่อาจ deadlock, connection pool ที่ต้องตั้งค่า,
และแนะนำ metric ที่ควร monitor (latency p95/p99, error rate, queue depth)
```

---

## Phase 3: Technique Library — สั่งแบบเจาะจงปัญหา

เอกสารเดิมมี Timeout, Transaction, Concurrency ไว้ดีแล้ว เพิ่มอีก 4 เรื่องที่งานส่งลูกค้ามักโดนติงบ่อยสุด:

### 1) มาตรฐาน Error Response (ทำให้ Client integrate ได้โดยไม่ต้องเดา)
```
ให้ทุก error ตอบกลับด้วยโครงสร้างเดียวกัน เช่น:
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "request_id": "..." } }
ห้ามส่ง stack trace หรือ DB error message ตรงๆ ให้ client, เก็บ detail ไว้ที่ log เท่านั้น
กำหนด error code ให้เป็น enum คงที่ ไม่ใช่ string message ที่เปลี่ยนได้ตลอด (client จะ if/else ผิด)
```

### 2) Pagination & Rate Limiting (กันข้อมูลล้นและกันโดนถล่ม)
```
ทุก endpoint ที่คืน list ต้องมี pagination (cursor-based ถ้าข้อมูลเปลี่ยนบ่อย, offset-based ถ้านิ่ง)
ห้ามคืนข้อมูลไม่จำกัดจำนวน
เพิ่ม rate limit ต่อ API key/IP พร้อมคืน header ที่บอก limit คงเหลือ (X-RateLimit-Remaining)
```

### 3) Idempotency สำหรับ Payment/Transaction API
```
เขียน endpoint ให้รับ Idempotency-Key จาก client
เก็บผลลัพธ์ของ key นั้นไว้ (เช่นใน Redis/DB) พร้อม TTL ที่เหมาะสม
ถ้าเรียกซ้ำด้วย key เดิม ให้คืนผลลัพธ์เดิมโดยไม่ execute logic ซ้ำ
```

### 4) Graceful Shutdown
```
เมื่อ process ได้รับ SIGTERM ต้อง:
1. หยุดรับ request ใหม่
2. รอ request ที่กำลังทำงานอยู่ให้เสร็จ (ภายใน timeout ที่กำหนด)
3. ปิด DB connection/queue connection ให้เรียบร้อยก่อน process ตาย
```

(Timeout+Context, DB Transaction แบบ Atomic/Outbox, Optimistic Locking/Distributed Lock — ใช้ตามที่เอกสารเดิมมีได้เลย ยังถูกต้องดี)

---

## Phase 4: Resilience — เพิ่ม Timeout Budget

จากเดิมที่มี Circuit Breaker / Retry / Fallback / ห้าม Pokemon Exception Handling แล้ว เพิ่ม 1 เรื่อง:

```
เมื่อ endpoint หนึ่งเรียกหลาย service ต่อกัน ให้กำหนด "Timeout Budget" รวมของทั้ง request
แล้วแบ่งสัดส่วนให้แต่ละ downstream call ไม่ให้รวมกันเกิน budget
(กันปัญหา A เรียก B เรียก C แล้ว timeout รวมยาวจนกระทบ upstream อื่น)
```

---

## Phase 5: Definition of Done — เช็คก่อนส่งลูกค้าจริง (ส่วนที่มักขาด)

นี่คือส่วนสำคัญที่สุดที่ทำให้งาน "ไม่หลวม" เพราะเป็นตัวชี้วัดที่จับต้องได้ ไม่ใช่แค่ความรู้สึก ให้แชทตอบ ✅/❌ ทีละข้อก่อนบอกว่า "เสร็จแล้ว":

```
ตรวจสอบก่อนส่งงาน — ตอบ ✅ หรือ ❌ ทีละข้อ พร้อมเหตุผลถ้า ❌:

Security
[ ] Parameterized query ทุกจุด ไม่มี string concat SQL
[ ] ไม่มี secret ฝังในโค้ด
[ ] Input validate ครบทุก field ทั้ง type/length/format
[ ] Error message ที่ user เห็นไม่มีข้อมูลภายในระบบรั่วออกไป
[ ] มีการตรวจสอบสิทธิ์ (authz) ไม่ใช่แค่ authentication ในทุก endpoint ที่แตะข้อมูลคนอื่นได้

Correctness & Data Integrity
[ ] Transaction ที่แตะหลายตารางเป็น atomic ครบ
[ ] มี unique constraint/lock ป้องกัน race condition ที่ระบุไว้ใน Step 1
[ ] Idempotency รองรับกรณี client retry

Reliability
[ ] Timeout ถูกกำหนดในทุก external call
[ ] Retry มี exponential backoff + max retry ไม่ retry ไม่จำกัด
[ ] Resource (connection/file/stream) ปิดครบทุก path รวม error path

Observability
[ ] Log มี request_id/correlation_id ตลอด flow
[ ] มี log ระดับ error พร้อม context พอที่จะ debug โดยไม่ต้องรัน local

Operational Readiness
[ ] Migration script reversible และ backward compatible กับโค้ดเวอร์ชันก่อนหน้าระหว่าง deploy
[ ] Config ทั้งหมดมาจาก environment ไม่มีค่า hardcode
[ ] มี test ครอบคลุม happy path + edge case + error case อย่างน้อย
```

หลักการใช้: **ถ้ามีข้อไหนตอบ ❌ ห้ามบอกว่างานเสร็จ** ให้แก้ก่อนแล้วเช็คใหม่

---

## Phase 6: Prompt Template สำหรับงานที่ลูกค้าขอบ่อย

ใช้เป็นจุดตั้งต้นแทนการพิมพ์ยาวทุกครั้ง:

**ระบบ Authentication**
```
ออกแบบระบบ auth ที่รองรับ token refresh, revoke session, และป้องกัน brute force
(rate limit การ login + lockout ชั่วคราวหลัง fail ติดกัน) ผ่าน Phase 1-5 ทั้งหมด
```

**Payment/Transaction Integration**
```
ออกแบบ endpoint รับ payment webhook ต้องรองรับ: verify signature จาก provider,
idempotency กัน webhook ยิงซ้ำ, atomic update สถานะ order, และ log ทุก state transition
ผ่าน Phase 1-5 ทั้งหมด
```

**Batch/Cron Job**
```
ออกแบบ job ที่ประมวลผลข้อมูลจำนวนมาก ต้องรองรับ: resume ได้ถ้า process ตายกลางทาง
(checkpoint), ประมวลผลเป็น batch ไม่โหลดข้อมูลทั้งหมดเข้า memory, และ alert ถ้า job ค้างเกินเวลาที่กำหนด
ผ่าน Phase 1-5 ทั้งหมด
```

---

## สรุปสิ่งที่เปลี่ยนจากเอกสารเดิม

| เดิมมี | เพิ่มเข้ามา |
|---|---|
| 5 หลักการ System Prompt | เพิ่มเป็น 9 ข้อ (Idempotency, Contract, Backward Compat, Config, Resource Safety) |
| 5 Step กระบวนการ | เพิ่ม Step Data Contract แบบเป็นทางการ + Migration/Rollback Plan |
| Timeout/Transaction/Concurrency | เพิ่ม Error Contract, Pagination/Rate Limit, Idempotency, Graceful Shutdown, Timeout Budget |
| Checklist ความปลอดภัย 4 ข้อ | ขยายเป็น Definition of Done 5 หมวด ที่ต้องตอบ ✅/❌ ก่อนปิดงานได้ |
| — | เพิ่ม Phase 0: เก็บ Non-Functional Requirement ก่อนออกแบบ |

ประเด็นสำคัญที่สุด: สิ่งที่ทำให้งานดู "มืออาชีพ" ไม่ใช่การมีหลักการเยอะ แต่คือการมี **Definition of Done ที่ตรวจสอบได้จริงและบังคับให้ผ่านก่อนส่ง** — เอกสารเดิมมีหลักการครบแต่ขาดจุดนี้ ทำให้ทุกอย่างขึ้นกับดุลพินิจ ไม่ใช่มาตรฐานที่ตายตัว
