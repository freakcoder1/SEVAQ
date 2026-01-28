const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function checkAndCreateTable() {
  try {
    console.log('Checking if service_requests table exists');
    
    // Check if table exists
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'service_requests'
      )
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('service_requests table does NOT exist');
      
      // Create the table
      console.log('Creating service_requests table');
      await pool.query(`
        CREATE TABLE service_requests (
          id VARCHAR(255) PRIMARY KEY,
          publicId VARCHAR(255) NOT NULL,
          source VARCHAR(20) NOT NULL DEFAULT 'ONE_TIME',
          userId INTEGER NOT NULL,
          serviceId INTEGER,
          serviceProfileId INTEGER,
          date DATE NOT NULL,
          timeWindow VARCHAR(50) NOT NULL,
          priceSnapshot DECIMAL(10, 2) NOT NULL,
          assignmentStatus VARCHAR(50) DEFAULT 'REQUESTED',
          assignedWorkerId INTEGER,
          assignedSlotId INTEGER,
          failureReason TEXT,
          metadata JSONB,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('service_requests table created successfully');
    } else {
      console.log('service_requests table exists');
      
      // Check if source column exists
      const columnExistsResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'service_requests' 
          AND column_name = 'source'
        )
      `);
      
      const columnExists = columnExistsResult.rows[0].exists;
      
      if (!columnExists) {
        console.log('source column does NOT exist');
        
        // Add source column
        console.log('Adding source column to service_requests table');
        await pool.query(`
          ALTER TABLE service_requests 
          ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'ONE_TIME';
        `);
        
        console.log('source column added successfully');
      } else {
        console.log('source column exists');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkAndCreateTable();
