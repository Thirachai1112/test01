const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password123',
        database: 'my_database'
    });

    try {
        // อัพเดท records เก่าที่มี employee_id
        const [result] = await conn.query(`
            UPDATE repair r 
            JOIN employees e ON r.employee_id = e.id 
            SET 
                r.employee_name = COALESCE(r.employee_name, CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, ''))),
                r.employees_code = COALESCE(r.employees_code, e.employees_code),
                r.phone_number = COALESCE(r.phone_number, e.phone_number)
            WHERE r.employee_id IS NOT NULL
        `);

        console.log('✓ Updated ' + result.affectedRows + ' records with employee data');
        
    } catch (e) {
        console.log('✗ Error:', e.message);
    }

    await conn.end();
})();
