const { Client } = require('pg');

async function checkColumns() {
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

    const res = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'booking'
      AND (column_name LIKE 'start%' OR column_name LIKE 'end%')
    `);
    console.log('Columns:', res.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();
