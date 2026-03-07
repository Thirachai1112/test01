const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const cors = require('cors');
const QRCode = require('qrcode'); // ต้อง npm install qrcode ก่อน
const { v4: uuidv4 } = require('uuid');
require('dotenv').config(); // อย่าลืมสร้างไฟล์ .env เก็บค่ารหัสผ่านนะครับ



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads'; // โฟลเดอร์เริ่มต้น

        // ใช้ req.originalUrl เพื่อดู URL เต็มที่เรียกเข้ามา
        if (req.originalUrl.includes('repair')) {
            folder = path.join(__dirname, 'uploads', 'repairs');
        } else if (req.originalUrl.includes('borrow')) {
            folder = path.join(__dirname, 'uploads', 'borrowing');
        } else if (req.originalUrl.includes('report')) {
            folder = path.join(__dirname, 'uploads', 'reports');
        } else {
            folder = path.join(__dirname, 'uploads');
        }

        // ตรวจสอบและสร้างโฟลเดอร์อัตโนมัติ
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        cb(null, folder);
    },
    filename: (req, file, cb) => {
        // ใช้ UUID ป้องกันชื่อซ้ำ (อันนี้ดีอยู่แล้วครับ)
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// 2. ทำให้โฟลเดอร์ uploads เข้าถึงได้ผ่านเว็บ (Static Folder)
app.use('/uploads/repairs', express.static(path.join(__dirname, 'uploads/repairs')));
app.use('/uploads/borrowing', express.static(path.join(__dirname, 'uploads/borrowing')));
app.use('/uploads/reports', express.static(path.join(__dirname, 'uploads/reports')));
app.use('/qrcodes', express.static(path.join(__dirname, 'generated_qrcodes')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(__dirname));

const hasExistingImage = (fileName) => {
    if (!fileName) return null;
    const fullPath = path.join(__dirname, 'uploads', fileName);
    return fs.existsSync(fullPath);
};

const getPublicBaseUrl = (req) => {
    const configuredBaseUrl = (process.env.PUBLIC_BASE_URL || '').trim();
    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/+$/, '');
    }

    const hostHeader = req.get('host') || `localhost:${Number(process.env.PORT) || 5000}`;
    const forwardedProto = (req.get('x-forwarded-proto') || '').split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'http';

    const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(hostHeader);
    if (isLocalHost && process.env.CODESPACE_NAME) {
        const port = Number(process.env.PORT) || 5000;
        return `https://${process.env.CODESPACE_NAME}-${port}.app.github.dev`;
    }

    return `${protocol}://${hostHeader}`;
};

const ensureQrCodeForItem = async (itemId, baseUrl) => {
    const qrFolder = path.join(__dirname, 'generated_qrcodes');
    if (!fs.existsSync(qrFolder)) {
        fs.mkdirSync(qrFolder, { recursive: true });
    }

    const qrFileName = `qr_${itemId}.png`;
    const qrPath = path.join(qrFolder, qrFileName);

    const qrData = `${baseUrl}/testqr.html?id=${itemId}`;
    await QRCode.toFile(qrPath, qrData);

    return `/qrcodes/${qrFileName}`;
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Default.html'));
});

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password123';
const DB_NAME = process.env.DB_NAME || 'my_database';

const db = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

const toUtcMySqlDateTime = (inputValue, clientOffsetMinutes) => {
    const raw = String(inputValue || '').trim();
    if (!raw) return null;

    let parsed = null;
    const localDateTimeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);
    const offset = Number(clientOffsetMinutes);
    const hasClientOffset = Number.isFinite(offset);

    if (localDateTimeMatch && hasClientOffset) {
        const year = Number(localDateTimeMatch[1]);
        const month = Number(localDateTimeMatch[2]);
        const day = Number(localDateTimeMatch[3]);
        const hour = Number(localDateTimeMatch[4]);
        const minute = Number(localDateTimeMatch[5]);
        const second = Number(localDateTimeMatch[6] || '0');

        // getTimezoneOffset format: UTC - local (e.g. Thailand = -420)
        const utcMillis = Date.UTC(year, month - 1, day, hour, minute, second) + (offset * 60 * 1000);
        parsed = new Date(utcMillis);
    } else {
        const fallbackParsed = new Date(raw);
        if (!Number.isNaN(fallbackParsed.getTime())) {
            parsed = fallbackParsed;
        }
    }

    if (!parsed || Number.isNaN(parsed.getTime())) return null;

    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const d = String(parsed.getUTCDate()).padStart(2, '0');
    const hh = String(parsed.getUTCHours()).padStart(2, '0');
    const mm = String(parsed.getUTCMinutes()).padStart(2, '0');
    const ss = String(parsed.getUTCSeconds()).padStart(2, '0');

    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
};

app.post('/api/upload-report', upload.single('report_file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({
        success: true,
        file_name: req.file.filename
    });
});

app.get('/items', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // กรองสถานะที่ถูกลบออก และค้นหาตามชื่อ/เลขสัญญา/Serial Number
    const searchCondition = `
        WHERE items.status NOT IN ('Deleted', 'Maintenance')
        AND (items.item_name LIKE ? OR items.contract_number LIKE ? OR items.serial_number LIKE ? OR items.asset_number LIKE ?)
    `;
    const searchParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];

    const countSql = `SELECT COUNT(*) as total FROM items ${searchCondition}`;

    db.query(countSql, searchParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: "Count SQL Error", details: err });

        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const sql = `
            SELECT items.*, categories.item_type AS category_display_name
            FROM items 
            LEFT JOIN categories ON items.cat_id = categories.cat_id 
            ${searchCondition}
            ORDER BY items.item_id DESC 
            LIMIT ? OFFSET ?`;

        db.query(sql, [...searchParams, limit, offset], (err, results) => {
            if (err) return res.status(500).json({ error: "Select SQL Error", details: err });

            const safeResults = results.map(item => ({
                ...item,
                image_url: hasExistingImage(item.image_url) ? item.image_url : null
            }));

            res.json({
                items: safeResults,
                pagination: { totalItems, totalPages, currentPage: page }
            });
        });
    });
});
// --- ส่วนที่ 2: แก้ไข API ลบอุปกรณ์ (วางทับช่วงบรรทัดที่ 180-230) ---
app.patch('/delete-item/:id', (req, res) => {
    const { id } = req.params;

    // เช็คสถานะก่อนว่ามีการยืมอยู่ไหม
    db.query("SELECT status FROM items WHERE item_id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database Error" });
        if (results.length === 0) return res.status(404).json({ error: "ไม่พบอุปกรณ์" });

        if (results[0].status === 'Borrowed') {
            return res.status(400).json({ error: "ไม่สามารถลบได้: อุปกรณ์นี้กำลังถูกยืมอยู่" });
        }

        // ลบ borrowing logs ที่อ้างอิงถึง item นี้ก่อน
        db.query("DELETE FROM borrowing_logs WHERE item_id = ?", [id], (logErr) => {
            if (logErr) return res.status(500).json({ error: "Cannot delete logs", details: logErr });

            // จากนั้นลบ item
            const sql = "DELETE FROM items WHERE item_id = ?";
            db.query(sql, [id], (updErr) => {
                if (updErr) return res.status(500).json({ error: "Update Failed", details: updErr });
                res.json({ message: "ลบอุปกรณ์เรียบร้อยแล้ว", id });
            });
        });
    });
});

//1.2 ดึงข้อมูลอุปกรณ์รายชิ้น โดยระบุ ID
app.get('/items/:id', (req, res) => {
    const itemId = req.params.id;
    const requestedFields = req.query.fields || "*";

    // ใช้คำสั่ง SQL เหมือนเดิม แต่เปลี่ยนตารางเป็น items
    const sql = `SELECT ${requestedFields} FROM items WHERE item_id = ?`;

    db.query(sql, [itemId], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "ไม่พบอุปกรณ์ชิ้นนี้" });
        }

        // ส่งกลับเป็น Object ชิ้นเดียว
        res.json(result[0]);
    });
});

// 1.3  // ดึงข้อมูลอุปกรณ์พร้อมชื่อหมวดหมู่มาแสดงผล
app.get('/items', (req, res) => {
    // ดึงข้อมูลอุปกรณ์พร้อมชื่อหมวดหมู่มาแสดงผล
    const sql = `
        SELECT 
            i.item_id, 
            i.item_name, 
            i.asset_number, 
            i.status, 
            i.image_url, 
            c.category_name 
        FROM items i
        LEFT JOIN categories c ON i.cat_id = c.cat_id
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // ปรับแต่ง URL รูปภาพให้สมบูรณ์ เพื่อให้ Frontend นำไปใช้ได้ทันที
        const updatedResults = results.map(item => ({
            ...item,
            image_url: hasExistingImage(item.image_url) ? `${baseUrl}/uploads/${item.image_url}` : null
        }));

        res.json(updatedResults);
    });
});

// // 2. API สำคัญ: บันทึกการยืมของ (Transaction)
// สิ่งที่ต้องทำ: เพิ่มข้อมูลลง borrowing_logs และ เปลี่ยนสถานะไอเทมเป็น 'Borrowed'
// API สำหรับการยืมอุปกรณ์
// เพิ่ม upload.array('files', 5) เพื่อรับไฟล์ (สูงสุด 5 ไฟล์)
app.post('/borrow', upload.array('files', 5), (req, res) => {
    const { first_name, last_name, employees_code, phone_number, affiliation, item_id, note, purpose, return_due_date, client_tz_offset_minutes } = req.body;
    const uploadedFiles = req.files; // ไฟล์จะถูกเก็บไว้ในตัวแปรนี้

    if (!employees_code || !item_id) {
        return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน (รหัสพนักงาน หรือ ID อุปกรณ์)" });
    }

    // 1. ตรวจสอบว่ามีพนักงานคนนี้อยู่แล้วหรือไม่
    const sqlCheck = "SELECT id FROM employees WHERE employees_code = ?";
    db.query(sqlCheck, [employees_code], (err, empResult) => {
        if (err) {
            console.error("SQL Check Error:", err);
            return res.status(500).json({ error: "Database error during check" });
        }

        if (empResult.length > 0) {
            saveBorrowing(empResult[0].id);
        } else {
            // 2. ถ้ายังไม่มี ให้บันทึกข้อมูลพนักงานใหม่
            const sqlAddEmp = "INSERT INTO employees (first_name, last_name, employees_code, phone_number, Affiliation, role_id) VALUES (?, ?, ?, ?, ?, 2)";
            const empValues = [first_name || '', last_name || '', employees_code, phone_number || '', affiliation || ''];

            db.query(sqlAddEmp, empValues, (addErr, addResult) => {
                if (addErr) {
                    console.error("SQL Insert Employee Error:", addErr);
                    return res.status(500).json({ error: "ไม่สามารถเพิ่มข้อมูลพนักงานได้" });
                }
                saveBorrowing(addResult.insertId);
            });
        }

        function saveBorrowing(empId) {
            // 3. บันทึกประวัติลง borrowing_logs และจัดการไฟล์
            db.query("SELECT status FROM items WHERE item_id = ?", [item_id], (qErr, qResult) => {
                if (qResult.length > 0 && qResult[0].status !== 'Available') {
                    return res.status(400).json({ error: "อุปกรณ์นี้ถูกยืมไปแล้ว" });
                }

                const normalizedDueDate = String(return_due_date || '').trim();
                const dueDateForDb = normalizedDueDate
                    ? toUtcMySqlDateTime(normalizedDueDate, client_tz_offset_minutes)
                    : null;

                if (normalizedDueDate && !dueDateForDb) {
                    return res.status(400).json({ error: 'รูปแบบกำหนดเวลาวันคืนไม่ถูกต้อง' });
                }
                const finalNote = note || 'ยืมผ่านระบบ';
                const sqlLog = "INSERT INTO borrowing_logs (employee_id, item_id, note, purpose, borrow_date, return_due_date) VALUES (?, ?, ?, ?, NOW(), ?)";

                db.query(sqlLog, [empId, item_id, finalNote, purpose || null, dueDateForDb], (logErr, logResult) => {
                    if (logErr) {
                        console.error("SQL Log Error:", logErr);
                        return res.status(500).json({ error: "บันทึกประวัติล้มเหลว" });
                    }

                    const logId = logResult.insertId; // ดึง log_id เพื่อใช้เชื่อมกับไฟล์

                    // --- ส่วนเพิ่ม: บันทึกข้อมูลไฟล์ลงตาราง borrowing_files ---
                    if (uploadedFiles && uploadedFiles.length > 0) {
                        const fileValues = uploadedFiles.map(file => [
                            logId, // ใช้ log_id จาก borrowing_logs
                            file.originalname,
                            `/uploads/borrowing/${file.filename}`,
                            file.mimetype
                        ]);

                        const sqlFile = "INSERT INTO borrowing_files (log_id, file_name, file_path, file_type) VALUES ?";
                        db.query(sqlFile, [fileValues], (fileErr) => {
                            if (fileErr) console.error("SQL File Insert Error:", fileErr);
                        });
                    }

                    // 4. Update สถานะ items
                    db.query("UPDATE items SET status = 'Borrowed' WHERE item_id = ?", [item_id], (upErr) => {
                        if (upErr) return res.status(500).json(upErr);
                        res.json({
                            message: "ยืมสำเร็จและอัปโหลดไฟล์เรียบร้อย!",
                            employee_id: empId,
                            log_id: logId
                        });
                    });
                });
            });
        }
    });
});

// 3. API สำหรับคืนของ
app.post('/return', (req, res) => {
    const { log_id, item_id } = req.body;

    if (!log_id || !item_id) {
        return res.status(400).json({ error: "กรุณาระบุทั้ง log_id และ item_id" });
    }

    db.getConnection((err, connection) => {
        if (err) return res.status(500).json(err);

        connection.beginTransaction(transactionErr => {
            if (transactionErr) { connection.release(); return res.status(500).json(transactionErr); }

            // 1. ตรวจสอบว่ารายการนี้ถูกคืนไปหรือยัง
            const checkSql = "SELECT return_date FROM borrowing_logs WHERE log_id = ?";
            connection.query(checkSql, [log_id], (checkErr, results) => {
                if (checkErr) return connection.rollback(() => { connection.release(); res.status(500).json(checkErr); });

                if (results.length === 0) {
                    return connection.rollback(() => { connection.release(); res.status(404).json({ error: "ไม่พบเลขที่การยืมนี้" }); });
                }

                if (results[0].return_date !== null) {
                    return connection.rollback(() => { connection.release(); res.status(400).json({ error: "อุปกรณ์ชิ้นนี้ถูกคืนไปเรียบร้อยแล้ว!" }); });
                }

                // 2. อัปเดต Log: บันทึกเวลาคืน
                const updateLogSql = "UPDATE borrowing_logs SET return_date = NOW() WHERE log_id = ?";
                connection.query(updateLogSql, [log_id], (updateLogErr) => {
                    if (updateLogErr) return connection.rollback(() => { connection.release(); res.status(500).json(updateLogErr); });

                    // 3. อัปเดตสถานะไอเทม: เปลี่ยนเฉพาะไอเทมชิ้นที่ระบุ (item_id)
                    // แก้จาก cat_id เป็น item_id (หรือชื่อคอลัมน์ที่เป็น Primary Key ของตาราง items)
                    const updateItemSql = "UPDATE items SET status = 'Available' WHERE item_id = ?";
                    connection.query(updateItemSql, [item_id], (itemErr) => {
                        if (itemErr) return connection.rollback(() => { connection.release(); res.status(500).json(itemErr); });

                        connection.commit(commitErr => {
                            if (commitErr) return connection.rollback(() => { connection.release(); res.status(500).json(commitErr); });
                            connection.release();
                            res.json({ message: 'คืนของเรียบร้อยแล้ว!', log_id, item_id });
                        });
                    });
                });
            });
        });
    });
});

// 3.1 ดึงรายการยืมที่ยังไม่ได้คืน เพื่อเอาไปหา log_id ในหน้าเว็บ
app.get('/borrowing-active', (req, res) => {
    const sql = `
        SELECT l.log_id, l.item_id, l.borrow_date, e.first_name, e.last_name 
        FROM borrowing_logs l
        JOIN employees e ON l.employee_id = e.id
        WHERE l.return_date IS NULL`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

//4. API ดูประวัติการยืม-คืนทั้งหมด (JOIN 3 ตาราง)
app.get('/history', (req, res) => {
    // SQL นี้จะไปดึงชื่อพนักงาน และชื่ออุปกรณ์มาโชว์แทนที่จะเห็นแค่เลข ID
    const sql = `
        SELECT 
            l.log_id,
            concat(e.first_name, ' ', e.last_name) AS employee_full_name,
            i.item_name,
            i.asset_number,
            l.borrow_date,
            l.return_date,
            l.note
        FROM borrowing_logs l
        JOIN employees e ON l.employee_id = e.id
        JOIN items i ON l.item_id = i.item_id
        ORDER BY l.borrow_date DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching history:", err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

//5. APi ดึงรายชื่อพนักงานทั้งหมด
app.get('/employees', (req, res) => {
    // 1. รับค่าจาก URL มาว่าอยากได้ฟิลด์ไหนบ้าง (เช่น ?fields=first_name,last_name)
    const requestedFields = req.query.fields;

    // 2. ตั้งค่าเริ่มต้น: ถ้าไม่ระบุฟิลด์มา ให้เอาทั้งหมด (*) 
    // แต่ถ้าระบุมา ให้ใช้ฟิลด์ตามนั้น
    let sqlFields = "*";
    if (requestedFields) {
        // ป้องกัน SQL Injection เบื้องต้น โดยการรับค่ามาเป็นชื่อคอลัมน์
        sqlFields = requestedFields;
    }

    const sql = `SELECT ${sqlFields} FROM employees ORDER BY first_name ASC`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching:', err);
            // ถ้าพิมพ์ชื่อคอลัมน์ผิด SQL จะ Error เราก็แจ้งกลับไป
            return res.status(400).json({ error: 'ชื่อคอลัมน์ไม่ถูกต้อง หรือคำสั่งผิดพลาด' });
        }
        res.json(results);
    });
});


//6. API ค้นหาพนักงาน
app.get('/employees/search', (req, res) => {
    const searchTerm = req.query.q; // รับค่าจาก ?q=...

    if (!searchTerm) {
        return res.status(400).json({ error: "โปรดระบุคำที่ต้องการค้นหา" });
    }

    // ค้นหาจากชื่อ, นามสกุล หรือรหัสพนักงาน
    const sql = `
        SELECT * FROM employees 
        WHERE first_name LIKE ? 
        OR last_name LIKE ? 
        OR employees_code LIKE ?
        OR Affiliation LIKE ?
    `;

    const values = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    db.query(sql, values, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 7. API ดึงข้อมูลพนักงานรายบุคคล โดยระบุ ID
app.get('/employees/:id', (req, res) => {
    const userId = req.params.id; // รับ ID จาก URL (เช่น /employees/1)
    const requestedFields = req.query.fields || "*"; // เลือกฟิลด์ได้เหมือนเดิม ถ้าไม่เลือกเอาทั้งหมด

    const sql = `SELECT ${requestedFields} FROM employees WHERE id = ?`;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // ถ้าไม่เจอพนักงาน ID นี้
        if (result.length === 0) {
            return res.status(404).json({ message: "ไม่พบพนักงานรหัสนี้" });
        }

        // ส่งกลับแค่ Object เดียว (ไม่ต้องส่งเป็น Array เพราะมีคนเดียว)
        res.json(result[0]);
    });
});

app.get('/api/qrcode/:itemId', (req, res) => {
    const { itemId } = req.params;

    if (!/^\d+$/.test(itemId)) {
        return res.status(400).json({ success: false, message: 'itemId must be numeric' });
    }

    db.query('SELECT item_id FROM items WHERE item_id = ? LIMIT 1', [itemId], async (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบอุปกรณ์' });
        }

        try {
            const baseUrl = getPublicBaseUrl(req);
            const qrUrl = await ensureQrCodeForItem(itemId, baseUrl);

            return res.json({ success: true, item_id: Number(itemId), qr_url: qrUrl });
        } catch (qrErr) {
            return res.status(500).json({ success: false, message: qrErr.message });
        }
    });
});


// 8.API สำหรับเพิ่มอุปกรณ์ใหม่พร้อมรูปภาพ
app.post('/add-item', upload.single('image'), (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: "ไม่ได้รับข้อมูลจาก Form" });
    }

    const { item_name, cat_id, asset_number, serial_number, contract_number, status } = req.body;

    if (!item_name) {
        return res.status(400).json({ error: "กรุณาระบุชื่ออุปกรณ์" });
    }

    const image_url = req.file ? req.file.filename : null;
    const final_cat_id = (cat_id && cat_id !== '') ? cat_id : 4;

    const sql = `INSERT INTO items 
                 (item_name, cat_id, asset_number, serial_number, contract_number, image_url, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        item_name,
        final_cat_id,
        asset_number,
        serial_number,
        contract_number,
        image_url,
        status || 'Available'
    ];

    db.query(sql, values, async (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err.message);
            return res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้", details: err.message });
        }

        const newItemId = result.insertId;

        // 🚩 สร้าง QR Code ด้วย JavaScript (Node.js)
        try {
            const baseUrl = getPublicBaseUrl(req);
            const qrUrl = await ensureQrCodeForItem(newItemId, baseUrl);

            console.log("✅ เพิ่มข้อมูลและสร้าง QR สำเร็จ ID:", newItemId);

            // ส่งค่ากลับไปให้ Frontend
            res.json({
                message: "เพิ่มอุปกรณ์และสร้าง QR Code เรียบร้อยแล้ว",
                id: newItemId,
                image: image_url,
                qr_url: qrUrl // 🚩 ส่ง URL รูป QR กลับไปโชว์
            });

        } catch (qrErr) {
            console.error("❌ QR Error:", qrErr);
            res.json({
                message: "เพิ่มอุปกรณ์สำเร็จ แต่สร้าง QR Code ล้มเหลว",
                id: newItemId
            });
        }
    });
});

// 9.API สำหรับอัปเดตรูปให้อุปกรณ์ (ใช้ item_id เป็นตัวอ้างอิง)
app.put('/update-item-all/:item_id', upload.single('image'), (req, res) => {
    const { item_id } = req.params;

    // 1. รับค่าจาก Body
    const {
        item_name,
        cat_id,
        asset_number,
        serial_number,
        contract_number,
        status
    } = req.body;

    const newImage = req.file ? req.file.filename : null;

    // 2. ตรวจสอบข้อมูลเดิม
    db.query("SELECT * FROM items WHERE item_id = ?", [item_id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: "ไม่พบอุปกรณ์ ID นี้" });
        }

        const currentData = results[0];

        // 3. ตั้งค่าข้อมูลที่จะบันทึก (แก้ไขจุดที่เคยผิด: ลบ item_type ออก)
        const updated_item_name = item_name || currentData.item_name;
        const updated_cat_id = cat_id || currentData.cat_id;
        const updated_asset_number = asset_number || currentData.asset_number;
        const updated_serial_number = serial_number || currentData.serial_number;
        const updated_contract_number = contract_number || currentData.contract_number;
        const updated_status = status || currentData.status;
        const updated_image = newImage || currentData.image_url;

        // 4. SQL Update (ลบคอลัมน์ item_type ออกเพื่อให้ตรงกับ DB)
        const sql = `
            UPDATE items 
            SET item_name = ?, 
                cat_id = ?, 
                asset_number = ?, 
                serial_number = ?,
                contract_number = ?, 
                status = ?, 
                image_url = ? 
            WHERE item_id = ?
        `;

        const values = [
            updated_item_name,
            updated_cat_id,
            updated_asset_number,
            updated_serial_number,
            updated_contract_number,
            updated_status,
            updated_image,
            item_id
        ];

        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json(err);

            // 5. จัดการรูปภาพเก่า
            if (newImage && currentData.image_url && currentData.image_url !== 'default_device.png') {
                const oldPath = path.join(__dirname, 'uploads', currentData.image_url);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            res.json({
                message: "อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว!",
                updated_data: {
                    item_name: updated_item_name,
                    cat_id: updated_cat_id,
                    status: updated_status,
                    image_url: updated_image
                }
            });
        });
    });
});



// 1. สำหรับดูประวัติทั้งหมด (ย้ายกลับมาเป็นแบบไม่มี :id)
app.get('/admin/logs-all', (req, res) => {
    const sql = `
        SELECT logs.*, items.item_name, employees.first_name, employees.last_name 
        FROM borrowing_logs logs
        JOIN items ON logs.item_id = items.item_id
        JOIN employees ON logs.employee_id = employees.id 
        ORDER BY logs.borrow_date DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. สำหรับดูเฉพาะรายการ (ถ้าต้องการดู Log รายใบจริงๆ)
app.get('/admin/logs/single/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT logs.*, items.item_name, employees.first_name, employees.last_name 
        FROM borrowing_logs logs
        JOIN items ON logs.item_id = items.item_id
        JOIN employees ON logs.employee_id = employees.id 
        WHERE logs.log_id = ? 
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]); // ส่งกลับแค่ออบเจกต์เดียว
    });
});

// ดึงข้อมูลประวัติการยืม-คืน
app.get('/borrowing-logs', (req, res) => {
    const sql = `
        SELECT 
            logs.*, 
            items.item_name, 
            items.serial_number,
            CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name,
            employees.phone_number AS employee_phone,
            employees.Affiliation,
            -- ส่วนที่เพิ่ม: รวม Path ไฟล์ทั้งหมดที่ผูกกับ log_id นี้เข้าด้วยกัน แยกด้วยเครื่องหมายคอมม่า (,)
            GROUP_CONCAT(files.file_path) AS file_paths
        FROM borrowing_logs logs
        LEFT JOIN items ON logs.item_id = items.item_id
        LEFT JOIN employees ON logs.employee_id = employees.id 
        -- เชื่อมกับตารางไฟล์
        LEFT JOIN borrowing_files files ON logs.log_id = files.log_id
        -- ต้องทำ GROUP BY เพื่อไม่ให้แถวข้อมูลซ้ำเมื่อมีหลายไฟล์
        GROUP BY logs.log_id
        ORDER BY logs.borrow_date DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Logs Error:", err);
            return res.status(500).json({ error: err.message });
        }

        // ปรับแต่งข้อมูลเล็กน้อยเพื่อให้ฝั่ง Frontend ใช้งานง่าย (แยก string กลับเป็น Array)
        const formattedResults = results.map(row => ({
            ...row,
            file_paths: row.file_paths ? row.file_paths.split(',') : []
        }));

        res.json({ logs: formattedResults || [] });
    });
});

// API สำหรับ Admin Login
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "ชื่อผู้ใช้และรหัสผ่านจำเป็น" });
    }

    const sql = "SELECT admin_id, username FROM admins WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length > 0) {
            const admin = results[0];
            // สร้าง token ง่ายๆ (ในการใช้งานจริงควรใช้ JWT)
            const token = Buffer.from(`${admin.admin_id}:${Date.now()}`).toString('base64');

            res.json({
                message: "เข้าสู่ระบบสำเร็จ",
                token: token,
                admin_id: admin.admin_id,
                username: admin.username
            });
        } else {
            res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
        }
    });
});


app.post('/api/repair', upload.array('files', 5), (req, res) => {
    const {
        brand, contract_number, serial_number, asset_number,
        affiliation, problem, item_id,
        employee_name, employees_code, phone_number
    } = req.body;

    const parsedItemId = Number(item_id);
    const normalizedItemId = Number.isInteger(parsedItemId) && parsedItemId > 0 ? parsedItemId : null;
    const normalizeLookupValue = (value = '') => value.toString().trim().toLowerCase().replace(/[\s\-_]/g, '');

    const uploadedFiles = req.files;
    // รวมชื่อไฟล์หลายๆ ไฟล์คั่นด้วยคอมมา
    const filePaths = uploadedFiles && uploadedFiles.length > 0
        ? uploadedFiles.map(file => file.filename).join(',')
        : null;

    const saveRepairData = (resolvedItemId, empId, empName, empCode, empPhone) => {
        const finalName = empName || employee_name || '-';
        const finalCode = empCode || employees_code || '-';
        const finalPhone = empPhone || phone_number || '-';

        db.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'repair'`,
            [DB_NAME],
            (columnErr, columnRows) => {
                if (columnErr) {
                    console.error('❌ Column Check Error:', columnErr.message);
                    return res.status(500).json({ success: false, message: columnErr.message });
                }

                const repairColumns = new Set(columnRows.map((row) => row.COLUMN_NAME));
                const fieldMap = {
                    brand,
                    contract_number,
                    serial_number,
                    asset_number,
                    affiliation,
                    problem,
                    repair_url: filePaths,
                    employee_id: empId,
                    employee_name: finalName,
                    employees_code: finalCode,
                    phone_number: finalPhone,
                    item_id: resolvedItemId,
                    status: 'Pending',
                    created_at: new Date()
                };

                const insertColumns = Object.keys(fieldMap).filter((col) => repairColumns.has(col));
                if (insertColumns.length === 0) {
                    return res.status(500).json({ success: false, message: 'ไม่พบคอลัมน์ที่รองรับสำหรับบันทึก repair' });
                }

                const placeholders = insertColumns.map(() => '?').join(', ');
                const insertSql = `INSERT INTO repair (${insertColumns.map((col) => `\`${col}\``).join(', ')}) VALUES (${placeholders})`;
                const values = insertColumns.map((col) => fieldMap[col]);

                db.query(insertSql, values, (err) => {
                    if (err) {
                        console.error("❌ SQL Error:", err.message);
                        return res.status(500).json({ success: false, message: err.message });
                    }
                    if (resolvedItemId) {
                        db.query("UPDATE items SET status = 'Maintenance' WHERE item_id = ?", [resolvedItemId]);
                    }
                    res.status(201).json({ success: true, message: "แจ้งซ่อมสำเร็จ" });
                });
            }
        );
    };

    const resolveItemId = (callback) => {
        if (normalizedItemId) return callback(normalizedItemId);

        const conditions = [];
        const params = [];
        const safeSerial = (serial_number || '').trim();
        const safeAsset = (asset_number || '').trim();
        const safeContract = (contract_number || '').trim();

        if (safeSerial) {
            const serialNorm = normalizeLookupValue(safeSerial);
            conditions.push("(serial_number = ? OR REPLACE(REPLACE(REPLACE(LOWER(TRIM(serial_number)), ' ', ''), '-', ''), '_', '') = ?)");
            params.push(safeSerial, serialNorm);
        }
        if (safeAsset) {
            const assetNorm = normalizeLookupValue(safeAsset);
            conditions.push("(asset_number = ? OR REPLACE(REPLACE(REPLACE(LOWER(TRIM(asset_number)), ' ', ''), '-', ''), '_', '') = ?)");
            params.push(safeAsset, assetNorm);
        }
        if (safeContract) {
            const contractNorm = normalizeLookupValue(safeContract);
            conditions.push("(contract_number = ? OR REPLACE(REPLACE(REPLACE(LOWER(TRIM(contract_number)), ' ', ''), '-', ''), '_', '') = ?)");
            params.push(safeContract, contractNorm);
        }

        if (conditions.length === 0) return callback(null);

        const lookupSql = `SELECT item_id FROM items WHERE ${conditions.join(' OR ')} ORDER BY item_id DESC LIMIT 1`;
        db.query(lookupSql, params, (lookupErr, lookupRows) => {
            if (lookupErr || !lookupRows || lookupRows.length === 0) return callback(null);
            return callback(lookupRows[0].item_id || null);
        });
    };

    // Logic ตรวจสอบประวัติยืมเดิม
    resolveItemId((resolvedItemId) => {
        if (resolvedItemId) {
            const getEmployeeSql = `
                SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) AS full_name, e.employees_code, e.phone_number 
                FROM borrowing_logs bl 
                JOIN employees e ON bl.employee_id = e.id 
                WHERE bl.item_id = ? 
                ORDER BY bl.borrow_date DESC LIMIT 1`;

            db.query(getEmployeeSql, [resolvedItemId], (empErr, empResult) => {
                if (empErr || empResult.length === 0) {
                    saveRepairData(resolvedItemId, null, null, null, null);
                } else {
                    const emp = empResult[0];
                    saveRepairData(resolvedItemId, emp.id, emp.full_name, emp.employees_code, emp.phone_number);
                }
            });
        } else {
            saveRepairData(null, null, null, null, null);
        }
    });
});
/**
 * GET API: ดึงข้อมูลซ่อมแซมพร้อมฟิลเตอร์, ค้นหา และ pagination
 */
app.get('/api/repair', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'repair_id';
    const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'repair'`,
        [DB_NAME],
        (columnErr, columnRows) => {
            if (columnErr) {
                console.error("❌ Column Check Error:", columnErr);
                return res.status(500).json({ success: false, message: "Error checking repair schema" });
            }

            const repairColumns = new Set(columnRows.map(row => row.COLUMN_NAME));
            const canonical = (name = '') => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
            const findColumnByCanonical = (candidates) => {
                const canonicalCandidates = new Set(candidates.map(canonical));
                return Array.from(repairColumns).filter((col) => canonicalCandidates.has(canonical(col)));
            };
            const escapeIdentifier = (name) => `\`${String(name).replace(/`/g, '``')}\``;
            const repairMethodColumns = findColumnByCanonical(['Repair methods', 'repair_methods', 'repair_method', 'Procedure']);
            const hasEmployeeIdColumn = repairColumns.has('employee_id');
            const hasItemIdColumn = repairColumns.has('item_id');
            const hasPriceColumn = repairColumns.has('price');

            const searchableFields = [
                'r.brand',
                'r.contract_number',
                'r.serial_number',
                'r.asset_number',
                'r.problem',
                'r.employee_name',
                'r.employees_code',
                'r.affiliation'
            ];

            if (repairMethodColumns.length > 0) {
                searchableFields.push(...repairMethodColumns.map((col) => `r.${escapeIdentifier(col)}`));
            }

            if (hasPriceColumn) {
                searchableFields.push('CAST(r.price AS CHAR)');
            }

            const searchCondition = search
                ? ` WHERE ${searchableFields.map(field => `${field} LIKE ?`).join(' OR ')}`
                : '';

            const searchParams = search
                ? Array(searchableFields.length).fill(`%${search}%`)
                : [];

            const countSql = `SELECT COUNT(*) as total FROM repair r ${searchCondition}`;

            db.query(countSql, searchParams, (countErr, countResult) => {
                if (countErr) {
                    console.error("❌ Count Error:", countErr);
                    return res.status(500).json({ success: false, message: "Error counting records" });
                }

                const totalRecords = countResult[0].total;
                const totalPages = Math.ceil(totalRecords / limit);

                const sortableFields = {
                    repair_id: 'r.repair_id',
                    created_at: 'r.created_at',
                    updated_at: 'r.updated_at',
                    brand: 'r.brand',
                    serial_number: 'r.serial_number',
                    asset_number: 'r.asset_number',
                    contract_number: 'r.contract_number'
                };

                if (hasPriceColumn) {
                    sortableFields.price = 'r.price';
                }

                const orderByField = sortableFields[sortBy] || 'r.repair_id';
                const repairMethodSelect = repairMethodColumns.length > 0
                    ? `COALESCE(${repairMethodColumns.map((col) => `r.${escapeIdentifier(col)}`).join(', ')})`
                    : 'NULL';
                const itemIdSelect = hasItemIdColumn ? 'r.item_id' : 'NULL AS item_id';
                const priceSelect = hasPriceColumn ? 'r.price' : 'NULL AS price';
                const employeeJoinCondition = hasEmployeeIdColumn ? 'r.employee_id = e.id' : '1 = 0';

                const sql = `
                    SELECT 
                        r.repair_id,
                        r.brand,
                        r.contract_number,
                        r.serial_number,
                        r.asset_number,
                        r.affiliation,
                        r.problem,
                        r.repair_url,
                        r.created_at,
                        r.updated_at,
                        ${itemIdSelect},
                        ${repairMethodSelect} AS repair_method,
                        ${repairMethodSelect} AS \`Procedure\`,
                        ${priceSelect},
                        COALESCE(r.employee_name, CONCAT(e.first_name, ' ', e.last_name)) AS employee_name,
                        COALESCE(r.employees_code, e.employees_code) AS employees_code,
                        COALESCE(r.phone_number, e.phone_number) AS phone_number
                    FROM repair r
                    LEFT JOIN employees e ON ${employeeJoinCondition}
                    ${searchCondition}
                    ORDER BY ${orderByField} ${sortOrder}
                    LIMIT ? OFFSET ?
                `;

                const params = [...searchParams, limit, offset];

                db.query(sql, params, (selectErr, results) => {
                    if (selectErr) {
                        console.error("❌ Select Error:", selectErr);
                        return res.status(500).json({ success: false, message: "Error fetching repairs" });
                    }

                    const formattedResults = results.map(row => ({
                        ...row,
                        file_paths: row.repair_url ? row.repair_url.split(',') : []
                    }));

                    res.json({
                        success: true,
                        data: formattedResults,
                        pagination: {
                            currentPage: page,
                            totalPages: totalPages,
                            totalRecords: totalRecords,
                            recordsPerPage: limit,
                            hasNextPage: page < totalPages,
                            hasPrevPage: page > 1
                        },
                        filters: {
                            search: search || null,
                            sortBy: sortBy,
                            sortOrder: sortOrder
                        }
                    });
                });
            });
        }
    );
});

app.get('/api/repair-management', (req, res) => {
    db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'repair'`,
        [DB_NAME],
        (columnErr, columnRows) => {
            if (columnErr) {
                console.error("❌ SQL Error:", columnErr.message);
                return res.status(500).json({ success: false, error: columnErr.message });
            }

            const repairColumns = new Set(columnRows.map(row => row.COLUMN_NAME));
            const canonical = (name = '') => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
            const findColumnByCanonical = (candidates) => {
                const canonicalCandidates = new Set(candidates.map(canonical));
                return Array.from(repairColumns).filter((col) => canonicalCandidates.has(canonical(col)));
            };
            const escapeIdentifier = (name) => `\`${String(name).replace(/`/g, '``')}\``;
            const repairMethodColumns = findColumnByCanonical(['Repair methods', 'repair_methods', 'repair_method', 'Procedure']);
            const repairMethodSelect = repairMethodColumns.length > 0
                ? `COALESCE(${repairMethodColumns.map((col) => escapeIdentifier(col)).join(', ')}) AS repair_method`
                : 'NULL AS repair_method';
            const selectExpr = (name, alias = null) => {
                if (!repairColumns.has(name)) {
                    return alias ? `NULL AS ${alias}` : `NULL AS \`${name}\``;
                }
                const col = `\`${name}\``;
                return alias ? `${col} AS ${alias}` : col;
            };

            const sql = `
                SELECT 
                    ${selectExpr('repair_id')},
                    ${selectExpr('item_id')},
                    ${selectExpr('employee_name')},
                    ${selectExpr('employee_id')},
                    ${selectExpr('employees_code')},
                    ${selectExpr('phone_number')},
                    ${selectExpr('affiliation')},
                    ${selectExpr('brand')},
                    ${selectExpr('serial_number')},
                    ${selectExpr('asset_number')},
                    ${selectExpr('contract_number')},
                    ${selectExpr('problem')},
                    ${selectExpr('status')},
                    ${selectExpr('created_at')},
                    ${selectExpr('finished_at')},
                    ${selectExpr('repair_url')},
                    ${selectExpr('Procedure')},
                    ${repairMethodSelect}
                FROM repair
                WHERE status != 'Fixed'
                ORDER BY created_at DESC
            `;

            db.query(sql, (err, results) => {
                if (err) {
                    console.error("❌ SQL Error:", err.message);
                    return res.status(500).json({ success: false, error: err.message });
                }
                res.json({ success: true, data: results });
            });
        }
    );
});

// อัปเดตสถานะการซ่อมแซม
// API สำหรับดึงข้อมูลสถานะการซ่อมปัจจุบัน (ใช้กับหน้า status_repair.html และ Dashboard)
// ในไฟล์ borrow-system-backend.js
app.get('/api/repair-status', (req, res) => {
    const { search = '', status = '' } = req.query;
    const whereClauses = ["status IN ('Pending', 'In Progress', 'Maintenance', 'Repair')"];
    const params = [];

    if (status && ['Pending', 'In Progress', 'Maintenance', 'Repair'].includes(status)) {
        whereClauses.push("status = ?");
        params.push(status);
    }

    if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        whereClauses.push(`(
            employee_name LIKE ? OR
            employees_code LIKE ? OR
            affiliation LIKE ? OR
            brand LIKE ? OR
            serial_number LIKE ? OR
            contract_number LIKE ? OR
            asset_number LIKE ? OR
            problem LIKE ?
        )`);
        params.push(
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm
        );
    }

    db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'repair'`,
        [DB_NAME],
        (columnErr, columnRows) => {
            if (columnErr) {
                console.error("❌ Column Check Error:", columnErr.message);
                return res.status(500).json({ success: false, message: columnErr.message });
            }

            const repairColumns = new Set(columnRows.map(row => row.COLUMN_NAME));
            const canonical = (name = '') => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
            const findColumnByCanonical = (candidates) => {
                const canonicalCandidates = new Set(candidates.map(canonical));
                return Array.from(repairColumns).filter((col) => canonicalCandidates.has(canonical(col)));
            };
            const escapeIdentifier = (name) => `\`${String(name).replace(/`/g, '``')}\``;
            const repairMethodColumns = findColumnByCanonical(['Repair methods', 'repair_methods', 'repair_method', 'Procedure']);
            const itemIdSelect = repairColumns.has('item_id') ? 'item_id' : 'NULL AS item_id';
            const repairMethodSelect = repairMethodColumns.length > 0
                ? `COALESCE(${repairMethodColumns.map((col) => escapeIdentifier(col)).join(', ')})`
                : 'NULL';

            const sql = `
                SELECT 
                    repair_id, 
                    ${itemIdSelect}, 
                    brand, 
                    asset_number, 
                    serial_number, 
                    contract_number,
                    employee_name, 
                    employees_code AS employee_id,
                    phone_number,
                    affiliation AS department,
                    problem, 
                    status, 
                    created_at, 
                    repair_url,
                    ${repairMethodSelect} AS repair_method,
                    ${repairMethodSelect} AS \`Procedure\`
                FROM repair
                WHERE ${whereClauses.join(' AND ')}
                ORDER BY created_at DESC
            `;

            db.query(sql, params, (err, results) => {
                if (err) {
                    console.error("❌ SQL Error:", err.message);
                    return res.status(500).json({ success: false, message: err.message });
                }
                res.json({ success: true, data: results });
            });
        }
    );
});


// API สำหรับอัปเดตสถานะการซ่อม (รองรับการกดปุ่ม รับงาน และ ปิดงาน)
// ปรับปรุง API อัปเดตสถานะการซ่อม
app.put('/api/repair/status/:id', async (req, res) => {
    const repairId = req.params.id;
    const { status, item_id, procedure, repair_method, report_url, price } = req.body;
    const methodValueRaw = procedure ?? repair_method;
    const normalizedMethodValue = (typeof methodValueRaw === 'string') ? methodValueRaw.trim() : methodValueRaw;
    const hasPriceInPayload = Object.prototype.hasOwnProperty.call(req.body, 'price');
    const numericPriceRaw = Number(String(price ?? '').replace(/,/g, ''));
    const normalizedPrice = Number.isFinite(numericPriceRaw) ? Math.round(numericPriceRaw) : null;

    // --- 1. กรณีอัปเดตสถานะทั่วไป (เช่น กดรับงาน 'In Progress') ---
    if (status !== 'Fixed') {
        const sql = "UPDATE repair SET status = ?, updated_at = NOW() WHERE repair_id = ?";
        db.query(sql, [status, repairId], (err) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            return res.json({ success: true });
        });
        return;
    }

    // --- 2. กรณีปิดงาน (Fixed) ---
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const [repairColumnRows] = await connection.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'repair'
        `);
        const repairColumns = new Set(repairColumnRows.map(row => row.COLUMN_NAME));
        const canonical = (name = '') => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
        const findColumnByCanonical = (candidates) => {
            const canonicalCandidates = new Set(candidates.map(canonical));
            return Array.from(repairColumns).filter((col) => canonicalCandidates.has(canonical(col)));
        };

        // ก. ตรวจสอบข้อมูลใบแจ้งซ่อม
        const repairSelectFields = ['problem', 'serial_number', 'asset_number', 'contract_number'];
        if (repairColumns.has('item_id')) {
            repairSelectFields.push('item_id');
        }
        const [repairRows] = await connection.query(
            `SELECT ${repairSelectFields.join(', ')} FROM repair WHERE repair_id = ?`,
            [repairId]
        );
        if (repairRows.length === 0) throw new Error('ไม่พบข้อมูลใบแจ้งซ่อม');

        const requestItemId = Number(item_id);
        const repairItemId = repairColumns.has('item_id') ? Number(repairRows[0].item_id) : null;
        let resolvedItemId = Number.isInteger(requestItemId) && requestItemId > 0
            ? requestItemId
            : (Number.isInteger(repairItemId) && repairItemId > 0 ? repairItemId : null);

        let archivedAndRemoved = false;
        let archiveSkipReason = '';

        if (resolvedItemId) {
            const [itemRows] = await connection.query("SELECT * FROM items WHERE item_id = ?", [resolvedItemId]);
            if (itemRows.length === 0) {
                archiveSkipReason = `ไม่พบอุปกรณ์ item_id=${resolvedItemId} ในตาราง items จึงไม่เก็บเข้า item_repair`;
                resolvedItemId = null;
            }

            if (resolvedItemId) {

            const itemSnapshot = itemRows[0];

            await connection.query(`
                CREATE TABLE IF NOT EXISTS item_repair (
                    archive_id INT AUTO_INCREMENT PRIMARY KEY,
                    repair_id INT NULL,
                    item_id INT NULL,
                    item_name VARCHAR(255) NULL,
                    Serial_Number VARCHAR(255) NULL,
                    asset_number VARCHAR(255) NULL,
                    contract_number VARCHAR(255) NULL,
                    cat_id INT NULL,
                    image_url VARCHAR(255) NULL,
                    status VARCHAR(50) NULL,
                    item_created_at DATETIME NULL,
                    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            {

            // ข. บันทึกลงตาราง item_repair โดยเก็บได้เท่าที่โครงสร้างตารางรองรับ
            const [existingArchiveRows] = await connection.query(
                "SELECT archive_id FROM item_repair WHERE repair_id = ? LIMIT 1",
                [repairId]
            );

                        const [itemRepairColumnsRows] = await connection.query(`
                                SELECT COLUMN_NAME
                                FROM INFORMATION_SCHEMA.COLUMNS
                                WHERE TABLE_SCHEMA = DATABASE()
                                    AND TABLE_NAME = 'item_repair'
                        `);
            const supportedColumns = new Set(itemRepairColumnsRows.map(row => row.COLUMN_NAME));

            if (existingArchiveRows.length === 0) {
                const archiveData = {
                    repair_id: Number(repairId),
                    item_id: resolvedItemId,
                    archived_item_id: resolvedItemId,
                    original_item_id: resolvedItemId,
                    item_ref_id: resolvedItemId,
                    item_name: itemSnapshot.item_name || repairRows[0].brand,
                    Serial_Number: itemSnapshot.serial_number || repairRows[0].serial_number,
                    asset_number: itemSnapshot.asset_number,
                    contract_number: itemSnapshot.contract_number,
                    cat_id: itemSnapshot.cat_id,
                    image_url: itemSnapshot.image_url,
                    status: itemSnapshot.status,
                    item_created_at: itemSnapshot.created_at
                };

                const insertColumns = Object.keys(archiveData).filter(col => supportedColumns.has(col));
                if (insertColumns.length < 2 || !insertColumns.includes('repair_id') || !insertColumns.includes('item_id')) {
                    archiveSkipReason = 'โครงสร้างตาราง item_repair ไม่รองรับคอลัมน์ repair_id/item_id จึงข้ามการย้ายข้อมูล';
                } else {
                    const insertValues = insertColumns.map(col => archiveData[col]);
                    const insertSql = `
                        INSERT INTO item_repair (${insertColumns.map(col => `\`${col}\``).join(', ')})
                        VALUES (${insertColumns.map(() => '?').join(', ')})
                    `;
                    await connection.query(insertSql, insertValues);
                }
            }

                if (!archiveSkipReason) {
                    // ค. ตัดความสัมพันธ์ก่อนลบ item ออกจากคลังหลัก
                    if (repairColumns.has('item_id')) {
                        await connection.query("UPDATE repair SET item_id = NULL WHERE repair_id = ?", [repairId]);
                    }

                    const [activeBorrowRows] = await connection.query(
                        "SELECT log_id FROM borrowing_logs WHERE item_id = ? AND return_date IS NULL LIMIT 1",
                        [resolvedItemId]
                    );
                    if (activeBorrowRows.length > 0) {
                        throw new Error('ไม่สามารถลบอุปกรณ์จาก items ได้ เนื่องจากยังมีรายการยืมที่ยังไม่คืน');
                    }

                    await connection.query("UPDATE borrowing_logs SET item_id = NULL WHERE item_id = ?", [resolvedItemId]);
                    await connection.query("DELETE FROM items WHERE item_id = ?", [resolvedItemId]);
                    archivedAndRemoved = true;
                }
            }
            }
        }

            // ง. อัปเดตตาราง repair (รองรับทั้งคอลัมน์ Repair methods และ Procedure)
            const escapeIdentifier = (name) => `\`${String(name).replace(/`/g, '``')}\``;
            const repairMethodColumns = findColumnByCanonical(['Repair methods', 'repair_methods', 'repair_method', 'Procedure']);

        const updateFields = ["status = 'Fixed'"];
        const updateParams = [];

        for (const methodCol of repairMethodColumns) {
            updateFields.push(`${escapeIdentifier(methodCol)} = ?`);
            updateParams.push(normalizedMethodValue || null);
        }

        if (repairColumns.has('report_url')) {
            updateFields.push("report_url = ?");
            updateParams.push(report_url || null);
        }

        if (repairColumns.has('price') && hasPriceInPayload) {
            updateFields.push("price = ?");
            updateParams.push(normalizedPrice);
        }

        if (repairColumns.has('finished_at')) {
            updateFields.push("finished_at = NOW()");
        }

        if (repairColumns.has('updated_at')) {
            updateFields.push("updated_at = NOW()");
        }

        updateParams.push(repairId);

        const updateRepairSql = `
            UPDATE repair
            SET ${updateFields.join(', ')}
            WHERE repair_id = ?`;
        await connection.query(updateRepairSql, updateParams);

        await connection.commit();
        if (resolvedItemId && archivedAndRemoved) {
            res.json({ success: true, message: 'ปิดงานซ่อมเรียบร้อย: ย้ายอุปกรณ์ไป item_repair และลบออกจาก items แล้ว' });
        } else if (resolvedItemId && archiveSkipReason) {
            res.json({
                success: true,
                message: `ปิดงานซ่อมเรียบร้อยแล้ว (${archiveSkipReason})`
            });
        } else {
            res.json({
                success: true,
                message: archiveSkipReason || 'ปิดงานซ่อมเรียบร้อยแล้ว (ไม่มี item_id จากตาราง items จึงไม่เก็บเข้า item_repair)'
            });
        }

    } catch (err) {
        await connection.rollback();
        console.error("❌ Transaction Error:", err);
        // แสดงข้อความ Error ที่ชัดเจนหากลืมแก้ ENUM
        const userFriendlyError = err.message.includes('Data truncated') 
            ? "สถานะ 'Scrapped' ยังไม่ได้ถูกเพิ่มเข้าไปใน ENUM ของฐานข้อมูลตาราง items" 
            : err.message;
        res.status(500).json({ success: false, error: userFriendlyError });
    } finally {
        connection.release();
    }
});


// ดึงข้อมูลจากตาราง repair_item (รายการอุปกรณ์ที่นำไปซ่อม)
app.get('/api/repair-items', (req, res) => {
    db.query(
        `SELECT COUNT(*) AS total
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'item_repair'`,
        [DB_NAME],
        (tableErr, tableRows) => {
            if (tableErr) {
                return res.status(500).json({ success: false, error: tableErr.message });
            }

            const hasItemRepairTable = Number(tableRows[0]?.total || 0) > 0;
            if (!hasItemRepairTable) {
                return res.json({ success: true, data: [] });
            }

            db.query(
                `SELECT COLUMN_NAME
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'item_repair'`,
                [DB_NAME],
                (itemRepairColumnErr, itemRepairColumnRows) => {
                    if (itemRepairColumnErr) {
                        return res.status(500).json({ success: false, error: itemRepairColumnErr.message });
                    }

                    db.query(
                        `SELECT COLUMN_NAME
                         FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'repair'`,
                        [DB_NAME],
                        (repairColumnErr, repairColumnRows) => {
                            if (repairColumnErr) {
                                return res.status(500).json({ success: false, error: repairColumnErr.message });
                            }

                            const itemRepairColumns = new Set(itemRepairColumnRows.map(row => row.COLUMN_NAME));
                            const repairColumns = new Set(repairColumnRows.map(row => row.COLUMN_NAME));

                            const archiveIdSelect = itemRepairColumns.has('archive_id') ? 'ir.archive_id' : 'NULL AS archive_id';
                            const itemIdSelect = itemRepairColumns.has('item_id') ? 'ir.item_id' : 'NULL AS item_id';
                            const repairIdSelect = itemRepairColumns.has('repair_id') ? 'ir.repair_id' : 'NULL AS repair_id';
                            const itemNameSource = itemRepairColumns.has('item_name') ? 'ir.item_name' : 'NULL';
                            const serialSource = itemRepairColumns.has('Serial_Number')
                                ? 'ir.`Serial_Number`'
                                : (itemRepairColumns.has('serial_number') ? 'ir.serial_number' : 'NULL');
                            const archivedAtSelect = itemRepairColumns.has('archived_at')
                                ? 'ir.archived_at'
                                : (itemRepairColumns.has('created_at') ? 'ir.created_at AS archived_at' : 'NULL AS archived_at');

                            const itemJoinCondition = itemRepairColumns.has('item_id') ? 'ir.item_id = i.item_id' : '1 = 0';
                            const repairJoinCondition = itemRepairColumns.has('repair_id') ? 'ir.repair_id = r.repair_id' : '1 = 0';
                            const problemExpr = repairColumns.has('Procedure')
                                ? "COALESCE(r.problem, r.`Procedure`, '-')"
                                : "COALESCE(r.problem, '-')";
                            const orderByExpr = itemRepairColumns.has('archived_at')
                                ? 'ir.archived_at DESC'
                                : (itemRepairColumns.has('created_at') ? 'ir.created_at DESC' : 'r.created_at DESC');
                            const whereExpr = itemRepairColumns.has('item_id')
                                ? 'WHERE ir.item_id IS NOT NULL'
                                : '';

                            const sql = `
                                SELECT 
                                    ${archiveIdSelect},
                                    ${itemIdSelect},
                                    ${repairIdSelect},
                                    COALESCE(${itemNameSource}, i.item_name, r.brand, '-') AS item_name,
                                    COALESCE(r.employee_name, '-') AS owner_name,
                                    COALESCE(r.employees_code, '-') AS employee_code,
                                    COALESCE(i.asset_number, r.asset_number, '-') AS asset_number,
                                    COALESCE(${serialSource}, i.serial_number, r.serial_number, '-') AS serial_number,
                                    ${problemExpr} AS problem_description,
                                    COALESCE(r.brand, '-') AS brand,
                                    COALESCE(r.contract_number, '-') AS contract_number,
                                    COALESCE(r.affiliation, '-') AS affiliation,
                                    ${archivedAtSelect}
                                FROM item_repair ir
                                LEFT JOIN items i ON ${itemJoinCondition}
                                LEFT JOIN repair r ON ${repairJoinCondition}
                                ${whereExpr}
                                ORDER BY ${orderByExpr}
                            `;

                            db.query(sql, (err, results) => {
                                if (err) return res.status(500).json({ success: false, error: err.message });
                                res.json({ success: true, data: results });
                            });
                        }
                    );
                }
            );
        }
    );
});

const PORT = Number(process.env.PORT) || 5000;
console.log(`Preparing server on port ${PORT}`);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});