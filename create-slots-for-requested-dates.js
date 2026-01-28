const { Client } = require('pg');

async function createSlotsForRequestedDates() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'sevaq_db',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Get all workers
    const workersResult = await client.query('SELECT * FROM worker');
    console.log(`👥 Found ${workersResult.rows.length} workers`);

    // Dates to create slots for: 2026-01-19, 2026-01-20, 2026-01-21
    const dates = ['2026-01-19', '2026-01-20', '2026-01-21'];
    
    // Time slots (3-hour slots matching existing format)
    const timeSlots = [
      { start: '08:00:00', end: '11:00:00' },
      { start: '11:00:00', end: '14:00:00' },
      { start: '14:00:00', end: '17:00:00' }
    ];

    let slotsCreated = 0;

    for (const worker of workersResult.rows) {
      for (const date of dates) {
        for (const slotTime of timeSlots) {
          // Create full timestamp strings (date + time)
          const startTime = new Date(`${date}T${slotTime.start}`);
          const endTime = new Date(`${date}T${slotTime.end}`);

          // Check if slot already exists
          const existingSlot = await client.query(`
            SELECT id FROM slot 
            WHERE "workerId" = $1 AND "date"::text = $2 AND "startTime"::text LIKE $3
          `, [worker.id, date, `${date}%${slotTime.start}`]);

          if (existingSlot.rows.length === 0) {
            await client.query(`
              INSERT INTO slot (
                "publicId", "workerId", "date", "startTime", "endTime", "isBooked"
              ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, false
              )
            `, [worker.id, new Date(date), startTime, endTime]);
            
            slotsCreated++;
          }
        }
      }
    }

    console.log(`✅ Created ${slotsCreated} new slots`);

    // Verify the slots were created
    const verifyResult = await client.query(`
      SELECT COUNT(*) FROM slot 
      WHERE "date" >= '2026-01-19' AND "date" <= '2026-01-21'
    `);
    
    console.log(`📅 Total slots available for selected dates: ${verifyResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('✅ Disconnected from database');
  }
}

createSlotsForRequestedDates();
