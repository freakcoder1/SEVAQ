const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function addBookingColumns() {
  try {
    console.log('Adding missing columns to booking table...');
    
    // Add responsibilityTransferred column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "responsibilityTransferred" BOOLEAN DEFAULT FALSE
    `);
    
    // Add systemMonitoring column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "systemMonitoring" BOOLEAN DEFAULT FALSE
    `);
    
    // Add protectionStatus column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "protectionStatus" TEXT
    `);
    
    // Add assignmentState column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "assignmentState" TEXT DEFAULT 'pending'
    `);
    
    // Add assignedWorkerId column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "assignedWorkerId" INTEGER
    `);
    
    // Add assignmentReason column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "assignmentReason" TEXT
    `);
    
    // Add reassignmentCount column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "reassignmentCount" INTEGER DEFAULT 0
    `);
    
    // Add assignmentTimestamp column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "assignmentTimestamp" TIMESTAMP
    `);
    
    // Add assignmentMetadata column
    await pool.query(`
      ALTER TABLE booking 
      ADD COLUMN IF NOT EXISTS "assignmentMetadata" TEXT
    `);
    
    console.log('✅ All columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
  } finally {
    pool.end();
  }
}

addBookingColumns();