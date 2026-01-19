const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'househelp'
});

async function removeDuplicates() {
  try {
    await client.connect();

    console.log('Removing duplicate entries from worker_services_service table...');

    // Delete duplicates, keeping only one occurrence for each worker_id, service_id pair
    const deleteQuery = `
      DELETE FROM worker_services_service a USING (
        SELECT MIN(ctid) as ctid, worker_id, service_id
        FROM worker_services_service
        GROUP BY worker_id, service_id HAVING COUNT(*) > 1
      ) b
      WHERE a.worker_id = b.worker_id
        AND a.service_id = b.service_id
        AND a.ctid <> b.ctid;
    `;

    const result = await client.query(deleteQuery);
    console.log(`Removed ${result.rowCount} duplicate entries.`);

    // Verify no duplicates remain
    const checkQuery = `
      SELECT worker_id, service_id, COUNT(*) as count
      FROM worker_services_service
      GROUP BY worker_id, service_id
      HAVING COUNT(*) > 1;
    `;

    const checkResult = await client.query(checkQuery);
    if (checkResult.rows.length === 0) {
      console.log('No duplicates remaining.');
    } else {
      console.log('Duplicates still exist:', checkResult.rows);
    }

    // Show remaining entries
    const allQuery = `
      SELECT * FROM worker_services_service
      ORDER BY worker_id, service_id;
    `;

    const allResult = await client.query(allQuery);
    console.log('\nRemaining entries in worker_services_service:');
    allResult.rows.forEach(row => {
      console.log(`ID: ${row.id}, Worker ID: ${row.worker_id}, Service ID: ${row.service_id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

removeDuplicates();