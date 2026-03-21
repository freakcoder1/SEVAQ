const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function checkWorkerService() {
  const client = await pool.connect();
  
  try {
    // Check worker_service table
    console.log('=== worker_service table ===');
    const workerService = await client.query(`SELECT * FROM worker_service`);
    console.log('worker_service records:', JSON.stringify(workerService.rows, null, 2));

    // Check worker_services_service table
    console.log('\n=== worker_services_service table ===');
    const workerServicesService = await client.query(`SELECT * FROM worker_services_service`);
    console.log('worker_services_service records:', JSON.stringify(workerServicesService.rows, null, 2));

    // Check the worker table to understand what workers are available
    console.log('\n=== worker table sample ===');
    const workers = await client.query(`SELECT id, userId, "isActive" FROM worker LIMIT 10`);
    console.log('Workers:', JSON.stringify(workers.rows, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkWorkerService();
