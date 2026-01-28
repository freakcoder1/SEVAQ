const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sevaq_db',
});

async function runMigration() {
  try {
    console.log('Running service profiles and subscriptions tables migration...');
    
    // Read the SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('run-create-service-profiles-and-subscriptions-tables.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

runMigration();
