# แก้หน้าแดชบอร์ดว่าง — 15 ตุลาคม 2026

## สาเหตุที่พบ

บทบาท Manager/Executive/Administrator เดิมใช้ permission `dashboard:view_employee` และ `dashboard:view_executive` แต่หน้าเว็บและ backend ใหม่ตรวจ `dashboard.view_employee:view`, `dashboard.view_executive:view` และสิทธิ์ widget ย่อย ผลคือ API ถูกปฏิเสธหรือทุก widget ถูกซ่อน เหลือเพียงหัวหน้าแดชบอร์ด ขณะเดียวกันหน้าเดิมกลืน error เป็น documents ว่างและ stats null จึงไม่มีข้อความอธิบายให้ผู้ใช้

## การแก้ไข

- อ่านสิทธิ์เดิมให้เป็นรูปแบบเดียวกันทั้ง login, JWT profile, policy ฝั่ง server, หน้า role settings และ AuthProvider ฝั่ง client โดยไม่แก้ permission rows ในฐานข้อมูลจริง
- สิทธิ์เดิมที่ให้ทั้งมุมมองรองรับ widget ของมุมมองนั้น หากมีสิทธิ์รูปแบบใหม่อยู่แล้วจะใช้สิทธิ์ใหม่นั้นเป็นหลัก ไม่เติม widget ที่ผู้ดูแลปิดไว้
- ไม่อาศัยชื่อบทบาท Administrator เพื่อข้าม permission ของ widget
- รอโหลดบัญชีและสิทธิ์ก่อนเริ่ม request และโหลดใหม่ตามบัญชี/สิทธิ์ที่เปลี่ยน พร้อมป้องกันผล request เก่าทับผลใหม่
- เลือกมุมมองที่มีสิทธิ์ได้โดยไม่ต้องรอ effect เปลี่ยนมุมมองเริ่มต้น
- ไม่กลืน API error เป็นข้อมูลว่าง มีสถานะ loading, error, ปุ่มลองใหม่ และข้อความกรณียังไม่ได้ให้สิทธิ์ widget
- เมื่ออัปเดตแล้ว request ล้มเหลว จะแสดงข้อมูลครั้งล่าสุดพร้อมคำอธิบาย ใช้ข้อมูลเดิมเฉพาะบัญชีและชุดสิทธิ์เดียวกัน
- ใช้รายการเอกสารแบบแบ่งหน้าจนครบ แทนการตัดที่ 1,000 รายการ และสร้างรายการแผนกจากข้อมูลที่ผู้ใช้เห็นได้
- ปรับ default permission ใน seed ให้ใช้รูปแบบปัจจุบัน แต่ **ไม่ได้รัน seed**

## ผลตรวจ

- Dashboard regression: **12/12 ผ่าน** ครอบคลุมสิทธิ์เดิม, สิทธิ์ใหม่ที่ปิด widget, ความสอดคล้อง client/server, API failure, ข้อมูลว่างจริง และการ render Employee/Executive component กับสิทธิ์เดิม
- PostgreSQL + Nest HTTP integration: **34/34 ผ่าน** รวม login/JWT/dashboard stats/role settings สำหรับสิทธิ์เดิม และการเปลี่ยนเป็นสิทธิ์ใหม่
- API client และการกู้ flow หลัง response หลุด: **22/22 ผ่าน**
- TypeScript server/client: ผ่าน
- ESLint เฉพาะหน้า dashboard และ helper ใหม่สองไฟล์: ผ่าน ไม่มีการปิดกฎ React hooks
- Next.js production build (webpack): ผ่าน โดยใช้ dist แยกและคืนค่า tsconfig/next-env หลังตรวจ
- schema ทดสอบ: `codex_flow_1792035980648_b7bc2c`; จำนวนข้อมูลจริงก่อน/หลังเท่ากัน: documents 130, versions 258, users 8

ผล HTTP integration อยู่ใน `verification/e2e-results.json`; รัน regression เฉพาะแดชบอร์ดด้วย `npm run test:dashboard` ผล render เป็นการตรวจ component ผ่าน React server renderer ไม่ใช่การยืนยันการคลิก UI ใน session จริงของผู้ใช้
