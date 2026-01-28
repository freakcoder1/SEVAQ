const { Client } = require('pg');

async function checkSlotFormat() {
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

    // Get sample slots
    const slotsResult = await client.query('SELECT * FROM slot LIMIT 5');
    
    if (slotsResult.rows.length > 0) {
      console.log('📋 Sample slots:');
      slotsResult.rows.forEach((slot, index) => {
        console.log(`\nSlot ${index + 1}:`);
        console.log(`  date: ${slot.date} (${typeof slot.date})`);
        console.log(`  startTime: ${slot.startTime} (${typeof slot.startTime})`);
        console.log(`  endTime: ${slot.endTime} (${typeof slot.endTime})`);
        console.log(`  isBooked: ${slot.isBooked}`);
      });
    } else {
      console.log('❌ No slots found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('✅ Disconnected from database');
  }
}

checkSlotFormat();
