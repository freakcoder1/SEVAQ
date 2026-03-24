const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function checkOnDemand() {
  const result = await pool.query(`
    SELECT id, type, status, date, "workerId", "assignedWorkerId" 
    FROM booking 
    WHERE type='on_demand' 
    ORDER BY id DESC 
    LIMIT 15
  `);
  
  console.log('=== Recent On-Demand Bookings ===');
  result.rows.forEach(row => {
    console.log(`ID:${row.id} | Status:${row.status} | Date:${row.date} | WorkerId:${row.workerid} | AssignedWorkerId:${row.assignedworkerid}`);
  });
  
  // Get status breakdown
  const statusResult = await pool.query(`
    SELECT status, COUNT(*) as count 
    FROM booking 
    WHERE type='on_demand' 
    GROUP BY status
  `);
  
  console.log('\n=== On-Demand Status Breakdown ===');
  statusResult.rows.forEach(row => {
    console.log(`${row.status}: ${row.count}`);
  });
  
  await pool.end();
}

checkOnDemand().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
