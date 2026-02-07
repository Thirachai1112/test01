const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password123',
        database: 'my_database'
    });

    try {
        // 1. เพิ่มคอลัมน์ (ล้อมไว้ inside try-catch ถ้าเคยมี จะ skip)
        try {
            await conn.query('ALTER TABLE repair ADD COLUMN employee_name VARCHAR(255) DEFAULT NULL');
            console.log('✓ Added employee_name column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            console.log('✓ employee_name already exists');
        }

        try {
            await conn.query('ALTER TABLE repair ADD COLUMN employees_code VARCHAR(50) DEFAULT NULL');
            console.log('✓ Added employees_code column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            console.log('✓ employees_code already exists');
        }

        try {
            await conn.query('ALTER TABLE repair ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL');
            console.log('✓ Added phone_number column');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            console.log('✓ phone_number already exists');
        }

        // 2. อัพเดทข้อมูลพนักงานจากตาราง employees
        const [result] = await conn.query(`
            UPDATE repair r 
            LEFT JOIN employees e ON r.employee_id = e.id 
            SET 
                r.employee_name = CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')),
                r.employees_code = e.employees_code,
                r.phone_number = e.phone_number
            WHERE r.employee_id IS NOT NULL
        `);

        console.log('✓ Updated ' + result.affectedRows + ' repair records with employee data');
        console.log('\n✓ Employee data synced successfully!');

    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    await conn.end();
})();
