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
  
  console.log('=== Fixing Subscription Status Values ===\n');
  
  // Update subscriptions 7 and 8 to uppercase 'ACTIVE'
  const updateRes = await client.query(
    "UPDATE subscriptions SET status = 'ACTIVE' WHERE id IN (7, 8) AND status = 'active'"
  );
  console.log(`Updated ${updateRes.rowCount} subscriptions from 'active' to 'ACTIVE'`);
  
  // Verify the fix
  console.log('\n=== Updated Subscriptions ===');
  const res = await client.query("SELECT id, status, \"assignedWorkerId\", \"startDate\" FROM subscriptions WHERE id IN (7, 8) ORDER BY id");
  res.rows.forEach(row => {
    console.log(`ID: ${row.id}, Status: '${row.status}', WorkerID: ${row.assignedWorkerId}, StartDate: ${row.startDate}`);
  });
  
  // Show all subscriptions
  console.log('\n=== All Subscriptions ===');
  const allRes = await client.query('SELECT id, status, \"assignedWorkerId\", \"startDate\" FROM subscriptions ORDER BY id');
  allRes.rows.forEach(row => {
    console.log(`  ID: ${row.id}, Status: '${row.status}', WorkerID: ${row.assignedWorkerId}, StartDate: ${row.startDate}`);
  });
  
  await client.end();
  console.log('\n=== Fix Complete ===');
}
main().catch(e => console.log('Error:', e.message));
