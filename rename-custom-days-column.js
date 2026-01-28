
const { Pool } = require('pg');
require('dotenv').config({ path: './flutter-nest-househelp-master/.env' });

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function renameColumn() {
  try {
    console.log('Renaming customdays to customDays...');
    
    await pool.query(`
      ALTER TABLE subscriptions 
      RENAME COLUMN customdays TO "customDays"
    `);
    
    console.log('Column renamed successfully');
    
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
    console.error('Error renaming column:', error);
  } finally {
    await pool.end();
  }
}

renameColumn();
