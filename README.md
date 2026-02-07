# 📦 ระบบยืม-คืนอุปกรณ์ IT (IT Device Borrowing System)

ระบบจัดการการยืมและคืนอุปกรณ์ IT ภายในองค์กร พัฒนาด้วยเทคโนโลยี Full-stack (Node.js + MySQL) พร้อมหน้าจอ UI ที่ใช้งานง่ายและ Admin Panel ครบครัน

## ✨ ฟีเจอร์หลัก (Features)

- 📱 **Portal Page:** หน้าแรกสำหรับเลือกเข้าใช้งานตามสิทธิ์ (Admin / Employee)
- 📊 **Admin Dashboard:** แผงควบคุมสำหรับดูสรุปภาพรวมอุปกรณ์ทั้งหมด
- 📦 **Inventory Management:** ระบบจัดการรายการอุปกรณ์ (เพิ่ม/ลบ/แก้ไข)
- 📋 **Borrowing Logs:** ดูประวัติการยืม-คืน พร้อมระบบกรองข้อมูลรายบุคคล
- 🖼️ **Image Upload:** อัปโหลดและจัดการรูปภาพอุปกรณ์
- 🔍 **Search & Filter:** ค้นหารายการอุปกรณ์พร้อมระบบกรองข้อมูล
- 📄 **Pagination:** แบ่งหน้าข้อมูลเพื่อให้โหลดไฟล์เร็วขึ้น

## 📋 ข้อกำหนดระบบ (Requirements)

- **Node.js** v14.0 ขึ้นไป
- **MySQL** 5.7 ขึ้นไป
- **npm** v6.0 ขึ้นไป
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Backend Modules

| Package | Version | 용도 |
|---------|---------|------|
| **express** | v5.2.1 | Framework หลักในการสร้าง REST API |
| **mysql2** | v3.16.0 | ตัวเชื่อมต่อฐานข้อมูล MySQL พร้อม Connection Pooling |
| **cors** | v2.8.5 | จัดการการเข้าถึง API จากต่าง Domain |
| **dotenv** | v17.2.3 | จัดการค่า Environment Variable และความปลอดภัย |
| **multer** | v2.0.2 | จัดการการอัปโหลดไฟล์รูปภาพอุปกรณ์ |

### Frontend
- **HTML5 / CSS3** - Custom UI ด้วย Glassmorphism Design
- **Vanilla JavaScript** - ไม่มีความพึ่งพิอื่น โหลดไฟล์เร็ว
- **Bootstrap 5 / Font Awesome** - สำหรับ Admin Panel Components

### Database
- **MySQL** - เก็บข้อมูลอุปกรณ์ ประวัติการยืม-คืน และข้อมูลพนักงาน

## 🚀 วิธีการติดตั้งและใช้งาน (Installation & Setup)

### ขั้นตอนที่ 1: ตรวจสอบ Prerequisites

```bash
node --version    # ต้องเป็น v14 ขึ้นไป
mysql --version   # ต้องเป็น 5.7 ขึ้นไป
npm --version     # ต้องเป็น 6.0 ขึ้นไป
```

### ขั้นตอนที่ 2: ติดตั้ง Dependencies

ไปยัง folder backend:
```bash
cd backend
npm install
```

ระบบจะติดตั้ง 5 packages หลัก ตามรายการใน package.json

### ขั้นตอนที่ 3: สร้างไฟล์ .env

สร้างไฟล์ `.env` ใน folder `backend`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password123
DB_NAME=my_database
PORT=5000
NODE_ENV=development
```

⚠️ **ความสำคัญ:** ไม่ให้ commit ไฟล์ `.env` ขึ้น repository

### ขั้นตอนที่ 4: ตั้งค่าฐานข้อมูล

#### 4.1 สร้างฐานข้อมูล MySQL:
```bash
mysql -u root -p
```

จากนั้นพิมพ์:
```sql
CREATE DATABASE my_database;
USE my_database;
```

#### 4.2 นำเข้า SQL dump (ถ้ามี):
```bash
mysql -u root -p my_database < dump-my_database-202601181549.sql
```

หรือสร้างตารางแบบ Manual ตามไฟล์ `ข้อมูลในdatabase.txt`

### ขั้นตอนที่ 5: รัน Backend Server

```bash
cd backend
node borrow-system-backend.js
```

ถ้าการเชื่อมต่อสำเร็จ จะได้ข้อความ:
```
✅ Server running on port 5000
✅ Database connected
```

### ขั้นตอนที่ 6: เปิด Frontend

#### วิธีที่ 1: ใช้ Live Server (แนะนำ)
- ติดตั้ง VS Code Extension: "Live Server"
- Right-click ที่ `frontend/index.html` → "Open with Live Server"

#### วิธีที่ 2: ใช้ Python
```bash
cd frontend
python -m http.server 8000
```

จากนั้นเปิด browser: `http://localhost:8000`

#### วิธีที่ 3: ใช้ Node.js HTTP Server
```bash
npx http-server frontend -p 8000
```

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
test01/
├── backend/                              # Server-side files
│   ├── borrow-system-backend.js          # Main server file
│   ├── add_purpose.js                    # Script เพิ่มวัตถุประสงค์
│   ├── package.json                      # Dependencies
│   ├── package-lock.json                 # Lock file
│   ├── .env                              # Environment variables (ไม่ commit)
│   └── uploads/                          # Folder เก็บรูปภาพที่อัพโหลด
│
├── frontend/                             # Client-side files
│   ├── index.html                        # หน้าหลัก
│   ├── script.js                         # JavaScript logic
│   ├── style.css                         # Styling
│   ├── admin/
│   │   ├── index.html                    # Admin Dashboard
│   │   ├── login.html                    # Admin Login Page
│   │   └── admin-script.js               # Admin JavaScript logic
│   └── assets/                           # รูปภาพ icon ฯลฯ
│
├── API.txt                               # API Documentation
├── dump-my_database-202601181549.sql    # Database dump
├── ข้อมูลในdatabase.txt                  # Database structure info
├── Default.html                          # Default page
└── README.md                             # File นี้

```

## 🔌 API Endpoints

### Items Management (อุปกรณ์)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | ดึงรายการอุปกรณ์ทั้งหมด (พร้อม pagination) |
| GET | `/items/:id` | ดึงข้อมูลอุปกรณ์ 1 รายการ |
| POST | `/items` | เพิ่มอุปกรณ์ใหม่ |
| PUT | `/items/:id` | แก้ไขข้อมูลอุปกรณ์ |
| DELETE | `/items/:id` | ลบอุปกรณ์ |

### Borrow/Return (การยืม-คืน)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/borrow` | บันทึกการยืมอุปกรณ์ |
| POST | `/return` | บันทึกการคืนอุปกรณ์ |
| GET | `/borrow-history` | ดูประวัติการยืมทั้งหมด |
| GET | `/my-borrow` | ดูประวัติการยืมของตัวเอง |

### File Upload (อัพโหลดรูป)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | อัพโหลดรูปภาพอุปกรณ์ |
| GET | `/uploads/:filename` | ดึงรูปภาพ |

📖 ดูรายละเอียด API ทั้งหมดใน [API.txt](API.txt)

## ⚙️ Configuration & Customization

### แก้ไข Database Credentials

ในไฟล์ `backend/borrow-system-backend.js` บรรทัดที่ 30-37:

```javascript
const db = mysql.createPool({
    host: 'localhost',      // ❌ เปลี่ยนถ้า DB อยู่ server อื่น
    user: 'root',           // ❌ เปลี่ยน username ของคุณ
    password: 'password123', // ❌ เปลี่ยน password ของคุณ
    database: 'my_database', // ❌ เปลี่ยนชื่อ database ของคุณ
    waitForConnections: true,
    connectionLimit: 10
});
```

### แก้ไข API Server URL

ในไฟล์ `frontend/script.js` บรรทัดแรก:

```javascript
const API_URL = 'http://localhost:5000'; // แก้ถ้า server ที่ต่างกัน
```

### Folder Upload Path

เปลี่ยนใน `backend/borrow-system-backend.js` บรรทัดที่ 12-13:

```javascript
const storage = multer.diskStorage({
    destination: './uploads/',  // เปลี่ยน path ถ้าต้องการ
    filename: function (req, file, cb) {
        cb(null, 'item-' + Date.now() + path.extname(file.originalname));
    }
});
```

## 🔐 Security Tips

1. **Environment Variables:** เก็บ credentials ใน `.env` ไม่ใช่ hardcode ใน code
2. **CORS:** ตั้งค่า CORS เฉพาะ domain ที่อนุญาต
3. **Input Validation:** ตรวจสอบข้อมูล input ก่อนเก็บ database
4. **SQL Injection:** ใช้ prepared statements (mysql2 ทำให้อยู่แล้ว)
5. **.env in .gitignore:** ให้แน่ใจว่า `.env` ไม่ถูก commit

## 🧪 Testing

### ทดสอบ Backend API ด้วย Postman

1. ดาวน์โหลด [Postman](https://www.postman.com/downloads/)
2. สร้าง request:
   - **GET** http://localhost:5000/items
   - **POST** http://localhost:5000/items (พร้อม JSON body)
3. ตรวจสอบ response

### ทดสอบ Frontend UI

1. เปิด browser: `http://localhost:8000`
2. ทดสอบ features:
   - เลือกอุปกรณ์
   - บันทึกการยืม
   - บันทึกการคืน
   - เข้า Admin Panel

## 🐛 Troubleshooting

### Error 1: "Cannot find module 'express'"
```bash
cd backend
npm install
```

### Error 2: "Error: connect ECONNREFUSED 127.0.0.1:3306"
```
❌ ปัญหา: MySQL server ไม่ได้รัน
✅ แก้: เปิด MySQL service หรือตรวจสอบ credentials
```

### Error 3: "CORS error - blocked by browser"
```
❌ ปัญหา: Frontend กับ Backend port ต่างกัน
✅ แก้: อัปเดต API_URL ใน frontend/script.js ให้ตรงกับ backend port
```

### Error 4: "Cannot POST /items - 404"
```
❌ ปัญหา: Backend ไม่ได้รัน
✅ แก้: ตรวจสอบว่ารัน node borrow-system-backend.js แล้ว
```

### Error 5: "Image not uploading"
```
❌ ปัญหา: Folder uploads ไม่มี หรือ permission ไม่พอ
✅ แก้: 
   mkdir backend/uploads
   chmod 755 backend/uploads  (Linux/Mac)
```

## 📊 Database Schema

### ตารางหลัก (Main Tables)

**items** - ข้อมูลอุปกรณ์
- `item_id` - ID อุปกรณ์
- `item_name` - ชื่ออุปกรณ์
- `description` - คำอธิบาย
- `status` - สถานะ (Available/Borrowed/Maintenance)

**borrowing** - ประวัติการยืม
- `borrow_id` - ID การยืม
- `item_id` - ID อุปกรณ์
- `employee_id` - ID พนักงาน
- `borrow_date` - วันที่ยืม
- `return_date` - วันที่คืน

**employees** - ข้อมูลพนักงาน
- `employee_id` - ID พนักงาน
- `name` - ชื่อ
- `department` - แผนก

📖 ดูรายละเอียด schema ใน [ข้อมูลในdatabase.txt](ข้อมูลในdatabase.txt)

## 🎓 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL 2 NPM](https://www.npmjs.com/package/mysql2)
- [Multer File Upload](https://github.com/expressjs/multer)
- [CORS in Express](https://expressjs.com/en/resources/middleware/cors.html)
- [JavaScript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 📞 Support & FAQ

### Q: ไฟล์ .env ของฉันหายไป?
A: ตรวจสอบว่าไม่ได้ลบโดยไม่ตั้งใจ สร้างใหม่ตามขั้นตอน 3

### Q: Backend เชื่อมต่อ MySQL ไม่ได้?
A: - ตรวจสอบ MySQL service เปิดอยู่ `services.msc`
   - ตรวจสอบ credentials ใน `.env`
   - ตรวจสอบ port 3306 ว่างอยู่

### Q: Frontend ไม่ติดต่อ Backend?
A: - ตรวจสอบ CORS settings
   - ตรวจสอบ API_URL ตรงกับ backend
   - เปิด Developer Console (F12) ดู error

### Q: อยากเปลี่ยน port ของ Backend?
A: แก้ไขไฟล์ `.env` เปลี่ยน `PORT=5000` เป็นเลขที่ต้องการ

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial release |

## 📄 License

โปรเจกต์นี้เป็น internal project (ใช้ภายในองค์กร)

## 👥 Contributors

- **Developer:** ทีมพัฒนา IT
- **Database:** DB Admin
- **UI/UX:** Design Team

---

**Last Updated:** January 28, 2026  
**Repository:** [GitHub Link]  
**Issues:** กรุณารายงาน Issue ใน GitHub หรือติดต่อทีม IT

🎉 **Happy Borrowing!** 🎉
