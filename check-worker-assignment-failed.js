const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function checkWorkerAssignmentFailed() {
  await client.connect();
  
  // Check if column exists
  const columnCheck = await client.query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'worker_assignment_failed'
  `);
  
  console.log('Column check result:');
  console.log(JSON.stringify(columnCheck.rows, null, 2));
  
  // Check subscription 7 and 8 workerAssignmentFailed values
  const result = await client.query(`
    SELECT id, status, worker_assignment_failed 
    FROM subscriptions 
    WHERE id IN (7, 8)
  `);
  
  console.log('\nSubscription 7 and 8:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  await client.end();
}

checkWorkerAssignmentFailed().catch(console.error);
