const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'househelp',
  password: 'postgres',
  port: 5432,
});

async function addWorkersToMaidService() {
  const client = await pool.connect();
  
  try {
    // Get the Maid Service UUID (service id 13)
    console.log('=== Finding Maid Service (service id 13) ===');
    const maidService = await client.query(`
      SELECT * FROM service WHERE category = 'Maid'
    `);
    console.log('Maid Service:', maidService.rows);

    if (maidService.rows.length === 0) {
      console.log('No Maid service found, checking all services:');
      const allServices = await client.query(`SELECT * FROM service`);
      console.log(allServices.rows);
      return;
    }

    const maidServiceId = maidService.rows[0].id;
    console.log('Maid Service UUID:', maidServiceId);

    // Get Home Cleaning service to find workers
    console.log('\n=== Finding Home Cleaning Service ===');
    const homeCleaningService = await client.query(`
      SELECT * FROM service WHERE name LIKE '%Home Cleaning%' OR category = 'Cleaning'
    `);
    console.log('Home Cleaning Service:', homeCleaningService.rows);

    if (homeCleaningService.rows.length === 0) {
      console.log('No Home Cleaning service found');
      return;
    }

    const homeCleaningServiceId = homeCleaningService.rows[0].id;
    console.log('Home Cleaning Service UUID:', homeCleaningServiceId);

    // Get workers for Home Cleaning from worker_service table
    console.log('\n=== Getting workers for Home Cleaning ===');
    const homeCleaningWorkers = await client.query(`
      SELECT * FROM worker_service WHERE service_id = $1
    `, [homeCleaningServiceId]);
    console.log('Workers for Home Cleaning:', homeCleaningWorkers.rows);

    // Get workers for Maid Service
    console.log('\n=== Getting workers for Maid Service ===');
    const maidServiceWorkers = await client.query(`
      SELECT * FROM worker_service WHERE service_id = $1
    `, [maidServiceId]);
    console.log('Workers for Maid Service:', maidServiceWorkers.rows);

    // Also check worker_services_service table
    console.log('\n=== Checking worker_services_service table ===');
    const workerServicesService = await client.query(`
      SELECT * FROM worker_services_service WHERE "serviceId" = $1
    `, [maidServiceId]);
    console.log('Worker_services_service for Maid:', workerServicesService.rows);

    const workerServicesServiceHC = await client.query(`
      SELECT * FROM worker_services_service WHERE "serviceId" = $1
    `, [homeCleaningServiceId]);
    console.log('Worker_services_service for Home Cleaning:', workerServicesServiceHC.rows);

    // Add workers from Home Cleaning to Maid Service
    console.log('\n=== Adding workers to Maid Service ===');
    for (const worker of homeCleaningWorkers.rows) {
      // Check if already exists in worker_service
      const existing = await client.query(`
        SELECT * FROM worker_service WHERE worker_id = $1 AND service_id = $2
      `, [worker.worker_id, maidServiceId]);

      if (existing.rows.length > 0) {
        console.log(`Worker ${worker.worker_id} already exists for Maid Service in worker_service`);
      } else {
        await client.query(`
          INSERT INTO worker_service (worker_id, service_id) VALUES ($1, $2)
        `, [worker.worker_id, maidServiceId]);
        console.log(`Added worker ${worker.worker_id} to Maid Service in worker_service`);
      }
    }

    // Also add to worker_services_service table
    for (const worker of workerServicesServiceHC.rows) {
      const existing = await client.query(`
        SELECT * FROM worker_services_service WHERE "workerId" = $1 AND "serviceId" = $2
      `, [worker.workerId, maidServiceId]);

      if (existing.rows.length > 0) {
        console.log(`Worker ${worker.workerId} already exists for Maid Service in worker_services_service`);
      } else {
        await client.query(`
          INSERT INTO worker_services_service ("workerId", "serviceId") VALUES ($1, $2)
        `, [worker.workerId, maidServiceId]);
        console.log(`Added worker ${worker.workerId} to Maid Service in worker_services_service`);
      }
    }

    // Verify the workers were added
    console.log('\n=== Verifying workers for Maid Service ===');
    const verifyMaidWorkers = await client.query(`
      SELECT * FROM worker_service WHERE service_id = $1
    `, [maidServiceId]);
    console.log('Final workers for Maid Service (worker_service):', verifyMaidWorkers.rows);
    console.log(`Total workers for Maid Service: ${verifyMaidWorkers.rows.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addWorkersToMaidService();
