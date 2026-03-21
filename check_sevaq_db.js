const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',  // Correct database!
  password: 'postgres',
  port: 5432,
});

async function addWorkersToMaidService() {
  const client = await pool.connect();
  
  try {
    // Get all services to see what exists
    console.log('=== All services ===');
    const services = await client.query(`SELECT * FROM service`);
    console.log('Services:', JSON.stringify(services.rows, null, 2));

    // Get workers that work on service 1 (Home Cleaning)
    console.log('\n=== Workers for service 1 (Home Cleaning) ===');
    const homeCleaningWorkers = await client.query(`
      SELECT w.* FROM worker w
      JOIN worker_service ws ON w.id = ws.worker_id
      JOIN service s ON ws.service_id = s.id
      WHERE s.id = 1
    `);
    console.log('Home Cleaning Workers:', JSON.stringify(homeCleaningWorkers.rows, null, 2));

    // Check worker_service table structure
    console.log('\n=== worker_service table ===');
    const tableInfo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'worker_service'
    `);
    console.log('Columns:', JSON.stringify(tableInfo.rows, null, 2));

    // Get all workers
    console.log('\n=== All workers ===');
    const workers = await client.query(`SELECT * FROM worker`);
    console.log('Workers count:', workers.rows.length);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addWorkersToMaidService();
