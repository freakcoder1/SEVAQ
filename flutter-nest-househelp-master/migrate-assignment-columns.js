const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'sevaq_db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if columns exist
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'booking' AND column_name LIKE 'assignment%'
    `);
    
    console.log('📋 Current assignment columns:', res.rows.map(r => r.column_name));
    
    if (res.rows.length === 0) {
      console.log('📝 Adding assignment columns...');
      await client.query('ALTER TABLE booking ADD COLUMN assignmentType VARCHAR(50)');
      console.log('✅ Added assignmentType column');
      await client.query('ALTER TABLE booking ADD COLUMN assignmentExpiresAt TIMESTAMP');
      console.log('✅ Added assignmentExpiresAt column');
      await client.query('ALTER TABLE booking ADD COLUMN assignmentStartsAt TIMESTAMP');
      console.log('✅ Added assignmentStartsAt column');
      console.log('✅ All columns added successfully!');
    } else {
      console.log('✅ Assignment columns already exist');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

migrate().catch(e => { console.error(e); process.exit(1); });
