// Update test booking status to PENDING so worker can accept
const axios = require('axios');

const API_BASE = 'https://sevaq-production.up.railway.app/api';

const USER_EMAIL = 'brand_new_test_1774845295463@test.com';
const USER_PASSWORD = 'Test1234!';

let userToken = null;

async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    userToken = response.data.access_token;
    return response.data;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function updateBookingStatus(bookingId, status) {
  try {
    console.log(`\n🔄 Updating booking ${bookingId} status to ${status}...`);
    
    const response = await axios.patch(`${API_BASE}/bookings/${bookingId}`,
      { status: status },
      { headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Status updated!');
    console.log('  New Status:', response.data.status);
    console.log('  Assignment State:', response.data.assignmentState);
    return response.data;
  } catch (error) {
    console.error('❌ Update error:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

async function getBooking(bookingId) {
  try {
    const response = await axios.get(`${API_BASE}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('Current booking:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Get booking error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('=== Updating Test Booking Status ===\n');
  
  // Login
  await login(USER_EMAIL, USER_PASSWORD);
  
  if (!userToken) {
    console.error('Login failed');
    return;
  }
  
  // Get current booking status
  const BOOKING_ID = 'cb7c605c-55be-4ecd-a731-f76db619c3eb';
  console.log('Checking current status of booking:', BOOKING_ID);
  await getBooking(BOOKING_ID);
  
  // Update to PENDING
  const updated = await updateBookingStatus(BOOKING_ID, 'pending');
  
  if (updated) {
    console.log('\n=== SUCCESS! Booking is now PENDING ===');
    console.log(`Booking ID: ${updated.id}`);
    console.log(`Status: ${updated.status}`);
    console.log(`Worker ID: ${updated.assignedWorkerId}`);
    console.log('\n✅ Worker 16 can now accept this booking in the app!');
  }
}

main();
