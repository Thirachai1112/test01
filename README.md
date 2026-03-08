# ระบบยืม-คืนอุปกรณ์ IT (IT Device Borrowing System)

โปรเจกต์นี้เป็นระบบจัดการการยืม-คืนอุปกรณ์ IT ภายในองค์กร ประกอบด้วย
- Backend: Node.js + Express
- Database: MySQL 8.0
- Frontend: HTML/CSS/Vanilla JavaScript
- Deployment ระดับพัฒนา: Docker Compose

---

## สารบัญ
- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [Vercel + Supabase Migration](#vercel--supabase-migration)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [Requirements](#requirements)
- [วิธีรันแบบ Docker (แนะนำ)](#วิธีรันแบบ-docker-แนะนำ)
- [วิธีรันแบบ Local (ไม่ใช้ Docker)](#วิธีรันแบบ-local-ไม่ใช้-docker)
- [การเชื่อมต่อ DBeaver](#การเชื่อมต่อ-dbeaver)
- [Environment Variables](#environment-variables)
- [การนำเข้าไฟล์ SQL Dump](#การนำเข้าไฟล์-sql-dump)
- [Font License Compliance](#font-license-compliance)
- [Troubleshooting](#troubleshooting)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)

---

## ภาพรวมระบบ

บริการหลักในโปรเจกต์:
1. `db` (MySQL 8.0)
2. `backend` (Node.js API)

พอร์ตที่ใช้งานปัจจุบัน:
- MySQL บนเครื่อง host: `13306` (แมปไปยัง container `3306`)
- Backend บนเครื่อง host: `5001` (แมปไปยัง container `5000`)

> หมายเหตุ: ก่อนหน้านี้เคยใช้พอร์ต `3306` บน host แต่มีโอกาสชนกับ MySQL ตัวอื่นในเครื่อง จึงเปลี่ยนเป็น `13306`

---

## Vercel + Supabase Migration

เริ่มต้นย้ายจาก Codespaces/Docker ไป Vercel ได้แล้วด้วยไฟล์:
- `vercel.json`
- `api/index.js`
- `backend/.env.vercel.example`

เอกสาร migration แบบเต็มอยู่ที่:
- `docs/VERCEL_SUPABASE_MIGRATION.md`
- `docs/VERCEL_DEPLOY_CHECKLIST.md`

สคริปต์ตรวจหลัง deploy:
- `scripts/check_vercel_env.sh`
- `scripts/push_vercel_env.sh`
- `scripts/deploy_vercel.sh`
- `scripts/smoke_vercel.sh`

ข้อควรทราบสำคัญ:
- backend ปัจจุบันยังใช้ `mysql2` และ SQL แบบ MySQL
- Supabase ใช้ PostgreSQL จึงต้องแปลง query/schema ก่อนใช้งานจริงเต็มรูปแบบ
- ไฟล์ใน Vercel ไม่ควรเก็บถาวรบน local disk ให้ย้ายไป Supabase Storage

---

## โครงสร้างโปรเจกต์

```text
test01/
├── docker-compose.yml
├── dump-my_database-202602111405.sql
├── backend/
│   ├── borrow-system-backend.js
│   ├── package.json
│   ├── .env
│   └── .env.docker
├── frontend/
│   ├── admin/
│   ├── Categories/
│   └── Repair/
└── public/
```

---

## Requirements

- Docker + Docker Compose (สำหรับวิธีแนะนำ)
- หรือ Node.js 20+ และ MySQL 8.0+ (สำหรับรันแบบ local)
- npm
- DBeaver (ถ้าต้องการจัดการ DB ผ่าน GUI)

---

## วิธีรันแบบ Docker (แนะนำ)

### 1) เริ่มบริการ

```bash
cd /workspaces/test01
docker compose up -d
```

### 2) ตรวจสอบสถานะ

```bash
docker compose ps
```

คาดหวังผลลัพธ์:
- `db` เป็น `healthy`
- `backend` เป็น `Up`

### 3) ทดสอบ Backend

เปิดในเบราว์เซอร์:
- `http://localhost:5001`

หรือเรียก API จาก frontend ด้วย base URL เดียวกัน

---

## วิธีรันแบบ Local (ไม่ใช้ Docker)

> ใช้กรณีต้องการรัน backend ตรงจากเครื่อง dev

### 1) เตรียมฐานข้อมูล

หากใช้ MySQL จาก Docker ของโปรเจกต์นี้ ให้ใช้ host/port:
- Host: `127.0.0.1`
- Port: `13306`

### 2) ตรวจสอบไฟล์ `backend/.env`

ค่าที่ควรเป็นสำหรับ local ตอนนี้:

```env
DB_HOST=127.0.0.1
DB_PORT=13306
DB_USER=root
DB_PASSWORD=password123
DB_NAME=my_database
PORT=5000
SERVER_IP=localhost
```

### 3) ติดตั้งและรัน backend

```bash
cd /workspaces/test01/backend
npm install
npm start
```

เมื่อรันสำเร็จ backend จะฟังที่พอร์ต `5000` (local process)

---

## การเชื่อมต่อ DBeaver

ตั้งค่า Connection (MySQL):
- Host: `127.0.0.1`
- Port: `13306`
- Database: `my_database`

บัญชีพื้นฐานจาก `docker-compose.yml`:
- User: `root`
- Password: `password123`

หรือผู้ใช้ทั่วไป:
- User: `user_name`
- Password: `user_password`

> สำคัญมาก: ช่อง Port ใน DBeaver ต้องเป็น `13306` ไม่ใช่ `3306`

---

## Environment Variables

### 1) `backend/.env` (Local backend)
ใช้เมื่อรัน `npm start` ที่โฟลเดอร์ `backend` โดยตรง

- `DB_HOST=127.0.0.1`
- `DB_PORT=13306`
- `DB_USER=root`
- `DB_PASSWORD=password123`
- `DB_NAME=my_database`
- `PORT=5000`

### 2) `backend/.env.docker` (Backend ใน Docker)
ใช้เมื่อรันผ่าน `docker compose`

- `DB_HOST=db`
- `DB_PORT=3306`
- `DB_USER=user_name`
- `DB_PASSWORD=user_password`
- `DB_NAME=my_database`
- `PORT=5000`

---

## การนำเข้าไฟล์ SQL Dump

ไฟล์ dump ที่มีในโปรเจกต์:
- `dump-my_database-202602111405.sql`

ตัวอย่างนำเข้าเข้า MySQL ใน container:

```bash
cd /workspaces/test01
docker exec -i mysql_dbeaver mysql -uroot -ppassword123 my_database < dump-my_database-202602111405.sql
```

---

## Font License Compliance

ระบบ PDF สำหรับงานซ่อมใช้ฟอนต์จากไฟล์:
- `frontend/admin/fonts/Sarabun-ExtraLight.ttf`
- `frontend/admin/fonts/Sarabun-Bold.ttf`

สิทธิ์การใช้งาน:
- SIL Open Font License 1.1 (ดูไฟล์ `frontend/admin/fonts/OFL.txt`)

เอกสารแหล่งที่มาและ checksum:
- `frontend/admin/fonts/PROVENANCE.md`

หมายเหตุ:
- ฟอนต์ legacy แบบฝังโค้ด (`THSarabun-Bold.js`) ถูกถอดออกจากโปรเจกต์แล้ว เพื่อหลีกเลี่ยงความเสี่ยงด้านสิทธิ์การใช้งาน

---

## Troubleshooting

### 0) แก้โค้ดแล้ว แต่หน้าเว็บ/PDF ยังไม่เปลี่ยน

อาการนี้มักเกิดจาก Browser cache หรือเปิดคนละ URL กับ service ที่กำลังรัน

วิธีที่ถูกต้อง (แนะนำทำตามลำดับ):
1. ยืนยันว่า service รันอยู่
	```bash
	cd /workspaces/test01
	docker compose up -d
	docker compose ps
	```
2. เปิดหน้าเว็บจาก service URL เดียวกัน (ไม่เปิดไฟล์ local `file:///...`)
	- ตัวอย่างหน้า: `/frontend/admin/status_repair.html`
3. กด Hard Reload
	- Windows/Linux: `Ctrl + Shift + R`
4. เปิด DevTools > Network และติ๊ก `Disable cache` แล้วรีเฟรชอีกครั้ง
5. Generate PDF ใหม่ แล้วตรวจชื่อไฟล์ว่ามี template version ล่าสุด
	- รูปแบบ: `report_<id>_<template_version>_<timestamp>.pdf`

> ถ้าชื่อไฟล์ยังเป็น version เก่า แปลว่าหน้ายังโหลดสคริปต์เก่า/คนละแหล่งอยู่

### 1) `Access denied for user ...`

สาเหตุที่พบบ่อย:
- ใส่ user/password ไม่ตรง
- ใช้ connection profile เก่าที่ cache password เดิม
- ต่อผิดพอร์ต (ไปเจอ MySQL คนละตัว)

วิธีแก้:
1. ตรวจสอบ DBeaver ว่าใช้พอร์ต `13306`
2. ลองสร้าง Connection ใหม่ (ไม่ใช้ profile เดิม)
3. ทดสอบด้วย `root/password123` ก่อน
4. ถ้ายังไม่ผ่าน ให้ตรวจว่า container ยังรันอยู่ด้วย `docker compose ps`

---

### 2) `SQL Error: connect ECONNREFUSED 127.0.0.1:3306`

สาเหตุ:
- แอปยังชี้พอร์ตเก่า `3306`

วิธีแก้:
- สำหรับ local backend ให้แก้ `backend/.env` เป็น `DB_PORT=13306`
- รีสตาร์ต backend ใหม่

---

### 3) `Connection refused: getsockopt`

สาเหตุที่พบบ่อย:
- MySQL container ยังไม่ healthy
- ชี้ host/port ไม่ถูก

วิธีแก้:
1. รัน `docker compose ps` แล้วรอ `db` เป็น `healthy`
2. ตรวจค่า host/port ในเครื่องมือที่ใช้เชื่อมต่อ
3. ถ้ารัน backend ใน Docker ให้ใช้ `DB_HOST=db` และ `DB_PORT=3306`

---

## คำสั่งที่ใช้บ่อย

เริ่มระบบ:
```bash
docker compose up -d
```

ดูสถานะ:
```bash
docker compose ps
```

ดู log MySQL:
```bash
docker compose logs -f db
```

ดู log Backend:
```bash
docker compose logs -f backend
```

หยุดระบบ:
```bash
docker compose down
```

หยุดพร้อมลบ volume (ข้อมูล DB จะหาย):
```bash
docker compose down -v
```

---

## หมายเหตุเพิ่มเติม

- ไฟล์ `docker-compose.yml` คือ source of truth สำหรับค่า container runtime
- หากเปลี่ยนพอร์ตใน compose ต้องแก้ค่าที่ DBeaver และ local `.env` ให้ตรงกันทุกครั้ง
- ควรแยก user สำหรับ production และไม่ใช้รหัสผ่านแบบตัวอย่างในระบบจริง
