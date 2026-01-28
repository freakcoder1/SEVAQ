const { Client } = require('pg');

async function addSlots() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${year}-${month}-${day}`;

  console.log('Adding slots for:', tomorrowStr);

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

    // Workers 1-5
    for (let workerId = 1; workerId <= 5; workerId++) {
      for (const slot of timeSlots) {
        const startTime = `${tomorrowStr} ${slot.start}`;
        const endTime = `${tomorrowStr} ${slot.end}`;
        const publicId = generatePublicId();
        
        const query = `
          INSERT INTO slot ("workerId", "startTime", "endTime", "isBooked", date, "publicId")
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        try {
          await client.query(query, [workerId, startTime, endTime, false, tomorrowStr, publicId]);
          console.log(`✅ Added slot for worker ${workerId} from ${slot.start} to ${slot.end}`);
        } catch (error) {
          console.log(`ℹ️ Slot already exists: ${error.message}`);
        }
      }
    }

    // Verify slots were added
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM slot
      WHERE date = $1 AND "isBooked" = $2
    `, [tomorrowStr, false]);

    const count = result.rows[0].count;
    console.log(`\nAvailable slots for tomorrow: ${count}`);

    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
  }
}

addSlots();