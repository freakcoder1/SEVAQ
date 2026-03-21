const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function checkServicesByNumericId() {
  const client = await pool.connect();
  
  try {
    // Check all columns in service table - let's look for any numeric ID
    console.log('=== Checking service table for Maid Service by numeric ID ===');
    const services = await client.query(`
      SELECT id, "publicId", name, category FROM service WHERE name LIKE '%Maid%' OR category = 'Maid'
    `);
    console.log('Maid Services:', services.rows);

    // Also check by numeric id 13
    console.log('\n=== Checking service with id 13 ===');
    const service13 = await client.query(`
      SELECT * FROM service WHERE id = '13'
    `);
    console.log('Service with id 13:', service13.rows);

    // Check if there's a separate id column that's different from uuid
    console.log('\n=== Checking all services with their IDs ===');
    const allServices = await client.query(`
      SELECT id, "publicId", name, category FROM service
    `);
    console.log('All services with IDs:', allServices.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkServicesByNumericId();
