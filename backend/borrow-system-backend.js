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

<<<<<<< HEAD


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // ตรวจสอบ path เพื่อกำหนด folder ถูกต้อง
        let folder = 'uploads';

        if (req.path === '/api/repair') {
            folder = 'uploads/repairs';
        } else if (req.path === '/borrow') {
            folder = 'uploads/borrowing';
        }

        // สร้าง folder ถ้ายังไม่มี
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        cb(null, folder);
    },
=======
const storage = multer.diskStorage({
    destination: 'uploads', // ตรวจสอบว่ามีโฟลเดอร์นี้ในโปรเจกต์
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
    filename: (req, file, cb) => {
        // เปลี่ยนชื่อไฟล์ป้องกันชื่อซ้ำ
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// 2. ทำให้โฟลเดอร์ uploads เข้าถึงได้ผ่านเว็บ (Static Folder)
app.use('/uploads', express.static('uploads'));
app.use('/qrcodes', express.static(path.join(__dirname, 'generated_qrcodes')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(__dirname));
// 1. เชื่อมต่อฐานข้อมูล (อ้างอิงตามโครงสร้าง 6 ตารางของคุณ)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',      // ใส่ user ของคุณ
    password: 'password123',      // ใส่ password ของคุณ
    database: 'my_database', // เปลี่ยนเป็นชื่อ DB ที่คุณตั้ง
    waitForConnections: true,
    connectionLimit: 10
});


app.get('/items', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // กรองสถานะที่ถูกลบออก และค้นหาตามชื่อ/เลขสัญญา/Serial Number
    const searchCondition = `
        WHERE items.status != 'Deleted' 
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
            res.json({
                items: results,
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
<<<<<<< HEAD

=======
            
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
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

        // ปรับแต่ง URL รูปภาพให้สมบูรณ์ เพื่อให้ Frontend นำไปใช้ได้ทันที
        const updatedResults = results.map(item => ({
            ...item,
            image_url: `http://localhost:5000/uploads/${item.image_url}`
        }));

        res.json(updatedResults);
    });
});

// // 2. API สำคัญ: บันทึกการยืมของ (Transaction)
// สิ่งที่ต้องทำ: เพิ่มข้อมูลลง borrowing_logs และ เปลี่ยนสถานะไอเทมเป็น 'Borrowed'
// API สำหรับการยืมอุปกรณ์
// เพิ่ม upload.array('files', 5) เพื่อรับไฟล์ (สูงสุด 5 ไฟล์)
app.post('/borrow', upload.array('files', 5), (req, res) => {
    const { first_name, last_name, employees_code, phone_number, affiliation, item_id, note, purpose } = req.body;
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

                const sqlLog = "INSERT INTO borrowing_logs (employee_id, item_id, note, purpose, borrow_date) VALUES (?, ?, ?, ?, NOW())";
                db.query(sqlLog, [empId, item_id, note || 'ยืมผ่านระบบ', purpose || null], (logErr, logResult) => {
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
<<<<<<< HEAD
                        res.json({
                            message: "ยืมสำเร็จและอัปโหลดไฟล์เรียบร้อย!",
                            employee_id: empId,
                            log_id: logId
=======
                        res.json({ 
                            message: "ยืมสำเร็จและอัปโหลดไฟล์เรียบร้อย!", 
                            employee_id: empId,
                            log_id: logId 
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
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


// 8.API สำหรับเพิ่มอุปกรณ์ใหม่พร้อมรูปภาพ
app.post('/add-item', upload.single('image'), (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: "ไม่ได้รับข้อมูลจาก Form" });
    }

    const { item_name, cat_id, asset_number, serial_number, contract_number, status } = req.body;
<<<<<<< HEAD

=======
    
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
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

        // 🚩 ส่วนที่เพิ่มใหม่: การสร้าง QR Code (Logic จาก gen_qr.py)
        try {
            const SERVER_IP = "192.168.1.159"; // 🚩 เปลี่ยนเป็น IP เครื่องคอมคุณ
            const qrData = `http://${SERVER_IP}:5000/testqr.html?id=${newItemId}`;
<<<<<<< HEAD

=======
            
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
            // สร้างโฟลเดอร์ถ้ายังไม่มี
            const qrFolder = path.join(__dirname, 'generated_qrcodes');
            if (!fs.existsSync(qrFolder)) {
                fs.mkdirSync(qrFolder);
            }

            const qrFileName = `qr_${newItemId}.png`;
            const qrPath = path.join(qrFolder, qrFileName);

            // สร้างไฟล์ QR Code
            await QRCode.toFile(qrPath, qrData);

            console.log("✅ เพิ่มข้อมูลและสร้าง QR สำเร็จ ID:", newItemId);
<<<<<<< HEAD

=======
            
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
            // ส่งค่ากลับไปให้ Frontend
            res.json({
                message: "เพิ่มอุปกรณ์และสร้าง QR Code เรียบร้อยแล้ว",
                id: newItemId,
                image: image_url,
                qr_url: `/qrcodes/${qrFileName}` // 🚩 ส่ง URL รูป QR กลับไปโชว์
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
<<<<<<< HEAD

=======
            
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
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


<<<<<<< HEAD
app.post('/api/repair', upload.array('files', 5), (req, res) => {
    const {
        brand,
        contract_number,
        serial_number,
        asset_number,
        affiliation,
        problem,
        item_id,
        owner_name,
        employee_code,
        phone_number
    } = req.body;

    console.log("📝 Repair Request:", { brand, item_id, problem, owner_name, employee_code });

    const uploadedFiles = req.files;

    // 1. สร้างโฟลเดอร์ repairs ถ้ายังไม่มี
    const repairFolder = path.join(__dirname, 'uploads', 'repairs');
    if (!fs.existsSync(repairFolder)) {
        fs.mkdirSync(repairFolder, { recursive: true });
    }

    // 2. สร้าง path ของไฟล์ที่อัปโหลด
    const filePaths = uploadedFiles && uploadedFiles.length > 0
        ? uploadedFiles.map(file => `/uploads/repairs/${file.filename}`).join(',')
        : null;

    // 3. ดึง employee_id จาก borrowing_logs
    if (item_id) {
        const getEmployeeSql = `SELECT bl.employee_id FROM borrowing_logs bl WHERE bl.item_id = ? ORDER BY bl.borrow_date DESC LIMIT 1`;
        console.log(`🔍 Searching for employee_id for item ${item_id}...`);
        
        db.query(getEmployeeSql, [item_id], (empErr, empResult) => {
            let employeeId = null;

            if (empErr) {
                console.log(`❌ Query error: ${empErr.message}`);
            } else if (empResult.length > 0) {
                employeeId = empResult[0].employee_id;
                console.log(`✅ Found employee_id: ${employeeId} for item ${item_id}`);
            } else {
                console.log(`⚠️ No borrowing history found for item ${item_id}`);
            }

            // 4. ดึงข้อมูลพนักงาน
            let employeeName = null;
            let employeeCode = null;
            let phoneNumber = null;

            if (employeeId) {
                const getEmployeeDetailsSql = `SELECT CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) AS full_name, employees_code, phone_number FROM employees WHERE id = ?`;
                db.query(getEmployeeDetailsSql, [employeeId], (empDetailErr, empDetailResult) => {
                    if (!empDetailErr && empDetailResult.length > 0) {
                        employeeName = empDetailResult[0].full_name;
                        employeeCode = empDetailResult[0].employees_code;
                        phoneNumber = empDetailResult[0].phone_number;
                    }

                    // 5. บันทึกข้อมูลลง repair table
                    const sql = `INSERT INTO repair (brand, contract_number, serial_number, asset_number, affiliation, problem, repair_url, employee_id, employee_name, employees_code, phone_number, item_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
                    const values = [brand, contract_number, serial_number, asset_number, affiliation, problem, filePaths, employeeId, employeeName, employeeCode, phoneNumber, item_id];

                    db.query(sql, values, (err, result) => {
                        if (err) {
                            console.error("❌ Database Error:", err);
                            return res.status(500).json({
                                success: false,
                                message: "Database Error",
                                details: err.message
                            });
                        }

                        const repairId = result.insertId;
                        console.log("✅ Repair recorded ID:", repairId);
                        console.log(`📝 Employee data saved: ${employeeName} (${employeeCode}) ${phoneNumber}`);

                        // 6. อัปเดตสถานะ item เป็น "Maintenance" - รอให้เสร็จบัญชีก่อน return
                        if (item_id) {
                            console.log(`🔄 Updating item ${item_id} to Maintenance status...`);
                            const updateItemSql = "UPDATE items SET status = 'Maintenance' WHERE item_id = ?";
                            db.query(updateItemSql, [item_id], (itemErr, itemResult) => {
                                if (itemErr) {
                                    console.error("❌ Update Item Error:", itemErr);
                                } else {
                                    console.log(`✅ Item ${item_id} status updated. Affected rows:`, itemResult.affectedRows);
                                }
                                
                                // ส่งข้อมูลกลับหลังจากอัปเดตสถานะเสร็จ
                                res.status(201).json({
                                    success: true,
                                    message: "บันทึกข้อมูลสำเร็จ!",
                                    id: repairId,
                                    files_uploaded: uploadedFiles ? uploadedFiles.length : 0,
                                    file_paths: filePaths ? filePaths.split(',') : [],
                                    item_id: item_id,
                                    employee_id: employeeId,
                                    employee_name: employeeName,
                                    employees_code: employeeCode,
                                    phone_number: phoneNumber,
                                    timestamp: new Date().toISOString()
                                });
                            });
                        } else {
                            // ไม่มี item_id ส่งข้อมูลกลับเลย
                            res.status(201).json({
                                success: true,
                                message: "บันทึกข้อมูลสำเร็จ!",
                                id: repairId,
                                files_uploaded: uploadedFiles ? uploadedFiles.length : 0,
                                file_paths: filePaths ? filePaths.split(',') : [],
                                item_id: null,
                                employee_id: employeeId,
                                employee_name: employeeName,
                                employees_code: employeeCode,
                                phone_number: phoneNumber,
                                timestamp: new Date().toISOString()
                            });
                        }
                    });
                });
            } else {
                // ถ้าไม่มี employeeId ให้บันทึกเลยกับข้อมูลจากฟอร์ม
                const finalEmployeeName = owner_name || '-';
                const finalEmployeeCode = employee_code || '-';
                const finalPhoneNumber = phone_number || '-';

                const sql = `INSERT INTO repair (brand, contract_number, serial_number, asset_number, affiliation, problem, repair_url, employee_id, employee_name, employees_code, phone_number, item_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NOW(), NOW())`;
                const values = [brand, contract_number, serial_number, asset_number, affiliation, problem, filePaths, finalEmployeeName, finalEmployeeCode, finalPhoneNumber, item_id];

                db.query(sql, values, (err, result) => {
                    if (err) {
                        console.error("❌ Database Error:", err);
                        return res.status(500).json({
                            success: false,
                            message: "Database Error",
                            details: err.message
                        });
                    }

                    const repairId = result.insertId;
                    console.log("✅ Repair recorded ID (no employee):", repairId);

                    // อัปเดตสถานะ item เป็น "Maintenance" - รอให้เสร็จบัญชีก่อน return
                    if (item_id) {
                        const updateItemSql = "UPDATE items SET status = 'Maintenance' WHERE item_id = ?";
                        db.query(updateItemSql, [item_id], (itemErr, itemResult) => {
                            if (itemErr) {
                                console.error("❌ Update Item Error:", itemErr);
                            } else {
                                console.log(`✅ Item ${item_id} status updated. Affected rows:`, itemResult.affectedRows);
                            }

                            // ส่งข้อมูลกลับหลังจากอัปเดตสถานะเสร็จ
                            res.status(201).json({
                                success: true,
                                message: "บันทึกข้อมูลสำเร็จ!",
                                id: repairId,
                                files_uploaded: uploadedFiles ? uploadedFiles.length : 0,
                                file_paths: filePaths ? filePaths.split(',') : [],
                                item_id: item_id,
                                employee_id: null,
                                employee_name: finalEmployeeName,
                                employees_code: finalEmployeeCode,
                                phone_number: finalPhoneNumber,
                                timestamp: new Date().toISOString()
                            });
                        });
                    } else {
                        // ไม่มี item_id ส่งข้อมูลกลับเลย
                        res.status(201).json({
                            success: true,
                            message: "บันทึกข้อมูลสำเร็จ!",
                            id: repairId,
                            files_uploaded: uploadedFiles ? uploadedFiles.length : 0,
                            file_paths: filePaths ? filePaths.split(',') : [],
                            item_id: null,
                            employee_id: null,
                            employee_name: finalEmployeeName,
                            employees_code: finalEmployeeCode,
                            phone_number: finalPhoneNumber,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
        });
    } else {
        // ถ้าไม่มี item_id ให้ insert เลยกับข้อมูลจากฟอร์ม
        const finalEmployeeName = owner_name || '-';
        const finalEmployeeCode = employee_code || '-';
        const finalPhoneNumber = phone_number || '-';

        const sql = `INSERT INTO repair (brand, contract_number, serial_number, asset_number, affiliation, problem, repair_url, employee_name, employees_code, phone_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        const values = [brand, contract_number, serial_number, asset_number, affiliation, problem, filePaths, finalEmployeeName, finalEmployeeCode, finalPhoneNumber];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("❌ Database Error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Database Error",
                    details: err.message
                });
            }

            const repairId = result.insertId;
            console.log("✅ Repair recorded ID (no item):", repairId);

            const finalEmployeeName = owner_name || '-';
            const finalEmployeeCode = employee_code || '-';
            const finalPhoneNumber = phone_number || '-';

            res.status(201).json({
                success: true,
                message: "บันทึกข้อมูลสำเร็จ!",
                id: repairId,
                files_uploaded: uploadedFiles ? uploadedFiles.length : 0,
                file_paths: filePaths ? filePaths.split(',') : [],
                item_id: null,
                employee_id: null,
                employee_name: finalEmployeeName,
                employees_code: finalEmployeeCode,
                phone_number: finalPhoneNumber,
                timestamp: new Date().toISOString()
            });
        });
    }
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

    // 1. ค้นหาจาก brand, serial_number, asset_number, problem
    const searchCondition = search
        ? ` WHERE r.brand LIKE ? OR r.contract_number LIKE ? OR r.serial_number LIKE ? OR r.asset_number LIKE ? OR r.problem LIKE ? OR r.created_at LIKE ? OR r.updated_at LIKE ? OR r.affiliation LIKE ? `
        : '';

    const searchParams = search
        ? Array(8).fill(`%${search}%`)
        : [];

    // 2. นับจำนวนทั้งหมด
    const countSql = `
        SELECT COUNT(*) as total 
        FROM repair r
        ${searchCondition}
    `;

    db.query(countSql, searchParams, (err, countResult) => {
        if (err) {
            console.error("❌ Count Error:", err);
            return res.status(500).json({
                success: false,
                message: "Error counting records",
                error: err.message
            });
        }

        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        // 3. ดึงข้อมูลอย่างละเอียด พร้อมข้อมูลพนักงานจากหลายแหล่ง
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
                CASE 
                    WHEN TRIM(COALESCE(r.employee_name, '')) != '' THEN TRIM(r.employee_name)
                    WHEN TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, ''))) != '' THEN TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')))
                    ELSE '-'
                END AS employee_name,
                COALESCE(r.employees_code, e.employees_code, '-') AS employees_code,
                COALESCE(r.phone_number, e.phone_number, '-') AS phone_number
            FROM repair r
            LEFT JOIN employees e ON r.employee_id = e.id
            ${searchCondition}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        const params = [...searchParams, limit, offset];

        db.query(sql, params, (err, results) => {
            if (err) {
                console.error("❌ Select Error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error fetching repairs",
                    error: err.message
                });
            }

            // 4. ผ่าน path ไฟล์แยกออกมาเป็น Array
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
=======
app.post('/api/repair', (req, res) => {
    const { 
        brand, 
        contract_number, 
        serial_number, 
        asset_number, 
        affiliation, 
        problem 
    } = req.body;

    const sql = `INSERT INTO repair (brand, contract_number, serial_number, asset_number, affiliation, problem) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    const values = [brand, contract_number, serial_number, asset_number, affiliation, problem];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database Error" });
        }
        res.status(201).json({ 
            success: true, 
            message: "บันทึกข้อมูลสำเร็จ!", 
            id: result.insertId 
        });
    });
});

/**
 * 3. GET API: ดึงข้อมูลทั้งหมดออกมาดู (เผื่อเอาไปทำตาราง Dashboard)
 */
app.get('/api/repair', (req, res) => {
    db.query('SELECT * FROM repair', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
>>>>>>> 442d9451970f7af6897cb31123546de110af8576
    });
});

const PORT = 5000;
console.log('Server is running on port 5000');
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});