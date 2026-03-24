const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sevaq_db',
  password: 'postgres',
  port: 5432,
});

async function checkAllBookings() {
  let output = '';
  
  // First get column names from service_request
  const columns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'service_request'
  `);
  
  output += '=== COLUMNS IN service_request ===\n';
  columns.rows.forEach(row => {
    output += row.column_name + '\n';
  });
  
  output += '\n';
  
  // Get all bookings from service_request
  const result = await pool.query(`
    SELECT * FROM service_request
    ORDER BY id DESC
    LIMIT 30
  `);
  
  output += '=== ALL BOOKINGS from service_request (Last 30) ===\n\n';
  result.rows.forEach(row => {
    output += `ID:${row.id} | date:${row.date} | status:${row.status}\n`;
  });
  
  output += '\nTotal service_request rows: ' + result.rows.length + '\n';
  
  // Also check the booking table
  const bookingColumns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'booking'
  `);
  
  output += '\n=== COLUMNS IN booking ===\n';
  bookingColumns.rows.forEach(row => {
    output += row.column_name + '\n';
  });
  
  const bookingResult = await pool.query(`
    SELECT * FROM booking
    ORDER BY id DESC
    LIMIT 30
  `);
  
  output += '\n=== ALL BOOKINGS from booking (Last 30) ===\n\n';
  bookingResult.rows.forEach(row => {
    output += `ID:${row.id} | date:${row.date} | status:${row.status}\n`;
  });
  
  output += '\nTotal booking rows: ' + bookingResult.rows.length + '\n';
  
  fs.writeFileSync('booking_report.txt', output);
  console.log('Report written to booking_report.txt');
  
  await pool.end();
}

checkAllBookings().catch(e => {
  fs.writeFileSync('booking_error.txt', e.message);
  console.error('Error:', e.message);
});
