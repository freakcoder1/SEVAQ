const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add availabilityDetectedAt column
    await client.query(`
      ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS availabilityDetectedAt TIMESTAMP DEFAULT NULL
    `);
    console.log('Added availabilityDetectedAt column');

    // Verify column was created
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      AND column_name = 'availabilityDetectedAt'
    `);
    console.log('Column details:', result.rows);

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
