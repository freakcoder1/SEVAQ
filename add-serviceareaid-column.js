const { Client } = require('pg');

// Database connection configuration
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/sevaq_db'
});

async function addServiceAreaIdColumn() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // Check if the column already exists
    const checkColumnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'worker' 
        AND column_name = 'serviceAreaId'
    `);

    if (checkColumnResult.rows.length > 0) {
      console.log('✅ serviceAreaId column already exists in worker table');
    } else {
      console.log('Adding serviceAreaId column to worker table...');
      await client.query(`
        ALTER TABLE worker 
        ADD COLUMN "serviceAreaId" TEXT
      `);
      console.log('✅ serviceAreaId column added successfully');
    }

    // Verify the column exists
    const verifyResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'worker' 
        AND column_name = 'serviceAreaId'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Column verification successful');
    } else {
      console.error('❌ Column verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

addServiceAreaIdColumn();
