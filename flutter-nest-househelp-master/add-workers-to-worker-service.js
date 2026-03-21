const { DataSource } = require('typeorm');

async function addWorkersToWorkerService() {
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

  // The COOK service UUID (first service)
  const cookServiceId = '165c758c-6e37-45a6-b194-6eb00a420dfd';

  // Get new Noida workers
  const newWorkers = await dataSource.query(`
    SELECT w.id FROM worker w
    JOIN "user" u ON w."user_id" = u.id
    WHERE u.email LIKE 'worker.%@sevaq.local'
  `);
  console.log('New workers to add:', newWorkers.length);

  // Add to worker_service table
  for (const worker of newWorkers) {
    try {
      await dataSource.query(`
        INSERT INTO worker_service ("worker_id", "service_id")
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [worker.id, cookServiceId]);
      console.log('✅ Added worker', worker.id.substring(0, 8), 'to worker_service');
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  // Verify
  const count = await dataSource.query(`
    SELECT COUNT(*) as total FROM worker_service WHERE "service_id" = $1
  `, [cookServiceId]);
  console.log('\n📊 Workers in COOK service:', count[0].total);

  await dataSource.destroy();
}

addWorkersToWorkerService().catch(console.error);
