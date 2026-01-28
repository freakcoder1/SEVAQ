const { Pool } = require('pg');
require('dotenv').config();

console.log('Connecting to PostgreSQL database...');
console.log('Config:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  database: process.env.DB_NAME || 'sevaq_db',
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sevaq_db',
});

async function checkTables() {
  try {
    // Check if we can connect
    await pool.query('SELECT 1');
    console.log('Successfully connected to database');
    
    // Get all tables in the database
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check if service_profiles and subscriptions tables exist
    const hasServiceProfiles = result.rows.some(row => row.table_name === 'service_profiles');
    const hasSubscriptions = result.rows.some(row => row.table_name === 'subscriptions');
    
    console.log(`\nservice_profiles table exists: ${hasServiceProfiles}`);
    console.log(`subscriptions table exists: ${hasSubscriptions}`);
    
    // If service_profiles exists, check how many records it has
    if (hasServiceProfiles) {
      const countResult = await pool.query('SELECT COUNT(*) FROM service_profiles');
      console.log(`Number of service profiles: ${countResult.rows[0].count}`);
    }
    
    // If subscriptions exists, check how many records it has
    if (hasSubscriptions) {
      const countResult = await pool.query('SELECT COUNT(*) FROM subscriptions');
      console.log(`Number of subscriptions: ${countResult.rows[0].count}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();
