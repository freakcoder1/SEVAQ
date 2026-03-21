const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/sevaq_db',
});
async function run() {
  await client.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'payment'
      ORDER BY ordinal_position
    `);
    console.log('Payment table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
