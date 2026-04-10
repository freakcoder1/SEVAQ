/**
 * Check booking table structure and data
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'househelp',
  user: 'postgres',
  password: 'postgres123',
});

async function checkBookings() {
  console.log('=== CHECKING BOOKING TABLE STRUCTURE AND DATA ===\n');

  try {
    await client.connect();
    console.log('Database connected!');

    // Check table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'booking' 
        AND column_name IN ('workerId', 'assignedWorkerId', 'id', 'status')
      ORDER BY column_name
    `);
    
    console.log('\nBooking table worker-related columns:');
    tableStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Get total booking count
    const totalBookings = await client.query(`SELECT COUNT(*) as count FROM "booking"`);
    console.log(`\nTotal bookings in table: ${totalBookings.rows[0].count}`);

    // Sample bookings
    const sampleBookings = await client.query(`
      SELECT id, status, "workerId", "assignedWorkerId", "assignmentState" 
      FROM "booking" 
      LIMIT 5
    `);
    
    console.log('\nSample bookings:');
    sampleBookings.rows.forEach(b => {
      console.log(`  ID: ${b.id}, Status: ${b.status}, workerId: ${b.workerId}, assignedWorkerId: ${b.assignedWorkerId}, state: ${b.assignmentState}`);
    });

    // Check what IDs exist in booking table
    const bookingIds = await client.query(`SELECT id FROM "booking" LIMIT 5`);
    console.log('\nBooking ID types:');
    bookingIds.rows.forEach(b => {
      console.log(`  ID: ${b.id} (type: ${typeof b.id})`);
    });

    // Check the actual column types for worker columns
    const workerColumnTypes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking' 
        AND column_name LIKE '%worker%'
    `);
    
    console.log('\nAll worker-related columns in booking table:');
    workerColumnTypes.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    await client.end();
    console.log('\n=== INVESTIGATION COMPLETE ===');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    try { await client.end(); } catch(e) {}
  }
}

checkBookings();
