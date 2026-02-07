const mysql = require('mysql2/promise');

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password123',
        database: 'my_database'
    });

    try {
        await conn.query(`ALTER TABLE items MODIFY status ENUM('Available','Borrowed','Repair','Maintenance') DEFAULT 'Available'`);
        console.log('✅ Updated items.status ENUM to include Maintenance');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    await conn.end();
})();
