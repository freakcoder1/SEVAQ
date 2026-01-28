const { Client } = require('pg');

async function checkSlotsForJanuary2026() {
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

    // Check if slots table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'slot'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ Slots table does NOT exist');
      return;
    }

    console.log('✅ Slots table exists');

    // Check slots for January 2026 (2026-01-01 to 2026-01-31)
    const slotsResult = await client.query(`
      SELECT 
        s.id,
        s."publicId",
        s."workerId",
        s."date",
        s."startTime",
        s."endTime",
        s."isBooked",
        w.name as worker_name
      FROM slot s
      JOIN worker w ON s."workerId" = w.id
      WHERE s."date" >= '2026-01-01' AND s."date" <= '2026-01-31'
      ORDER BY s."date", s."startTime"
    `);

    console.log(`\n📅 Slots available in January 2026: ${slotsResult.rows.length}`);
    
    if (slotsResult.rows.length > 0) {
      console.log('\n📋 Slot details:');
      slotsResult.rows.forEach((slot, index) => {
        console.log(`${index + 1}. Worker: ${slot.worker_name} (ID: ${slot.workerId})`);
        console.log(`   Date: ${slot.date}`);
        console.log(`   Time: ${slot.startTime} - ${slot.endTime}`);
        console.log(`   Status: ${slot.isBooked ? 'Booked' : 'Available'}`);
        console.log(`   Public ID: ${slot.publicId}`);
        console.log('---');
      });

      // Check slots for specific dates (2026-01-19 to 2026-01-21)
      const specificDatesResult = await client.query(`
        SELECT 
          s.id,
          s."publicId",
          s."workerId",
          s."date",
          s."startTime",
          s."endTime",
          s."isBooked",
          w.name as worker_name
        FROM slot s
        JOIN worker w ON s."workerId" = w.id
        WHERE s."date" >= '2026-01-19' AND s."date" <= '2026-01-21'
        ORDER BY s."date", s."startTime"
      `);

      console.log(`\n🎯 Slots available for 2026-01-19 to 2026-01-21: ${specificDatesResult.rows.length}`);
      
      if (specificDatesResult.rows.length > 0) {
        console.log('\n📋 Specific slot details:');
        specificDatesResult.rows.forEach((slot, index) => {
          console.log(`${index + 1}. Worker: ${slot.worker_name} (ID: ${slot.workerId})`);
          console.log(`   Date: ${slot.date}`);
          console.log(`   Time: ${slot.startTime} - ${slot.endTime}`);
          console.log(`   Status: ${slot.isBooked ? 'Booked' : 'Available'}`);
          console.log(`   Public ID: ${slot.publicId}`);
          console.log('---');
        });
      } else {
        console.log('\n❌ No slots available for 2026-01-19 to 2026-01-21');
        console.log('ℹ️ This is likely the reason for "No professional available" message');
      }

    } else {
      console.log('\n❌ No slots available in January 2026');
    }

    // Check workers count
    const workersResult = await client.query('SELECT COUNT(*) FROM worker WHERE isActive = true');
    console.log(`\n👥 Active workers: ${workersResult.rows[0].count}`);

    // Check service-worker associations
    const serviceWorkersResult = await client.query(`
      SELECT sw."serviceId", COUNT(*) as worker_count 
      FROM "service-worker" sw
      JOIN worker w ON sw."workerId" = w.id
      WHERE w.isActive = true
      GROUP BY sw."serviceId"
    `);

    console.log(`\n🔗 Service-worker associations:`);
    serviceWorkersResult.rows.forEach(row => {
      console.log(`Service ${row.serviceId}: ${row.worker_count} workers`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n✅ Disconnected from database');
  }
}

checkSlotsForJanuary2026();
