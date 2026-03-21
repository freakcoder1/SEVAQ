// Migration script to change booking startTime and endTime from 'time' to 'timestamp'
const { Client } = require('pg');

async function runMigration() {
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

    // Change startTime from time to timestamp
    await client.query(`
      ALTER TABLE booking
      ALTER COLUMN startTime TYPE timestamp
    `);
    console.log('Changed startTime from time to timestamp');

    // Change endTime from time to timestamp
    await client.query(`
      ALTER TABLE booking
      ALTER COLUMN endTime TYPE timestamp
    `);
    console.log('Changed endTime from time to timestamp');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
