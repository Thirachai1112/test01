const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const cors = require('cors');
require('dotenv').config(); // อย่าลืมสร้างไฟล์ .env เก็บค่ารหัสผ่านนะครับ

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        // ตั้งชื่อไฟล์ใหม่เป็น: id-เวลากด-นามสกุลไฟล์
        cb(null, 'item-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 2. ทำให้โฟลเดอร์ uploads เข้าถึงได้ผ่านเว็บ (Static Folder)
app.use('/uploads', express.static('uploads'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    // 1. กำหนดเงื่อนไขค้นหา
    const searchCondition = `WHERE item_name LIKE ? OR contract_number LIKE ?`;
    const searchParams = [`%${search}%`, `%${search}%`];

    // 2. Query แรก: นับจำนวนทั้งหมด (เพื่อให้คำนวณ totalPages ได้)
    const countSql = `SELECT COUNT(*) as total FROM items ${searchCondition}`;

    db.query(countSql, searchParams, (err, countResult) => {
        if (err) return res.status(500).json(err);

        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 3. Query ที่สอง: ดึงข้อมูลรายการอุปกรณ์ตามคำค้นหาและหน้าที่เลือก
        const sql = `SELECT * FROM items ${searchCondition} LIMIT ? OFFSET ?`;

        db.query(sql, [...searchParams, limit, offset], (err, results) => {
            if (err) return res.status(500).json(err);

            // 4. ส่งค่ากลับไปที่ Frontend (รูปแบบ JSON)
            res.json({
                items: results,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page
                }
            });
        });
    });
});

// 1.1 API ค้นหาอุปกรณ์
app.get('/items/search', (req, res) => {
    const searchTerm = req.query.q;

    if (!searchTerm) {
        return res.status(400).json({ error: "โปรดระบุคำที่ต้องการค้นหา" });
    }

    const sql = `
        SELECT * FROM items 
        WHERE item_name LIKE ? 
        OR serial_number LIKE ?
        OR asset_number LIKE ?
        OR item_type LIKE ?
    `;

    const values = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    db.query(sql, values, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
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
app.post('/borrow', (req, res) => {
    const { first_name, last_name, employees_code, phone_number, affiliation, item_id, note } = req.body;

    // ตรวจสอบเบื้องต้นว่ามีข้อมูลสำคัญส่งมาไหม
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
            // ถ้ามีแล้ว ให้ใช้ ID เดิม
            saveBorrowing(empResult[0].id);
        } else {
            // 2. ถ้ายังไม่มี ให้บันทึกข้อมูลพนักงานใหม่
            // ป้องกัน Error 500 โดยการใส่ค่าว่าง ('') แทนค่าที่อาจไม่ได้ส่งมา
            const sqlAddEmp = "INSERT INTO employees (first_name, last_name, employees_code, phone_number, Affiliation, role_id) VALUES (?, ?, ?, ?, ?, 2)";
            const empValues = [
                first_name || '', 
                last_name || '', 
                employees_code, 
                phone_number || '', 
                affiliation || '', 
            ];

            db.query(sqlAddEmp, empValues, (addErr, addResult) => {
                if (addErr) {
                    console.error("SQL Insert Employee Error:", addErr);
                    return res.status(500).json({ error: "ไม่สามารถเพิ่มข้อมูลพนักงานได้" });
                }
                saveBorrowing(addResult.insertId);
            });
        }

        function saveBorrowing(empId) {
            // 3. บันทึกประวัติลง borrowing_logs และ UPDATE สถานะ items
            // ตรวจสอบก่อนว่าไอเทมยังว่างอยู่ไหม (ป้องกันการกดย้ำ)
            db.query("SELECT status FROM items WHERE item_id = ?", [item_id], (qErr, qResult) => {
                if (qResult.length > 0 && qResult[0].status !== 'Available') {
                    return res.status(400).json({ error: "อุปกรณ์นี้ถูกยืมไปแล้ว" });
                }

                const sqlLog = "INSERT INTO borrowing_logs (employee_id, item_id, note, borrow_date) VALUES (?, ?, ?, NOW())";
                db.query(sqlLog, [empId, item_id, note || 'ยืมผ่านระบบ'], (logErr) => {
                    if (logErr) {
                        console.error("SQL Log Error:", logErr);
                        return res.status(500).json({ error: "บันทึกประวัติล้มเหลว" });
                    }

                    db.query("UPDATE items SET status = 'Borrowed' WHERE item_id = ?", [item_id], (upErr) => {
                        if (upErr) return res.status(500).json(upErr);
                        res.json({ message: "ยืมสำเร็จ!", employee_id: empId });
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
    // 1. รับค่า contract_number เพิ่มมาจาก req.body
    const { item_name, cat_id, asset_number, serial_number, contract_number, status } = req.body;
    const image_url = req.file ? req.file.filename : null;

    // 2. เพิ่ม contract_number ลงในคำสั่ง SQL
    const sql = `INSERT INTO items 
                 (item_name, cat_id, asset_number, serial_number, contract_number, image_url, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    // 3. ใส่ค่า contract_number ลงใน Array ของ Parameter
    db.query(sql, [item_name, cat_id, asset_number, serial_number, contract_number, image_url, status || 'Available'], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "เพิ่มอุปกรณ์เรียบร้อยแล้ว", id: result.insertId });
    });
});

// 9.API สำหรับอัปเดตรูปให้อุปกรณ์ (ใช้ item_id เป็นตัวอ้างอิง)
app.put('/update-item-all/:item_id', upload.single('image'), (req, res) => {
    const { item_id } = req.params;

    // รับค่าต่างๆ จาก Body (Postman แถบ form-data)
    const {
        item_name,
        cat_id,
        asset_number,
        serial_number,
        item_type,
        contract_number,
        status
    } = req.body;

    // เช็คว่ามีการอัปโหลดรูปใหม่มาไหม
    const newImage = req.file ? req.file.filename : null;

    // 1. ดึงข้อมูลเดิมจาก DB มาดูก่อน (เพื่อใช้ในกรณีที่บางค่าไม่ได้ส่งมา)
    db.query("SELECT * FROM items WHERE item_id = ?", [item_id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path); // ลบไฟล์ที่เพิ่งอัปโหลดถ้าไม่เจอ ID
            return res.status(404).json({ error: "ไม่พบอุปกรณ์ ID นี้" });
        }

        const currentData = results[0];

        // 2. ตั้งค่าข้อมูลที่จะบันทึก (ถ้าไม่มีค่าใหม่ส่งมา ให้ใช้ค่าเดิมจาก DB)
        const updated_item_name = item_name || currentData.item_name;
        const updated_cat_id = cat_id || currentData.cat_id;
        const updated_asset_number = asset_number || currentData.asset_number;
        const updated_serial_number = serial_number || currentData.serial_number;
        const updated_contract_number = contract_number || currentData.contract_number;
        const updated_item_type = item_type || currentData.item_type;
        const updated_status = status || currentData.status;
        const updated_image = newImage || currentData.image_url;

        // 3. คำสั่ง SQL สำหรับ Update ทุกฟิลด์
        const sql = `
            UPDATE items 
            SET item_name = ?, 
                cat_id = ?, 
                asset_number = ?, 
                serial_number = ?,
                item_type = ?,
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
            updated_item_type,
            updated_contract_number,
            updated_status,
            updated_image,
            item_id
        ];

        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json(err);

            // 4. ถ้ามีการเปลี่ยนรูปใหม่ และรูปเก่าไม่ใช่รูปพื้นฐาน ให้ลบรูปเก่าทิ้ง
            if (newImage && currentData.image_url && currentData.image_url !== 'default_device.png') {
                const oldPath = path.join(__dirname, 'uploads', currentData.image_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            res.json({
                message: "อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว!",
                updated_data: {
                    item_name: updated_item_name,
                    type: updated_item_type,
                    cat_id: updated_cat_id,
                    asset_number: updated_asset_number,
                    serial_number: updated_serial_number,
                    contract_number: updated_contract_number,
                    status: updated_status,
                    image_url: updated_image
                }
            });
        });
    });
});

//10. ตรวจสอบข้อมูลก่อนลบ
app.delete('/delete-item/:item_id', (req, res) => {
    const { item_id } = req.params;

    // 1. ตรวจสอบสถานะก่อนว่า 'Borrowed' หรือไม่
    const checkStatusSql = "SELECT status, image_url FROM items WHERE item_id = ?";

    db.query(checkStatusSql, [item_id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ error: "ไม่พบอุปกรณ์นี้ในระบบ" });

        const item = results[0];

        // 🛡️ Validation: ถ้าของถูกยืมอยู่ ห้ามลบเด็ดขาด!
        if (item.status === 'Borrowed') {
            return res.status(400).json({
                error: "ไม่สามารถลบได้: อุปกรณ์นี้กำลังถูกยืมอยู่ กรุณารอให้คืนของก่อน"
            });
        }

        // 2. ถ้าผ่าน Validation (Status เป็น Available) ให้ทำการลบ
        const deleteSql = "DELETE FROM items WHERE item_id = ?";
        db.query(deleteSql, [item_id], (deleteErr, deleteResult) => {
            if (deleteErr) return res.status(500).json(deleteErr);

            // 3. (Optional) ลบไฟล์รูปภาพในโฟลเดอร์ uploads ทิ้งด้วยเพื่อประหยัดพื้นที่
            if (item.image_url && item.image_url !== 'default_device.png') {
                const filePath = `./uploads/${item.image_url}`;
                fs.unlink(filePath, (fsErr) => {
                    if (fsErr) console.error("ไม่สามารถลบไฟล์รูปภาพได้:", fsErr);
                });
            }

            res.json({ message: "ลบอุปกรณ์และไฟล์รูปภาพเรียบร้อยแล้ว", item_id });
        });
    });
});

//11. API สำหรับลบอุปกรณ์
app.delete('/delete-item/:id', (req, res) => {
    const { id } = req.params;

    // คำสั่ง SQL สำหรับลบข้อมูล
    const sql = "DELETE FROM items WHERE item_id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting item:", err);
            return res.status(500).json({ error: "ไม่สามารถลบข้อมูลได้" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบอุปกรณ์ที่ต้องการลบ" });
        }

        res.json({ message: "ลบอุปกรณ์เรียบร้อยแล้ว!" });
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});