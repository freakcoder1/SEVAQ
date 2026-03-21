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
  
  // Get subscriptions 7 and 8 specifically
  console.log('=== Subscriptions 7 and 8 ===');
  const res = await client.query("SELECT id, \"serviceProfileId\", status, \"assignedWorkerId\", \"startDate\" FROM subscriptions WHERE id IN (7, 8) ORDER BY id");
  res.rows.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`  serviceProfileId: ${row.serviceProfileId}`);
    console.log(`  status: '${row.status}'`);
    console.log(`  assignedWorkerId: ${row.assignedWorkerId}`);
    console.log(`  startDate: ${row.startDate}`);
    console.log(`  status === 'ACTIVE': ${row.status === 'ACTIVE'}`);
    console.log(`  status === 'active': ${row.status === 'active'}`);
  });
  
  // Also check all subscriptions
  console.log('\n=== All Subscriptions ===');
  const allRes = await client.query('SELECT id, "serviceProfileId", status, "assignedWorkerId", "startDate" FROM subscriptions ORDER BY id');
  allRes.rows.forEach(row => {
    console.log(`  ID: ${row.id}, Status: '${row.status}', WorkerID: ${row.assignedWorkerId}, StartDate: ${row.startDate}`);
  });
  
  await client.end();
}
main().catch(e => console.log('Error:', e.message));
