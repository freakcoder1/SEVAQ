const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function checkServices() {
  const client = await pool.connect();
  
  try {
    // Simple query - let PostgreSQL return all columns
    console.log('=== All services ===');
    const services = await client.query(`SELECT * FROM service`);
    console.log(JSON.stringify(services.rows, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkServices();
