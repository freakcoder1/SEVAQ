const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    // List all tables
    console.log('=== Listing all tables ===');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));
    
    // Check if service_workers table exists
    console.log('\n=== Checking for service_workers related tables ===');
    const serviceWorkerTables = tables.rows.filter(r => 
      r.table_name.includes('service') && r.table_name.includes('worker')
    );
    console.log('Service-worker tables:', serviceWorkerTables);

    // Check how workers are linked to services - check worker table structure
    console.log('\n=== Checking worker table structure ===');
    const workerColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'worker'
      ORDER BY ordinal_position
    `);
    console.log('Worker table columns:', workerColumns.rows);

    // Check service table structure
    console.log('\n=== Checking service table structure ===');
    const serviceColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service'
      ORDER BY ordinal_position
    `);
    console.log('Service table columns:', serviceColumns.rows);

    // Check worker_services or similar junction tables
    console.log('\n=== Looking for junction tables ===');
    const junctionTables = tables.rows.filter(r => 
      r.table_name.includes('worker') || 
      r.table_name.includes('service') ||
      r.table_name.includes('_')
    );
    console.log('Potential junction tables:', junctionTables);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
