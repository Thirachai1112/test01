# Vercel Deploy Checklist

เอกสารนี้ใช้ตรวจความพร้อมก่อน/หลัง deploy ขึ้น Vercel สำหรับโปรเจกต์ปัจจุบัน

## 1) Environment Variables (Vercel Project Settings)

ตั้งค่าอย่างน้อยดังนี้

- `NODE_ENV=production`
- `PUBLIC_BASE_URL=https://<your-vercel-domain>`
- `DB_CLIENT=postgres`
- `DATABASE_URL=postgresql://...` (Supabase pooler)
- `DB_SSL=true`
- `STORAGE_MODE=supabase`
- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `SUPABASE_BUCKET_BORROWING=borrowing`
- `SUPABASE_BUCKET_REPAIRS=repairs`
- `SUPABASE_BUCKET_REPORTS=reports`
- `SUPABASE_BUCKET_QRCODES=qrcodes`
- `SUPABASE_BUCKET_UPLOADS=uploads`

## 2) Supabase Storage Buckets

สร้าง buckets ให้ครบ

- `borrowing`
- `repairs`
- `reports`
- `qrcodes`
- `uploads`

ถ้าใช้ public URL แบบปัจจุบัน ให้ตั้ง bucket เป็น public

## 3) Routing Expectations

- `/` -> `Default.html`
- `/frontend/admin/status_repair.html` ต้องเปิดได้
- `/api/*` ต้องเข้าผ่าน `api/index.js`

## 4) Post-Deploy Smoke Test

ก่อนรัน smoke test ให้ตรวจ env ที่เครื่อง local (หรือใน shell ที่ export env ชุดเดียวกับ Vercel) ด้วย:

```bash
bash scripts/check_vercel_env.sh
```

ถ้าต้องการ push env จาก shell ปัจจุบันขึ้น Vercel โดยตรง:

```bash
bash scripts/push_vercel_env.sh production
```

หรือใช้ one-shot script (link + env check + env push + deploy):

```bash
bash scripts/deploy_vercel.sh production
```

ใช้สคริปต์:

```bash
bash scripts/smoke_vercel.sh https://<your-vercel-domain>
```

## 5) Manual Functional Checks

- เข้า admin login และ login สำเร็จ
- เปิดหน้าสถานะซ่อมและโหลดรายการได้
- ทดสอบอัปโหลดไฟล์ 1 รายการใน flow ยืมหรือแจ้งซ่อม
- เปิดลิงก์ไฟล์ที่อัปโหลดได้จากหน้าเว็บ
- ทดสอบสร้าง QR code ของ item แล้วเปิดรูป QR ได้

## 6) Known Risk

- โค้ด backend ยังเป็นโครงสร้างไฟล์ใหญ่ (single file) และมี SQL จำนวนมาก
- แม้รองรับ Postgres แล้ว แต่ยังควรทดสอบ endpoint สำคัญทุกจุดก่อน production cutover
