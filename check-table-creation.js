const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'admin',
  port: 5432,
});

async function checkTable() {
  console.log('Checking service_requests table...');
  
  try {
    const client = await pool.connect();
    
    // Check if table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_requests'
      );
    `;
    
    const tableResult = await client.query(tableCheckQuery);
    console.log('Table exists:', tableResult.rows[0].exists);
    
    if (tableResult.rows[0].exists) {
      // Check table structure
      console.log('\nTable structure:');
      const structureQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'service_requests' 
        ORDER BY ordinal_position;
      `;
      const structureResult = await client.query(structureQuery);
      structureResult.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}`);
      });
      
      // Check if we have any data
      const countResult = await client.query('SELECT COUNT(*) FROM service_requests');
      console.log('\nNumber of rows:', countResult.rows[0].count);
    }
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTable();
