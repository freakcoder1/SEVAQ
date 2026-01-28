const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  try {
    console.log('Running migration to add source column to service_requests table');
    
    // Read the SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('add-service-request-source-column.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    pool.end();
  }
}

runMigration();
