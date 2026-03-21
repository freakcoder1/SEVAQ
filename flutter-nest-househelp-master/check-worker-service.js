const { DataSource } = require('typeorm');

async function checkWorkerService() {
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

  const cols = await dataSource.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'worker_service'
  `);
  console.log('worker_service columns:', JSON.stringify(cols, null, 2));

  const existing = await dataSource.query(`
    SELECT * FROM worker_service LIMIT 5
  `);
  console.log('Existing data:', JSON.stringify(existing, null, 2));

  await dataSource.destroy();
}

checkWorkerService().catch(console.error);
