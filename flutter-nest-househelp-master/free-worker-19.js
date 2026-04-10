const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sevaq_db',
  user: 'postgres',
  password: 'admin'
});

async function makeWorker19Unavailable() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 1: Delete all existing slots for worker 19
    const slotResult = await client.query(
      'DELETE FROM slot WHERE "workerId" = 19'
    );
    console.log(`Deleted ${slotResult.rowCount} slots for worker 19`);
    
    // Step 2: Remove worker_id from all bookings assigned to worker 19
    const bookingsResult = await client.query(
      'UPDATE booking SET "workerId" = NULL, "assignmentState" = \'pending\' WHERE "workerId" = 19'
    );
    console.log(`Removed worker 19 from ${bookingsResult.rowCount} bookings`);
    
    // Step 3: Clear workerId from subscriptions
    const subsResult = await client.query(
      'UPDATE subscriptions SET "assignedWorkerId" = NULL WHERE "assignedWorkerId" = 19'
    );
    console.log(`Cleared worker 19 from ${subsResult.rowCount} subscriptions`);
    
    // Step 4: Clear from service_worker table
    const swResult = await client.query(
      'DELETE FROM service_worker WHERE worker_id = 19'
    );
    console.log(`Deleted ${swResult.rowCount} service_worker entries for worker 19`);
    
    // Step 5: Mark worker 19 as inactive in the worker table
    const workerResult = await client.query(
      'UPDATE worker SET "isActive" = false WHERE id = 19'
    );
    console.log(`Marked worker 19 as inactive (rows affected: ${workerResult.rowCount})`);
    
    // Step 6: Also delete any existing availability records
    const availResult = await client.query(
      'DELETE FROM availability WHERE "workerId" = 19'
    );
    console.log(`Deleted ${availResult.rowCount} availability records for worker 19`);
    
    await client.query('COMMIT');
    console.log('\n✅ Worker 19 (Suvam Jaiswal) has been completely freed and marked as inactive!');
    console.log('- All slots deleted');
    console.log('- All booking assignments removed');
    console.log('- All subscription assignments cleared');
    console.log('- Worker marked as inactive (will not receive new assignments)');
    console.log('- All availability records deleted');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

makeWorker19Unavailable().catch(console.error);
