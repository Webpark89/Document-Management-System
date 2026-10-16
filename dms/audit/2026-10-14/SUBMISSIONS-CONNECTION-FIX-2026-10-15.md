# แก้ HTTP 500 หน้า My Submissions — 15 ตุลาคม 2026

ข้อความเดิม `ไม่สามารถเชื่อมต่อกับ server ได้` มาจาก client ที่เปลี่ยน HTTP 5xx ทุกกรณีเป็นข้อความการเชื่อมต่อ ทำให้ไม่เห็นข้อผิดพลาดจริง

## สาเหตุและการแก้

- Request ที่ผิดพลาดคือ `GET /api/documents?limit=200&page=1` โดย backend บันทึก `PrismaClientKnownRequestError`, code `GenericFailure` ที่ `document.findMany`.
- Query เดิม include ข้อมูลผู้สร้างและผู้อนุมัติทั้งหมด รวม `signature_encrypted` ขนาดราว 2–3 MB ต่อบัญชี ข้อมูลเดิม 127 เอกสารทำให้ดึงลายเซ็นผู้สร้างซ้ำ 261,551,944 bytes และผู้อนุมัติซ้ำ 408,120,036 bytes รวม 669,671,980 bytes ก่อนนับข้อมูลอื่น
- Query รายการใช้ `select` เฉพาะข้อมูลผู้ใช้ที่แสดงได้ และ metadata ของเวอร์ชัน ไม่โหลด password hash, signature, PDF bytes หรือ snapshot ทั้งก้อน
- ค่า `has_file` ยังอ้างอิงไฟล์จริงด้วย `octet_length` ในฐานข้อมูล โดยไม่ส่งไฟล์ออกมาพร้อมรายการ
- รายละเอียดเอกสาร ประวัติเวอร์ชัน และดาวน์โหลดใช้เส้นทางเดิม จึงยังโหลด snapshot/ไฟล์เมื่อเปิดเอกสาร
- Client แสดงข้อความจาก backend พร้อมเก็บ HTTP status/method/path ใน `ApiError`; GET ลองใหม่แบบจำกัดเมื่อเชื่อมต่อไม่ได้หรือ proxy ยังไม่พร้อม คำสั่งสร้าง/แก้ไข/อนุมัติไม่ลองส่งซ้ำอัตโนมัติ
- My Submissions แสดงข้อผิดพลาดและปุ่มโหลดอีกครั้ง แทนการแสดงรายการว่างเมื่อโหลดไม่สำเร็จ
- Backend บันทึกตำแหน่ง exception; ในโหมดพัฒนาเก็บรายการล่าสุดใน `.local/last-api-error.json` ซึ่งถูก ignore ใน Git และไม่เก็บ Prisma query arguments หรือ token

## การตรวจยืนยัน

- TypeScript server/client: ผ่าน (`tsc --noEmit --incremental false`)
- `npm run test:api-client`: 14/14 ผ่าน
- PostgreSQL + Nest HTTP integration: การทำงาน 30 กรณีผ่าน รวม regression ใหม่ 200 เอกสารที่มี profile signature 3 MB และ snapshot ขนาดใหญ่ รายการตอบ 200, payload ต่ำกว่า 2 MB, ไม่พบ signature/credential และ `has_file` ถูกต้อง
- ผลรวมของรอบ integration เป็น **30 ผ่าน / 1 ไม่ผ่าน** เพราะ check ที่เทียบจำนวนข้อมูลจริงก่อน/หลังพบ documents 127 → 128 และ versions 252 → 254; users คงเดิม 8 จึงไม่รายงานว่าจำนวนข้อมูลจริงไม่เปลี่ยนระหว่างรอบนี้ อาจมีการใช้งานระบบจริงพร้อมกัน แต่การเทียบจำนวนอย่างเดียวระบุผู้เปลี่ยนข้อมูลไม่ได้
- ชุดทดสอบใช้ schema `codex_flow_1792033520790_f008fe` แยกจาก public; connection สำหรับนับข้อมูลจริงใช้ transaction แบบ READ ONLY และ cleanup ลบเฉพาะชื่อ scratch schema ที่ผ่านการตรวจรูปแบบ
- Backend พอร์ต 4000 และ proxy พอร์ต 3000 ตอบ 401 ตามคาดสำหรับ `/api/auth/me` ที่ไม่มี session หลัง backend โหลดโค้ดใหม่

ผล integration ฉบับเต็มอยู่ใน `verification/e2e-results.json` การทดสอบ API client อยู่ใน `scripts/verify-api-client.cjs` และ regression ฐานข้อมูลอยู่ใน `scripts/verify-flow-e2e.cjs`

## เพิ่มการแก้ flow หลังสร้างเอกสาร

จากภาพหน้าเอกสารที่แจ้ง `server ยังไม่พร้อมใช้งาน` แต่แสดง `ไม่พบเอกสารนี้` และ log พบ `ECONNREFUSED`/`ECONNRESET` ระหว่าง backend ในโหมด watch รีสตาร์ต:

- แยก HTTP 404, 403 และการโหลดผิดพลาดออกจากกัน พร้อมปุ่มโหลดเอกสารอีกครั้ง และยกเลิกการอัปเดต state จาก request เก่าหลังเปลี่ยนหน้า
- ใช้ workflow จาก response รายละเอียดเอกสารเดียวกัน เพื่อลด request ซ้ำและไม่ให้เอกสาร/สายอนุมัติมาจากคนละช่วงเวลา การส่งอนุมัติใหม่จะโหลดสถานะจริงอีกครั้ง
- GET รองรับการลองใหม่สูงสุด 5 ครั้งเมื่อการเชื่อมต่อหลุด; คำสั่งเขียนไม่ส่งซ้ำอัตโนมัติ
- Proxy timeout เพิ่มจาก 30 เป็น 120 วินาที ให้มากกว่าเวลารอ transaction และสร้าง PDF ของ backend
- ล็อกการกดบันทึกตั้งแต่ก่อนเปิดกล่องยืนยัน และเก็บข้อมูลในฟอร์มเมื่อส่งอนุมัติไม่สำเร็จ
- เพิ่ม `client_request_id` แบบ UUID v4 สำหรับคำขอสร้างเอกสาร ทั้ง JSON และ multipart โดยใช้ advisory lock และ ID เอกสารเดิมเพื่อกันคำขอซ้ำ ไม่ต้องเปลี่ยน schema ฐานข้อมูล
- เมื่อไม่ทราบผลการบันทึกเพราะ response หลุด การกดลองใหม่จะค้นหาฉบับเดิมก่อน ถ้ายังเป็น Draft/Returned จะแก้ฉบับเดิม ถ้าส่งไปแล้วจะเปิดรายละเอียดโดยไม่ส่งซ้ำ และจะไม่สร้างใหม่หาก lookup ยังติดต่อ server ไม่ได้
- ตัวสร้าง UUID ใช้ `crypto.getRandomValues` เพื่อรองรับเว็บที่เปิดด้วย HTTP ผ่าน IP ภายใน LAN

### ผลตรวจรอบสุดท้าย

- **PostgreSQL + Nest HTTP integration: 33/33 ผ่าน** รวมคำขอสร้างพร้อมกัน, replay หลังส่งอนุมัติ, การป้องกันบัญชีอื่นใช้ request ID เดียวกัน, UUID validation, multipart retry และรายการ 200 เอกสารที่มีลายเซ็น 3 MB
- **API client และการกู้ flow หลัง response หลุด: 22/22 ผ่าน**
- **TypeScript server/client: ผ่าน**
- **Next.js production build (webpack): ผ่าน** ใช้ dist แยกจาก dev server แล้วคืนค่า config/type reference และลบ build ชั่วคราว
- รอบสุดท้ายใช้ scratch schema `codex_flow_1792034297342_9b41ee`; ข้อมูลจริงก่อน/หลังเท่ากัน: documents 129, versions 256, users 8
- เปลี่ยน check การแยกฐานข้อมูลให้ยืนยัน `current_schema()` ของ application และ `transaction_read_only=on` ของ connection ตรวจข้อมูลจริง แทนการใช้จำนวนแถวเท่ากันเป็นหลักฐานเพียงอย่างเดียว เพราะระบบจริงอาจมีการใช้งานระหว่างทดสอบ
- เก็บผลรอบก่อนหน้าไว้ใน `verification/submissions-first-recheck.json` และ `verification/stability-first-recheck.json` รอบหลังมี fixture ใช้ token ที่ถูกเคส reset-password เพิกถอนไปแล้ว จึงแก้เป็นบัญชีทดสอบอื่นแล้วรันทุกรายการใหม่จนผ่าน

ไม่ได้อ้างว่าได้ทดสอบ UI ผ่าน session บัญชีจริงโดยอัตโนมัติ ผลข้างต้นเป็นการตรวจ API, โค้ด client และ production build
