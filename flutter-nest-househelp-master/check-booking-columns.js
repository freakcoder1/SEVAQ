/**
 * Direct database query using pg library
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
  console.log('=== CHECKING BOOKING TABLE WORKER COLUMNS ===\n');

  try {
    await client.connect();
    console.log('Database connected!');

    // Check bookings with workerId
    const bookingsWithWorkerId = await client.query(`
      SELECT id, status, "workerId", "assignedWorkerId", "assignmentState" 
      FROM "booking" 
      WHERE "workerId" IS NOT NULL 
      LIMIT 10
    `);
    
    console.log(`\nBookings with workerId populated: ${bookingsWithWorkerId.rowCount}`);
    if (bookingsWithWorkerId.rows.length > 0) {
      console.log('Sample:');
      bookingsWithWorkerId.rows.forEach(b => {
        console.log(`  ID: ${b.id}, Status: ${b.status}, workerId: ${b.workerId}, assignedWorkerId: ${b.assignedWorkerId}, state: ${b.assignmentState}`);
      });
    }

    // Check bookings with assignedWorkerId
    const bookingsWithAssignedWorkerId = await client.query(`
      SELECT id, status, "workerId", "assignedWorkerId", "assignmentState" 
      FROM "booking" 
      WHERE "assignedWorkerId" IS NOT NULL 
      LIMIT 10
    `);
    
    console.log(`\nBookings with assignedWorkerId populated: ${bookingsWithAssignedWorkerId.rowCount}`);
    if (bookingsWithAssignedWorkerId.rows.length > 0) {
      console.log('Sample:');
      bookingsWithAssignedWorkerId.rows.forEach(b => {
        console.log(`  ID: ${b.id}, Status: ${b.status}, workerId: ${b.workerId}, assignedWorkerId: ${b.assignedWorkerId}, state: ${b.assignmentState}`);
      });
    }

    // Check bookings where both are different
    const mismatchedBookings = await client.query(`
      SELECT id, status, "workerId", "assignedWorkerId", "assignmentState" 
      FROM "booking" 
      WHERE "workerId" IS DISTINCT FROM "assignedWorkerId" 
        AND ("workerId" IS NOT NULL OR "assignedWorkerId" IS NOT NULL)
      LIMIT 10
    `);
    
    console.log(`\nBookings where workerId != assignedWorkerId: ${mismatchedBookings.rowCount}`);
    if (mismatchedBookings.rows.length > 0) {
      console.log('Sample:');
      mismatchedBookings.rows.forEach(b => {
        console.log(`  ID: ${b.id}, Status: ${b.status}, workerId: ${b.workerId}, assignedWorkerId: ${b.assignedWorkerId}, state: ${b.assignmentState}`);
      });
    }

    // Test what getWorkerBookings query (with workerId) would return
    console.log('\n=== TESTING getWorkerBookings QUERY (using workerId) ===');
    const testWorkerId = 19;
    const queryResult = await client.query(`
      SELECT b.* FROM "booking" b WHERE b."workerId" = $1 ORDER BY b."date" ASC, b."startTime" ASC
    `, [testWorkerId]);
    console.log(`Query using workerId=${testWorkerId} returned: ${queryResult.rowCount} bookings`);

    console.log('\n=== TESTING QUERY WITH assignedWorkerId ===');
    const queryResult2 = await client.query(`
      SELECT b.* FROM "booking" b WHERE b."assignedWorkerId" = $1 ORDER BY b."date" ASC, b."startTime" ASC
    `, [testWorkerId]);
    console.log(`Query using assignedWorkerId=${testWorkerId} returned: ${queryResult2.rowCount} bookings`);

    if (queryResult2.rows.length > 0) {
      console.log('Sample bookings with assignedWorkerId:');
      queryResult2.rows.forEach(b => {
        console.log(`  ID: ${b.id}, Status: ${b.status}, workerId: ${b.workerId}, assignedWorkerId: ${b.assignedWorkerId}`);
      });
    }

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
