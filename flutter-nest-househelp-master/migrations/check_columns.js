const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function checkColumns() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check service_profiles columns
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'service_profiles'
      ORDER BY column_name
    `);
    console.log('\nService profiles columns:');
    console.table(result.rows);

    // Check subscriptions columns
    const subResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY column_name
    `);
    console.log('Subscriptions columns:');
    console.table(subResult.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkColumns();
