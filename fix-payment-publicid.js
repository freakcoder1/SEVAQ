const { Client } = require('pg');

async function fixPaymentPublicId() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Create UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Add publicId column
    await client.query(`
      ALTER TABLE payment 
      ADD COLUMN "publicId" uuid DEFAULT uuid_generate_v4() NOT NULL
    `);
    console.log('✅ publicId column added successfully');

    // Verify the column was added
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'payment' AND column_name = 'publicId'
    `);
    console.log('✅ Column verification:', tableInfo.rows[0]);

  } catch (error) {
    if (error.code === '42701') { // Duplicate column error
      console.log('⚠️ publicId column already exists');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    await client.end();
    console.log('✅ Disconnected from database');
  }
}

fixPaymentPublicId();
