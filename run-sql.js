const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'sevaq_db',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const result = await client.query(`
      ALTER TABLE slot ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
    `);
    console.log('Migration executed successfully:', result.command);
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
