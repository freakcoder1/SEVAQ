const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sevaq_db',
  user: 'postgres',
  password: 'admin'
});

async function regenerateWorker19Slots() {
  const client = await pool.connect();
  const workerId = 19;
  
  // Time slots configuration (using full timestamps as the entity uses timestamp type)
  const timeSlots = [
    { startHour: 8, endHour: 11 },   // 08:00-11:00
    { startHour: 12, endHour: 15 },  // 12:00-15:00
    { startHour: 16, endHour: 19 }   // 16:00-19:00
  ];

  try {
    // Generate dates for next 7 days (today through 7 days from now)
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    console.log(`Generating slots for worker ${workerId} for dates: ${dates.map(d => d.toISOString().split('T')[0]).join(', ')}`);
    console.log(`Time slots: 08:00-11:00, 12:00-15:00, 16:00-19:00`);
    console.log(`Total slots to generate: ${dates.length * timeSlots.length}`);

    // First, delete existing slots for worker 19 for these dates
    const dateStrings = dates.map(d => d.toISOString().split('T')[0]);
    const deleteQuery = `
      DELETE FROM "slot" 
      WHERE "workerId" = $1 
        AND "date" = ANY($2::date[])
    `;
    
    const deleteResult = await client.query(deleteQuery, [workerId, dateStrings]);
    console.log(`Deleted ${deleteResult.rowCount} existing slots for worker ${workerId}`);

    // Insert new slots
    // The entity uses: startTime (timestamp), endTime (timestamp), isBooked (boolean), maxBookings, currentBookings
    const insertQuery = `
      INSERT INTO "slot" ("workerId", "date", "startTime", "endTime", "isBooked", "maxBookings", "currentBookings", "createdAt", "updatedAt", "publicId", "version")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, 1)
    `;

    let insertedCount = 0;
    
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      for (const slot of timeSlots) {
        // Create full timestamps for startTime and endTime
        const startTime = new Date(date);
        startTime.setHours(slot.startHour, 0, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(slot.endHour, 0, 0, 0);
        
        // Generate a UUID for publicId
        const publicId = require('crypto').randomUUID();
        
        await client.query(insertQuery, [
          workerId,
          dateStr,
          startTime.toISOString(),
          endTime.toISOString(),
          false, // isBooked = false means available
          1,     // maxBookings
          0,     // currentBookings
          publicId
        ]);
        insertedCount++;
        console.log(`  Inserted slot: ${dateStr} ${String(slot.startHour).padStart(2, '0')}:00-${String(slot.endHour).padStart(2, '0')}:00 (available)`);
      }
    }

    console.log(`\nSuccessfully inserted ${insertedCount} slots for worker ${workerId}`);

    // Verify by counting slots for worker 19
    const countQuery = `
      SELECT COUNT(*) as total_slots,
             COUNT(CASE WHEN "isBooked" = false THEN 1 END) as available_slots,
             COUNT(CASE WHEN "isBooked" = true THEN 1 END) as booked_slots
      FROM "slot"
      WHERE "workerId" = $1
    `;
    
    const countResult = await client.query(countQuery, [workerId]);
    const stats = countResult.rows[0];
    
    console.log(`\n=== Worker ${workerId} Slot Summary ===`);
    console.log(`Total slots: ${stats.total_slots}`);
    console.log(`Available slots: ${stats.available_slots}`);
    console.log(`Booked slots: ${stats.booked_slots}`);

    // Show slots for the next 7 days specifically
    const detailQuery = `
      SELECT "date", "startTime", "endTime", "isBooked"
      FROM "slot"
      WHERE "workerId" = $1
        AND "date" = ANY($2::date[])
      ORDER BY "date", "startTime"
    `;
    
    const detailResult = await client.query(detailQuery, [workerId, dateStrings]);
    
    console.log(`\n=== Worker ${workerId} Slots for Next 7 Days ===`);
    let currentDate = '';
    for (const row of detailResult.rows) {
      if (row.date !== currentDate) {
        currentDate = row.date;
        console.log(`\nDate: ${currentDate}`);
      }
      const startHour = new Date(row.startTime).getHours();
      const endHour = new Date(row.endTime).getHours();
      console.log(`  ${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00 | Available: ${!row.isBooked}`);
    }

  } catch (error) {
    console.error('Error regenerating slots:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
regenerateWorker19Slots()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error.message);
    process.exit(1);
  });
