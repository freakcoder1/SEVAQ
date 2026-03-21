const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function fixFrequencyColumn() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Remove NOT NULL constraint from frequency column and set default
    await client.query(`
      ALTER TABLE subscriptions
      ALTER COLUMN frequency DROP NOT NULL,
      ALTER COLUMN frequency SET DEFAULT 'DAILY'
    `);
    console.log('Fixed frequency column - removed NOT NULL constraint and set DEFAULT DAILY');

    // Also drop the old time window columns if they exist (they're no longer needed)
    await client.query(`
      ALTER TABLE subscriptions
      ALTER COLUMN timeWindowStart DROP NOT NULL,
      ALTER COLUMN timeWindowEnd DROP NOT NULL
    `);
    console.log('Made timeWindowStart and timeWindowEnd nullable');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixFrequencyColumn();
