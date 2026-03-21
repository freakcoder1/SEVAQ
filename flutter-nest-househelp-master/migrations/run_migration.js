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

    // Add visitPattern column
    await client.query(`
      ALTER TABLE service_profiles
      ADD COLUMN IF NOT EXISTS visitPattern VARCHAR DEFAULT 'DAILY'
    `);
    console.log('Added visitPattern column');

    // Add maxVisitsPerDay column
    await client.query(`
      ALTER TABLE service_profiles
      ADD COLUMN IF NOT EXISTS maxVisitsPerDay INTEGER DEFAULT 1
    `);
    console.log('Added maxVisitsPerDay column');

    // Add defaultTimeWindows column
    await client.query(`
      ALTER TABLE service_profiles
      ADD COLUMN IF NOT EXISTS defaultTimeWindows JSONB
    `);
    console.log('Added defaultTimeWindows column');

    // Add preferredTimeWindow column to subscriptions
    await client.query(`
      ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS preferredTimeWindow VARCHAR
    `);
    console.log('Added preferredTimeWindow column');

    // Verify columns were created
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'service_profiles'
      AND column_name IN ('visitPattern', 'maxVisitsPerDay', 'defaultTimeWindows')
    `);
    console.log('\nService profiles columns:', result.rows);

    const subResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      AND column_name = 'preferredTimeWindow'
    `);
    console.log('Subscriptions columns:', subResult.rows);

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
