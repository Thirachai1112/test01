const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'my_database'
  });

  try {
    const [fkRows] = await conn.query(`
      SELECT kcu.CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      WHERE kcu.TABLE_SCHEMA = DATABASE()
        AND kcu.TABLE_NAME = 'item_repair'
        AND kcu.COLUMN_NAME = 'item_id'
        AND kcu.REFERENCED_TABLE_NAME = 'items'
        AND kcu.REFERENCED_COLUMN_NAME = 'item_id'
    `);

    if (!fkRows.length) {
      console.log('✅ No FK from item_repair.item_id to items.item_id (nothing to change)');
      return;
    }

    for (const row of fkRows) {
      const fkName = row.CONSTRAINT_NAME;
      await conn.query(`ALTER TABLE item_repair DROP FOREIGN KEY \`${fkName}\``);
      console.log(`✅ Dropped foreign key: ${fkName}`);
    }

    console.log('✅ Migration completed: item_repair.item_id can now keep old id without blocking DELETE on items');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
