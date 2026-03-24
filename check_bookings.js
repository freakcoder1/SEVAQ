const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function checkAllBookings() {
  // First get column names from service_request
  const columns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'service_request'
  `);
  
  console.log('=== COLUMNS IN service_request ===');
  columns.rows.forEach(row => {
    console.log(row.column_name);
  });
  
  // Get all bookings from service_request
  const result = await pool.query(`
    SELECT * FROM service_request
    ORDER BY id DESC
    LIMIT 30
  `);
  
  console.log('\n=== ALL BOOKINGS from service_request (Last 30) ===');
  result.rows.forEach(row => {
    console.log(`ID:${row.id} | date:${row.date} | status:${row.status}`);
  });
  
  console.log('\nTotal service_request rows: ' + result.rows.length);
  
  // Also check the booking table
  const bookingColumns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'booking'
  `);
  
  console.log('\n=== COLUMNS IN booking ===');
  bookingColumns.rows.forEach(row => {
    console.log(row.column_name);
  });
  
  const bookingResult = await pool.query(`
    SELECT * FROM booking
    ORDER BY id DESC
    LIMIT 30
  `);
  
  console.log('\n=== ALL BOOKINGS from booking (Last 30) ===');
  bookingResult.rows.forEach(row => {
    console.log(`ID:${row.id} | date:${row.date} | status:${row.status}`);
  });
  
  console.log('\nTotal booking rows: ' + bookingResult.rows.length);
  
  await pool.end();
}

checkAllBookings().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
