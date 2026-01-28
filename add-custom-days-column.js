
const { Pool } = require('pg');
require('dotenv').config({ path: './flutter-nest-househelp-master/.env' });

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    console.log('Adding customDays column to subscriptions table...');
    
    // First, check if the column exists
    const columnExists = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name = 'customDays'
    `);
    
    if (columnExists.rows.length > 0) {
      console.log('customDays column already exists');
      return;
    }
    
    // Add customDays column
    await pool.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN customDays jsonb
    `);
    
    console.log('customDays column added successfully');
    
    // Check the table schema after the change
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Updated table schema:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error('Error adding customDays column:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
