const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function checkWorkerServiceTable() {
  const client = await pool.connect();
  
  try {
    // Check worker_service table structure
    console.log('=== worker_service table structure ===');
    const workerServiceColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'worker_service'
      ORDER BY ordinal_position
    `);
    console.log('worker_service columns:', workerServiceColumns.rows);

    // Check worker_services_service table structure
    console.log('\n=== worker_services_service table structure ===');
    const workerServicesServiceColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'worker_services_service'
      ORDER BY ordinal_position
    `);
    console.log('worker_services_service columns:', workerServicesServiceColumns.rows);

    // Check current workers for service id 1 (Home Cleaning) - using integer id
    console.log('\n=== Checking workers for service id 1 (Home Cleaning) ===');
    const service1Workers = await client.query(`
      SELECT * FROM worker_service WHERE serviceId = 1
    `);
    console.log('Workers for service 1:', service1Workers.rows);

    // Check if there's a service with id 13
    console.log('\n=== Checking service table for id 13 ===');
    const service13 = await client.query(`
      SELECT * FROM service WHERE id = '13' OR id::text = '13'
    `);
    console.log('Service 13:', service13.rows);

    // Try with UUID format as the service table uses UUID
    console.log('\n=== Looking for Maid Service in service table ===');
    const maidService = await client.query(`
      SELECT * FROM service WHERE name LIKE '%Maid%'
    `);
    console.log('Maid Service:', maidService.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkWorkerServiceTable();
