const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sevaq_db',
  user: 'postgres',
  password: 'admin'
});

async function makeSuvamAvailable() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 1: Clear worker 19 from ALL current bookings and reset assignmentState to 'pending'
    const bookingsResult = await client.query(
      'UPDATE booking SET "workerId" = NULL, "assignmentState" = \'pending\' WHERE "workerId" = 19'
    );
    console.log(`✅ Cleared worker 19 from ${bookingsResult.rowCount} bookings (reset to pending)`);
    
    // Step 2: Ensure worker 19 is marked as active in the worker table
    const workerResult = await client.query(
      'UPDATE worker SET "isActive" = true WHERE id = 19'
    );
    console.log(`✅ Worker 19 isActive set to true (rows affected: ${workerResult.rowCount})`);
    
    // Step 3: Delete existing slots for worker 19 (to avoid duplicates)
    const deleteSlotsResult = await client.query(
      'DELETE FROM slot WHERE "workerId" = 19'
    );
    console.log(`✅ Deleted ${deleteSlotsResult.rowCount} existing slots for worker 19`);
    
    // Step 4: Create slots for the next 7 days
    // Standard time slots: 08:00-11:00, 12:00-15:00, 16:00-19:00
    const slotTimes = [
      { startHour: 8, endHour: 11 },
      { startHour: 12, endHour: 15 },
      { startHour: 16, endHour: 19 }
    ];
    
    const today = new Date();
    let slotsCreated = 0;
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + dayOffset);
      const dateStr = slotDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      for (const slot of slotTimes) {
        const startTimestamp = `${dateStr}T${String(slot.startHour).padStart(2, '0')}:00:00.000Z`;
        const endTimestamp = `${dateStr}T${String(slot.endHour).padStart(2, '0')}:00:00.000Z`;
        await client.query(
          `INSERT INTO slot ("publicId", "workerId", "date", "startTime", "endTime") 
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), 19, dateStr, startTimestamp, endTimestamp]
        );
        slotsCreated++;
      }
    }
    
    console.log(`✅ Created ${slotsCreated} slots for worker 19 for the next 7 days`);
    
    // Step 5: Verify worker 19 status
    const verifyWorker = await client.query(
      'SELECT id, "isActive" FROM worker WHERE id = 19'
    );
    
    if (verifyWorker.rows.length > 0) {
      const worker = verifyWorker.rows[0];
      console.log(`\n📋 Worker 19 Status:`);
      console.log(`   isActive: ${worker.isActive}`);
    } else {
      console.log('\n⚠️  Warning: Worker 19 not found in worker table!');
    }
    
    // Step 6: Verify no bookings are assigned to worker 19
    const verifyBookings = await client.query(
      'SELECT COUNT(*) as count FROM booking WHERE "workerId" = 19'
    );
    const remainingBookings = verifyBookings.rows[0].count;
    console.log(`\n📋 Booking Verification:`);
    console.log(`   Bookings still assigned to worker 19: ${remainingBookings}`);
    
    // Step 7: Count available slots
    const verifySlots = await client.query(
      'SELECT COUNT(*) as count FROM slot WHERE "workerId" = 19'
    );
    const availableSlots = verifySlots.rows[0].count;
    console.log(`   Available slots for worker 19: ${availableSlots}`);
    
    await client.query('COMMIT');
    
    console.log('\n✅ SUCCESS: Worker 19 (Suvam Jaiswal) is now available!');
    console.log(`   - ${bookingsResult.rowCount} bookings freed`);
    console.log(`   - Worker marked as active`);
    console.log(`   - ${slotsCreated} slots created for next 7 days`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

makeSuvamAvailable().catch(console.error);
