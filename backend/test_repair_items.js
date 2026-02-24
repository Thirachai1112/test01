const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'my_database'
  });

  try {
    const sql = `
        SELECT 
            ir.archive_id,
            ir.item_id,
            ir.repair_id,
            COALESCE(ir.item_name, i.item_name, r.brand, '-') AS item_name,
            COALESCE(r.employee_name, '-') AS owner_name,
            COALESCE(r.employees_code, '-') AS employee_code,
            COALESCE(i.asset_number, r.asset_number, '-') AS asset_number,
            COALESCE(ir.Serial_Number, i.serial_number, r.serial_number, '-') AS serial_number,
            COALESCE(r.problem, r.\`Procedure\`, '-') AS problem_description,
            ir.archived_at
        FROM item_repair ir
        LEFT JOIN items i ON ir.item_id = i.item_id
        LEFT JOIN repair r ON ir.repair_id = r.repair_id
        ORDER BY ir.archived_at DESC
    `;
    
    const [rows] = await conn.query(sql);
    console.log('✅ Success:', rows.length, 'rows');
    console.log('Sample data:', JSON.stringify(rows.slice(0, 2), null, 2));
  } catch(e) {
    console.error('❌ Error:', e.message);
    console.error('SQL State:', e.sqlState);
    console.error('Code:', e.code);
  }
  
  await conn.end();
})();
