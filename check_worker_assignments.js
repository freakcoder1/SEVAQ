const { AppDataSource } = require('./flutter-nest-househelp-master/src/database/data-source');

async function check() {
  const ds = await AppDataSource.initialize();
  const result = await ds.query(`
    SELECT 
      COUNT(*) as total, 
      SUM(CASE WHEN worker_id IS NOT NULL THEN 1 ELSE 0 END) as with_worker,
      SUM(CASE WHEN worker_id IS NULL THEN 1 ELSE 0 END) as without_worker
    FROM subscriptions 
    WHERE type = 'on_demand'
  `);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
