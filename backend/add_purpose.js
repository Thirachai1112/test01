const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'my_database'
});

db.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }

    const sql = "ALTER TABLE borrowing_logs ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER note";
    
    db.query(sql, (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ Column purpose already exists');
            } else {
                console.error('Error:', err);
            }
        } else {
            console.log('✓ Column purpose added successfully');
        }
        db.end();
    });
});
