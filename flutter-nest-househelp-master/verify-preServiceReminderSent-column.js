const { Client } = require('pg');

async function checkColumn() {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set.');
    console.error('Hint: This script should be run in the Railway service shell where DATABASE_URL is automatically available.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('📡 Connected to PostgreSQL database successfully.');

    const query = `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'booking' 
          AND column_name = 'preServiceReminderSent'
      ) AS column_exists;
    `;

    const result = await client.query(query);
    const columnExists = result.rows[0].column_exists;

    if (columnExists) {
      console.log('✅ SUCCESS: The "preServiceReminderSent" column EXISTS in the "booking" table.');
    } else {
      console.log('❌ RESULT: The "preServiceReminderSent" column DOES NOT EXIST in the "booking" table.');
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to check column existence.');
    console.error('Error details:', error.message);
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('Hint: Could not connect to the database. Check if DATABASE_URL is correct.');
    }
  } finally {
    try {
      await client.end();
      console.log('🔌 Database connection closed.');
    } catch (endError) {
      console.error('Warning: Error closing database connection:', endError.message);
    }
  }
}

checkColumn();
