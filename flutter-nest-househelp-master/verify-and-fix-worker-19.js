const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sevaq_db',
  user: 'postgres',
  password: 'admin'
});

async function verifyAndFixWorker19() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database\n');

    // Step 1: Check worker status (join with user to get name)
    console.log('=== Step 1: Checking Worker 19 Status ===');
    const workerResult = await client.query(
      `SELECT w.id, w."isActive", w."isAvailable", u."firstName", u."lastName" 
       FROM worker w 
       LEFT JOIN "user" u ON w.user_id = u.id 
       WHERE w.id = 19`
    );
    
    if (workerResult.rows.length === 0) {
      console.log('Worker 19 not found!');
      return;
    }

    const worker = workerResult.rows[0];
    console.log('Worker ID:', worker.id);
    console.log('Name:', worker.firstName, worker.lastName);
    console.log('isActive:', worker.isActive);
    console.log('isAvailable:', worker.isAvailable);

    // Step 2: Check slot count
    console.log('\n=== Step 2: Checking Slot Count ===');
    const slotCountResult = await client.query(
      'SELECT COUNT(*) as slot_count FROM slot WHERE "workerId" = 19'
    );
    const slotCount = parseInt(slotCountResult.rows[0].slot_count);
    console.log('Current slot count:', slotCount);

    // Step 3: Check slot details
    console.log('\n=== Step 3: Checking Slot Details ===');
    const slotDetailsResult = await client.query(
      'SELECT id, "workerId", date, "startTime", "endTime", "isBooked", "maxBookings", "currentBookings" FROM slot WHERE "workerId" = 19 ORDER BY date, "startTime"'
    );
    
    if (slotDetailsResult.rows.length > 0) {
      console.log('Existing slots:');
      slotDetailsResult.rows.forEach(slot => {
        console.log(`  Slot ${slot.id}: ${slot.date} ${slot.startTime}-${slot.endTime} | Booked: ${slot.isBooked} | ${slot.currentBookings}/${slot.maxBookings}`);
      });
    } else {
      console.log('No slots found for worker 19');
    }

    // Fix worker status if needed
    if (!worker.isActive || !worker.isAvailable) {
      console.log('\n=== Fixing Worker Status ===');
      await client.query(
        'UPDATE worker SET "isActive" = true, "isAvailable" = true WHERE id = 19'
      );
      console.log('Worker 19 status updated to active and available');
    }

    // Fix slots if needed (should have 21 slots for 7 days x 3 slots per day)
    // Also check if times are correct
    const expectedSlots = 21;
    const expectedTimes = ['08:00:00', '12:00:00', '16:00:00'];
    let needsRegeneration = slotCount !== expectedSlots;
    
    if (!needsRegeneration && slotDetailsResult.rows.length > 0) {
      // Check if first day's slots have correct times
      const firstDaySlots = slotDetailsResult.rows.filter(s => {
        const slotDate = new Date(s.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return slotDate.getTime() === today.getTime();
      });
      
      if (firstDaySlots.length === 3) {
        const times = firstDaySlots.map(s => s.startTime).sort();
        const expected = [...expectedTimes].sort();
        if (JSON.stringify(times) !== JSON.stringify(expected)) {
          needsRegeneration = true;
          console.log('Slot times are incorrect, will regenerate');
        }
      } else {
        needsRegeneration = true;
      }
    }
    
    if (needsRegeneration) {
      console.log(`\n=== Regenerating Slots (expected ${expectedSlots}, found ${slotCount}) ===`);
      
      // Delete existing slots
      await client.query('DELETE FROM slot WHERE "workerId" = 19');
      console.log('Deleted existing slots');

      // Generate new slots for next 7 days
      const timeSlots = [
        { start: '08:00:00', end: '11:00:00' },
        { start: '12:00:00', end: '15:00:00' },
        { start: '16:00:00', end: '19:00:00' }
      ];

      const today = new Date();
      let insertedCount = 0;

      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        for (const timeSlot of timeSlots) {
          await client.query(
            `INSERT INTO slot ("workerId", date, "startTime", "endTime", "isBooked", "maxBookings", "currentBookings") 
             VALUES ($1, $2, $3, $4, false, 1, 0)`,
            [19, dateStr, timeSlot.start, timeSlot.end]
          );
          insertedCount++;
        }
      }

      console.log(`Inserted ${insertedCount} new slots for the next 7 days`);
    }

    // Step 4: Verify the fix
    console.log('\n=== Step 4: Final Verification ===');
    
    const finalWorkerResult = await client.query(
      `SELECT w.id, w."isActive", w."isAvailable", u."firstName", u."lastName" 
       FROM worker w 
       LEFT JOIN "user" u ON w.user_id = u.id 
       WHERE w.id = 19`
    );
    const finalWorker = finalWorkerResult.rows[0];
    console.log('Worker Status:');
    console.log('  isActive:', finalWorker.isActive);
    console.log('  isAvailable:', finalWorker.isAvailable);

    const finalSlotCountResult = await client.query(
      'SELECT COUNT(*) as slot_count FROM slot WHERE "workerId" = 19'
    );
    const finalSlotCount = parseInt(finalSlotCountResult.rows[0].slot_count);
    console.log('Final slot count:', finalSlotCount);

    const finalSlotDetailsResult = await client.query(
      'SELECT id, "workerId", date, "startTime", "endTime", "isBooked", "maxBookings", "currentBookings" FROM slot WHERE "workerId" = 19 ORDER BY date, "startTime"'
    );
    
    console.log('\nFinal slot details:');
    finalSlotDetailsResult.rows.forEach(slot => {
      console.log(`  Slot ${slot.id}: ${slot.date} ${slot.startTime}-${slot.endTime} | Booked: ${slot.isBooked} | ${slot.currentBookings}/${slot.maxBookings}`);
    });

    console.log('\n=== Verification Complete ===');
    if (finalWorker.isActive && finalWorker.isAvailable && finalSlotCount === 21) {
      console.log('SUCCESS: Worker 19 is now available with proper slots!');
    } else {
      console.log('WARNING: Worker 19 may still have issues. Please check manually.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

verifyAndFixWorker19();
