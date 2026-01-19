const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'househelp'
});

async function checkDuplicates() {
  try {
    await client.connect();

    // Check for duplicates in worker_services_service table
    const query = `
      SELECT service_id, COUNT(*) as count
      FROM worker_services_service
      GROUP BY service_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `;

    const result = await client.query(query);
    console.log('Duplicate service_ids in worker_services_service:');
    console.log(result.rows);

    // Show all entries to understand the data
    const allQuery = `
      SELECT * FROM worker_services_service
      ORDER BY service_id, worker_id;
    `;

    const allResult = await client.query(allQuery);
    console.log('\nAll entries in worker_services_service:');
    console.log(allResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDuplicates();