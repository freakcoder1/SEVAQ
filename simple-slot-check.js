const { Client } = require('pg');

async function checkSlots() {
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

    // Get workers
    const workersResult = await client.query('SELECT * FROM worker');
    console.log(`👥 Workers: ${workersResult.rows.length}`);

    // Get slots
    const slotsResult = await client.query(`
      SELECT * FROM slot 
      WHERE date >= '2026-01-01' AND date <= '2026-01-31'
    `);
    console.log(`📅 January 2026 slots: ${slotsResult.rows.length}`);

    // Get slots for specific dates
    const specificSlotsResult = await client.query(`
      SELECT * FROM slot 
      WHERE date >= '2026-01-19' AND date <= '2026-01-21'
    `);
    console.log(`🎯 Slots for 2026-01-19 to 2026-01-21: ${specificSlotsResult.rows.length}`);

    // Display available slots
    if (specificSlotsResult.rows.length > 0) {
      console.log('\n📋 Available slots:');
      specificSlotsResult.rows.forEach(slot => {
        console.log(`Worker ${slot.workerId} - ${slot.date} ${slot.startTime} - ${slot.endTime}`);
      });
    } else {
      console.log('\n❌ No slots available for selected dates');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('✅ Disconnected from database');
  }
}

checkSlots();
