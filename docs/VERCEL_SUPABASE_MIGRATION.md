# Migration Guide: Codespaces -> Vercel + Supabase

เอกสารนี้สรุปแนวทางย้ายระบบจาก `Docker + MySQL` ไปเป็น `Vercel + Supabase` โดยลด downtime และลดความเสี่ยงจากการแก้ใหญ่ครั้งเดียว

## สถานะปัจจุบันของโค้ด

- Backend ยังใช้ `mysql2` และ raw SQL (`backend/borrow-system-backend.js`)
- เพิ่มโครงสร้างให้ Vercel deploy ได้แล้ว (`vercel.json`, `api/index.js`)
- เพิ่ม `backend/db-client.js` เพื่อสลับ `DB_CLIENT=mysql|postgres` ได้
- ยังไม่จบการย้าย DB engine ไป Postgres/Supabase ในระดับ query

## สิ่งที่ต้องรู้ก่อนย้าย

- Supabase ใช้ PostgreSQL (ไม่ใช่ MySQL)
- SQL syntax บางส่วนไม่เหมือนกัน (`NOW()`, backticks, LIMIT/OFFSET patterns บางจุด)
- Vercel file system เป็น ephemeral
  - ห้ามพึ่ง local uploads ถาวร
  - ควรย้ายไฟล์ไป Supabase Storage

## แผนย้ายแบบปลอดภัย

1. Deploy backend เดิมขึ้น Vercel ก่อน (ยังใช้ฐานข้อมูลเดิมชั่วคราว)
2. สร้าง Supabase project และ migrate schema + data
3. แปลง query จาก MySQL -> Postgres ทีละโมดูล
4. ย้าย uploads ไป Supabase Storage
5. สลับ production traffic ไป Supabase เต็มรูปแบบ

## ขั้นที่ 1: Deploy ไป Vercel

ไฟล์ที่เตรียมไว้แล้ว:
- `vercel.json`
- `api/index.js`
- `backend/.env.vercel.example`

ตั้งค่า Environment Variables ใน Vercel ตามไฟล์ตัวอย่าง

## ขั้นที่ 2: สร้าง Supabase

1. สร้าง project ใหม่ใน Supabase
2. จดค่าเหล่านี้
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Database connection string (pooler)
3. สร้าง bucket อย่างน้อย 3 อัน
   - `borrowing`
   - `repairs`
   - `reports`

## ขั้นที่ 3: ย้าย schema/data

แนวทางแนะนำ:
1. export schema/data จาก MySQL
2. transform schema ให้เป็น Postgres (type, default, index, fk)
3. import เข้า Supabase
4. เทียบจำนวน row ทุกตารางหลัง import

ขั้นต่ำที่ต้องตรวจ:
- `items`
- `employees`
- `borrowing_logs`
- `borrowing_files`
- `repair`
- `item_repair`
- `categories`
- `admins`

## ขั้นที่ 4: แปลง backend query

ลำดับแนะนำ:
1. route อ่านข้อมูลก่อน (`GET /items`, `GET /employees`, `GET /repair`)
2. route เขียนข้อมูลที่ไม่มี transaction ซับซ้อน
3. route transaction สำคัญ (`/borrow`, `/return`, `/repair`) โดยใช้ Postgres transaction

หมายเหตุ:
- จุดที่ใช้ dynamic column (`INFORMATION_SCHEMA`) ต้องปรับ syntax เป็น PostgreSQL

## ขั้นที่ 5: ย้ายไฟล์จาก local uploads

ทำ abstraction layer สำหรับไฟล์:
- โหมด dev local: ใช้ local folder ได้
- โหมด production: อัปโหลดไป Supabase Storage แล้วเก็บ public URL ลง DB

## Deployment Checklist

- [ ] Vercel build/deploy ผ่าน
- [ ] ตั้งค่า env ครบ
- [ ] Supabase schema/data ครบและตรวจ row count แล้ว
- [ ] API สำคัญทดสอบครบ (`borrow`, `return`, `repair`, login)
- [ ] Upload/PDF/QR ใช้งานได้จริงผ่าน URL production
- [ ] CORS จำกัดเฉพาะโดเมนที่ใช้งานจริง
