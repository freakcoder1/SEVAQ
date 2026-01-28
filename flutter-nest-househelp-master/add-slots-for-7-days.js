const { Client } = require('pg');

async function addSlotsFor7Days() {
  const today = new Date();
  
  console.log('Adding slots for the next 7 days...');

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'sevaq_db'
  });

  try {
    await client.connect();

    // Define time slots
    const timeSlots = [
      { start: '08:00:00', end: '11:00:00' },
      { start: '11:00:00', end: '14:00:00' },
      { start: '14:00:00', end: '17:00:00' }
    ];

    // Generate publicId
    function generatePublicId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
      });
    }

    // Add slots for next 7 days (including tomorrow)
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log(`\nAdding slots for ${dateStr}:`);

      // Workers 1-15 (all workers)
      for (let workerId = 1; workerId <= 15; workerId++) {
        for (const slot of timeSlots) {
          const startTime = `${dateStr} ${slot.start}`;
          const endTime = `${dateStr} ${slot.end}`;
          const publicId = generatePublicId();
          
          const query = `
            INSERT INTO slot ("workerId", "startTime", "endTime", "isBooked", date, "publicId")
            VALUES ($1, $2, $3, $4, $5, $6)
          `;

          try {
            await client.query(query, [workerId, startTime, endTime, false, dateStr, publicId]);
            // console.log(`  ✅ Worker ${workerId}: ${slot.start} to ${slot.end}`);
          } catch (error) {
            // console.log(`  ℹ️ Slot exists: ${error.message}`);
          }
        }
      }

      // Verify slots were added
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM slot
        WHERE date = $1 AND "isBooked" = $2
      `, [dateStr, false]);

      const count = result.rows[0].count;
      console.log(`  Total available slots: ${count}`);
    }

    await client.end();
    console.log('\n✅ Slots added successfully for all workers for the next 7 days!');
  } catch (error) {
    console.error('Error:', error);
    await client.end();
  }
}

addSlotsFor7Days();
