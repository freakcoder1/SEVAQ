
const { Client } = require('pg');

async function addLocationColumn() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'sevaq_db',
  });

  await client.connect();

  try {
    // Check if location column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'location'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Location column already exists');
    } else {
      // Add location column as JSON type
      await client.query(`
        ALTER TABLE subscriptions 
        ADD COLUMN location JSONB
      `);
      console.log('✅ Location column added');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

addLocationColumn();
