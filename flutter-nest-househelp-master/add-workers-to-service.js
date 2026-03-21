const { DataSource } = require('typeorm');

async function addWorkersToService() {
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

  // Get all services
  const services = await dataSource.query('SELECT id FROM service');
  console.log('Services:', JSON.stringify(services, null, 2));

  // Get new Noida workers
  const newWorkers = await dataSource.query(`
    SELECT w.id FROM worker w
    JOIN "user" u ON w."user_id" = u.id
    WHERE u.email LIKE 'worker.%@sevaq.local'
    AND w.id NOT IN (
      SELECT "workerId" FROM worker_services_service
    )
  `);
  console.log('New workers to add:', JSON.stringify(newWorkers, null, 2));

  if (services.length > 0 && newWorkers.length > 0) {
    const serviceId = services[0].id; // Use first service (COOK)
    console.log('Adding workers to service:', serviceId);

    for (const worker of newWorkers) {
      try {
        await dataSource.query(`
          INSERT INTO worker_services_service ("workerId", "serviceId")
          VALUES ($1, $2)
        `, [worker.id, serviceId]);
        console.log('✅ Added worker', worker.id, 'to service');
      } catch (error) {
        console.error('❌ Error adding worker:', error.message);
      }
    }
  }

  await dataSource.destroy();
}

addWorkersToService().catch(console.error);
