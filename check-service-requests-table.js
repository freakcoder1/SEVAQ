const { Pool } = require('pg');
require('dotenv').config({ path: './flutter-nest-househelp-master/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'househelp',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function checkTableStructure() {
  try {
    console.log('Checking database connection...');
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful');

    console.log('\nChecking if service_requests table exists...');
    const existsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'service_requests'
      );
    `);
    const tableExists = existsResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('✗ Table service_requests does NOT exist');
      return;
    }
    
    console.log('✓ Table service_requests exists');

    console.log('\nChecking table columns...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'service_requests'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in service_requests table:');
    console.table(columnsResult.rows);

    // Check if source column exists
    const hasSourceColumn = columnsResult.rows.some(col => col.column_name === 'source');
    if (!hasSourceColumn) {
      console.log('\n✗ ERROR: source column does NOT exist');
      console.log('Adding source column...');
      await pool.query(`
        ALTER TABLE service_requests 
        ADD COLUMN source VARCHAR(255) DEFAULT 'ONE_TIME';
      `);
      console.log('✓ Source column added successfully');
    } else {
      console.log('\n✓ Source column exists');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();