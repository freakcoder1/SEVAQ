const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'sevaq_db'
});

async function addMissingColumns() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add address column to user table if it doesn't exist
    console.log('Adding address column to user table...');
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "address" varchar NULL;
    `);

    // Add yearsOfExperience column to worker table if it doesn't exist
    console.log('Adding yearsOfExperience column to worker table...');
    await client.query(`
      ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "yearsOfExperience" integer NOT NULL DEFAULT 0;
    `);

    console.log('Columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await client.end();
  }
}

addMissingColumns();