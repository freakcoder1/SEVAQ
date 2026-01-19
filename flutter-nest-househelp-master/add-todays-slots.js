const { Client } = require('pg');

async function addTodaysSlots() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await client.connect();
  console.log('=== ADDING SLOTS FOR TODAY ===\n');
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const todayStr = `${year}-${month}-${day}`;
  console.log(`Adding slots for: ${todayStr}`);
  
  // Define time slots for today
  const timeSlots = [
    { start: '08:00:00', end: '11:00:00' },
    { start: '11:00:00', end: '14:00:00' },
    { start: '14:00:00', end: '17:00:00' }
  ];
  
  const workers = ['worker-1', 'worker-2', 'worker-3'];
  
  let totalSlotsAdded = 0;
  
  for (const workerId of workers) {
    for (const slot of timeSlots) {
      const startTime = `${todayStr} ${slot.start}`;
      const endTime = `${todayStr} ${slot.end}`;
      const slotId = `slot-${workerId}-${todayStr}-${slot.start.replace(':', '')}`;
      
      const query = `
        INSERT INTO slot (id, workerId, startTime, endTime, isBooked)
        VALUES ($1, $2, $3, $4, $5)
      `;

      try {
        await client.query(query, [slotId, workerId, startTime, endTime, 0]);
        console.log(`✅ Added slot ${slotId} for worker ${workerId}`);
        totalSlotsAdded++;
      } catch (error) {
        // Slot might already exist, that's okay
        console.log(`ℹ️ Slot ${slotId} might already exist: ${error.message}`);
      }
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total slots added: ${totalSlotsAdded}`);
  
  // Verify slots were added
  const result = await client.query(`
    SELECT COUNT(*) as count
    FROM slot
    WHERE startTime LIKE $1
    AND isBooked = $2
  `, [`${todayStr}%`, 0]);
  const count = result.rows[0].count;
  
  console.log(`Available slots for today: ${count}`);
  await client.end();
  } catch (error) {
    console.error('Error in addTodaysSlots:', error);
    await client.end();
  }
}

addTodaysSlots();