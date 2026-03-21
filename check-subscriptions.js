const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  database: 'sevaq_db',
  user: 'postgres',
  password: 'postgres',
  port: 5432
});
async function main() {
  await client.connect();
  const res = await client.query('SELECT id, service_profile_id, status, assigned_worker_id, start_date FROM subscriptions ORDER BY id');
  console.log('Subscriptions:');
  res.rows.forEach(row => {
    console.log(`  ID: ${row.id}, ServiceProfile: ${row.service_profile_id}, Status: ${row.status}, WorkerID: ${row.assigned_worker_id}, StartDate: ${row.start_date}`);
  });
  await client.end();
}
main().catch(e => console.log('Error:', e.message));
