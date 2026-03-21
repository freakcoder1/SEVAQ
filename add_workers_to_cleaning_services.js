const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function addWorkersToAllCleaningServices() {
  const client = await pool.connect();
  
  try {
    // Get all services
    console.log('=== All services ===');
    const services = await client.query(`SELECT * FROM service`);
    console.log('Services:', JSON.stringify(services.rows, null, 2));

    // Get workers
    console.log('\n=== Workers ===');
    const workers = await client.query(`SELECT * FROM worker`);
    console.log('Workers count:', workers.rows.length);
    
    // Print worker IDs
    console.log('\nWorker IDs:');
    workers.rows.forEach((w, i) => console.log(`${i+1}. ${w.id}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addWorkersToAllCleaningServices();
