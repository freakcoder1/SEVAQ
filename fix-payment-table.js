const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/sevaq_db',
});
async function run() {
  await client.connect();
  try {
    // Check current columns
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'payment'
      ORDER BY ordinal_position
    `);
    console.log('Current payment table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Add missing columns
    const existingColumns = new Set(result.rows.map(r => r.column_name.toLowerCase()));
    const missingColumns = [
      { name: 'paidAt', type: 'TIMESTAMP' },
      { name: 'status', type: 'VARCHAR(50)', defaultVal: "'PENDING'" },
    ];

    for (const col of missingColumns) {
      if (!existingColumns.has(col.name.toLowerCase())) {
        const defaultVal = col.defaultVal ? ` DEFAULT ${col.defaultVal}` : '';
        await client.query(`ALTER TABLE payment ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}${defaultVal}`);
        console.log(`Added column: ${col.name}`);
      } else {
        console.log(`Column already exists: ${col.name}`);
      }
    }
    console.log('\nDone!');
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
