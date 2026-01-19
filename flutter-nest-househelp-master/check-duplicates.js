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
      SELECT worker_id, service_id, COUNT(*) as count
      FROM worker_services_service
      GROUP BY worker_id, service_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log('No duplicates found in worker_services_service table.');
    } else {
      console.log('Duplicates found:');
      result.rows.forEach(row => {
        console.log(`Worker ID: ${row.worker_id}, Service ID: ${row.service_id}, Count: ${row.count}`);
      });
    }

    // Show all entries to understand the data
    const allQuery = `
      SELECT * FROM worker_services_service
      ORDER BY worker_id, service_id;
    `;

    const allResult = await client.query(allQuery);
    console.log('\nAll entries in worker_services_service:');
    allResult.rows.forEach(row => {
      console.log(`Worker ID: ${row.worker_id}, Service ID: ${row.service_id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkDuplicates();