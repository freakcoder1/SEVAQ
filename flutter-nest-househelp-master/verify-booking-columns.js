const { Client } = require('pg');

async function verify() {
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

    // Check all columns in booking table with camelCase names
    const res = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'booking'
      AND column_name IN ('startTime', 'endTime')
    `);
    console.log('Columns:', res.rows);

    // Check ALL time-related columns
    const allCols = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'booking'
      AND data_type LIKE '%time%'
    `);
    console.log('All time-related columns:', allCols.rows);

    // Try a simple insert with proper casting
    console.log('\nTrying to insert with explicit casting...');
    try {
      const result = await client.query(`
        INSERT INTO booking (publicId, serviceRequestId, userId, serviceId, startTime, endTime, date, totalAmount, status, type, notes, assignmentState)
        VALUES (
          gen_random_uuid(),
          gen_random_uuid(),
          '18'::uuid,
          1,
          '2026-02-13 02:00:00'::timestamp without time zone,
          '2026-02-13 06:00:00'::timestamp without time zone,
          '2026-02-13'::date,
          2000,
          'requested',
          'on_demand',
          'Test booking',
          'pending'
        )
        RETURNING id, startTime, endTime
      `);
      console.log('Insert succeeded!', result.rows);
    } catch (err) {
      console.log('Insert failed:', err.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
