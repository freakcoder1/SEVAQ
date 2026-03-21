const { Client } = require('pg');

async function testInsert() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'househelp',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, let's see what columns exist
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'booking'
      ORDER BY ordinal_position
    `);
    console.log('All columns:', cols.rows.map(r => r.column_name));

    // Try to insert using ONLY the columns that exist
    console.log('\nTrying minimal insert...');
    try {
      const result = await client.query(`
        INSERT INTO booking (serviceId, userId, startTime, endTime, date, totalAmount, status, type, notes, assignmentState)
        VALUES (1, '18'::uuid, '2026-02-13 02:00:00', '2026-02-13 06:00:00', '2026-02-13', 2000, 'requested', 'on_demand', 'Test', 'pending')
        RETURNING id, startTime, endTime
      `);
      console.log('SUCCESS! Inserted:', result.rows);
    } catch (err) {
      console.log('Insert failed:', err.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

testInsert();
