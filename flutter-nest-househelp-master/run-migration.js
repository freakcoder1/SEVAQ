const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'househelp',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'last_notification_sent_at'
    `);

    if (checkResult.rows.length > 0) {
      console.log('Column last_notification_sent_at already exists');
    } else {
      await client.query(`
        ALTER TABLE subscriptions 
        ADD COLUMN last_notification_sent_at TIMESTAMP NULL
      `);
      console.log('Successfully added last_notification_sent_at column');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
