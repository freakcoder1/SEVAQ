const { DataSource } = require('typeorm');

async function addWorkersToServiceWorker() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'househelp',
    synchronize: false,
  });

  await dataSource.initialize();

  // Check service_worker table structure
  const cols = await dataSource.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'service_worker'
  `);
  console.log('service_worker columns:', JSON.stringify(cols, null, 2));

  // Get new Noida workers
  const newWorkers = await dataSource.query(`
    SELECT w.id FROM worker w
    JOIN "user" u ON w."user_id" = u.id
    WHERE u.email LIKE 'worker.%@sevaq.local'
  `);
  console.log('New workers:', newWorkers.length);

  // Check what service IDs exist in service_worker
  const existingLinks = await dataSource.query(`
    SELECT DISTINCT "serviceId" FROM service_worker
  `);
  console.log('Existing service links:', JSON.stringify(existingLinks, null, 2));

  // Add workers to service_worker for service ID 1
  for (const worker of newWorkers) {
    try {
      await dataSource.query(`
        INSERT INTO service_worker ("workerId", "serviceId")
        VALUES ($1, 1)
        ON CONFLICT DO NOTHING
      `, [worker.id]);
      console.log('✅ Added worker', worker.id.substring(0, 8), 'to service_worker');
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  await dataSource.destroy();
}

addWorkersToServiceWorker().catch(console.error);
