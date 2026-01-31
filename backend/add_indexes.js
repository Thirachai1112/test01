const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'my_database'
});

const queries = [
    "ALTER TABLE items ADD INDEX idx_item_name (item_name)",
    "ALTER TABLE items ADD INDEX idx_contract_number (contract_number)",
    "ALTER TABLE items ADD INDEX idx_serial_number (serial_number)"
];

db.connect(err => {
    if (err) {
        console.error('DB connect error:', err);
        process.exit(1);
    }

    (async function run() {
        for (const q of queries) {
            await new Promise(resolve => {
                db.query(q, (err) => {
                    if (err) {
                        if (err.errno === 1061) {
                            console.log('Index already exists for query:', q);
                        } else {
                            console.error('Error running query:', q, err.message);
                        }
                    } else {
                        console.log('Created index for query:', q);
                    }
                    resolve();
                });
            });
        }
        db.end();
        console.log('Done.');
    })();
});