const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function checkServiceTable() {
  const client = await pool.connect();
  
  try {
    // Check all columns in service table
    console.log('=== Full service table ===');
    const services = await client.query(`SELECT * FROM service`);
    console.log('All services:', services.rows);

    // Check subscriptions table to see how service is stored
    console.log('\n=== Subscriptions table service info ===');
    const subscriptions = await client.query(`
      SELECT id, service_id FROM subscriptions LIMIT 10
    `);
    console.log('Subscriptions with service_id:', subscriptions.rows);

    // Check worker_service table to understand the linking
    console.log('\n=== worker_service table all records ===');
    const workerService = await client.query(`SELECT * FROM worker_service`);
    console.log('All worker_service records:', workerService.rows);

    // Check service_profiles table
    console.log('\n=== service_profiles table ===');
    const serviceProfiles = await client.query(`SELECT * FROM service_profiles`);
    console.log('Service profiles:', serviceProfiles.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkServiceTable();
