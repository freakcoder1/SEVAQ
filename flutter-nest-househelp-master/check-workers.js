const { DataSource } = require('typeorm');

(async () => {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'sevaq_db',
    synchronize: false,
    logging: false
  });
  await ds.initialize();

  // Get all user IDs
  const users = await ds.query('SELECT id FROM "user" ORDER BY id');
  const userIds = new Set(users.map(u => u.id));
  console.log('All User IDs:', Array.from(userIds).slice(0, 20));

  // Check workers with IDs 1, 2, 3, 4, 5, 15 (the ones mentioned in logs)
  const workerIds = [1, 2, 3, 4, 5, 15];
  for (const id of workerIds) {
    const workers = await ds.query(
      'SELECT id, user_id FROM worker WHERE id = $1',
      [id]
    );
    if (workers.length > 0) {
      const w = workers[0];
      const hasUser = userIds.has(w.user_id);
      console.log(`Worker ${w.id}: user_id=${w.user_id}, user exists: ${hasUser}`);
    } else {
      console.log(`Worker ${id}: NOT FOUND`);
    }
  }

  // Get all workers to see the full picture
  const allWorkers = await ds.query('SELECT id, user_id FROM worker ORDER BY id');
  console.log('\nAll Workers:');
  for (const w of allWorkers) {
    const hasUser = userIds.has(w.user_id);
    console.log(`  Worker ${w.id}: user_id=${w.user_id}, user exists: ${hasUser}`);
  }

  await ds.destroy();
})();
