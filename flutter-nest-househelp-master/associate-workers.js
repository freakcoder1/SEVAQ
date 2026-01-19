const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'househelp'
});

console.log('=== ASSOCIATING WORKERS WITH HOME CLEANING SERVICE ===\n');

// Home Cleaning service ID
const homeCleaningServiceId = '79aa1876-6dfd-49ae-8aa3-8e35e6f15175';

// Workers without services (from check-workers.js output)
const workersToAssociate = [
  'caaa4d6f-edf1-4766-a349-11eadfb372fc',
  'ec0f1c29-d93f-4100-a885-8d1b374f844c',
  'dc4a2df6-dca6-4136-a468-ab357b290515'
];

async function run() {
  try {
    await client.connect();

    // Check current associations
    console.log('1. Checking current associations...');
    const checkQuery = `
      SELECT ws.worker_id, ws.service_id, w."userId", u."firstName", u."lastName"
      FROM worker_service ws
      JOIN worker w ON ws.worker_id = w.id
      JOIN "user" u ON w."userId" = u.id
      WHERE ws.service_id = $1
    `;

    const currentAssociations = await client.query(checkQuery, [homeCleaningServiceId]);
    console.log(`Current workers associated with Home Cleaning: ${currentAssociations.rows.length}`);

    // Insert associations for workers without the service
    console.log('\n2. Associating workers...');
    const insertQuery = `
      INSERT INTO worker_service (worker_id, service_id)
      VALUES ($1, $2)
      ON CONFLICT (worker_id, service_id) DO NOTHING
    `;

    let associatedCount = 0;
    for (const workerId of workersToAssociate) {
      // Check if already associated
      const existingQuery = `
        SELECT 1 FROM worker_service WHERE worker_id = $1 AND service_id = $2
      `;
      const existing = await client.query(existingQuery, [workerId, homeCleaningServiceId]);

      if (existing.rows.length === 0) {
        await client.query(insertQuery, [workerId, homeCleaningServiceId]);
        console.log(`Associated worker ${workerId} with Home Cleaning service`);
        associatedCount++;
      } else {
        console.log(`Worker ${workerId} already associated with Home Cleaning service`);
      }
    }

    console.log(`\n3. Associated ${associatedCount} workers with Home Cleaning service`);

    // Verify final associations
    console.log('\n4. Verifying final associations...');
    const finalAssociations = await client.query(checkQuery, [homeCleaningServiceId]);
    console.log(`Final workers associated with Home Cleaning: ${finalAssociations.rows.length}`);
    finalAssociations.rows.forEach((assoc, i) => {
      console.log(`${i+1}. ${assoc.firstName} ${assoc.lastName} (${assoc.worker_id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

run();