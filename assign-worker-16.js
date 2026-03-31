// Get existing bookings and assign worker 16
const axios = require('axios');

const API_BASE = 'https://sevaq-production.up.railway.app/api';

// Generate unique email with timestamp
const timestamp = Date.now();
const TEST_USER_EMAIL = `testuser${timestamp}@example.com`;
const TEST_USER_PASSWORD = 'Test1234!'; 
const TEST_USER_PHONE = `+919999${String(timestamp).slice(-7)}`;

// Store token and user info
let accessToken = null;

async function signup(email, firstName, lastName, phone, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/signup`, {
      email, firstName, lastName, phone, password
    });
    console.log('✅ Signup successful!');
    accessToken = response.data.access_token;
    return response.data;
  } catch (error) {
    console.error('❌ Signup error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function getAllBookings(token) {
  try {
    console.log('\n📋 Getting all bookings...');
    const response = await axios.get(`${API_BASE}/bookings?limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Total bookings: ${response.data.total}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get bookings error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function assignWorkerToBooking(token, bookingId, workerId) {
  try {
    console.log(`\n🔧 Assigning worker ${workerId} to booking ${bookingId}...`);
    
    const response = await axios.post(`${API_BASE}/bookings/assign`,
      { bookingId: bookingId, workerId: workerId.toString() },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Worker assigned!');
    console.log('  Status:', response.data.status);
    console.log('  Worker ID:', response.data.assignedWorkerId);
    console.log('  Assignment State:', response.data.assignmentState);
    return response.data;
  } catch (error) {
    console.error('❌ Assign worker error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('=== Getting Bookings and Assigning Worker 16 ===\n');
  
  // Signup
  console.log(`Creating test user: ${TEST_USER_EMAIL}`);
  const user = await signup(TEST_USER_EMAIL, 'Test', 'User', TEST_USER_PHONE, TEST_USER_PASSWORD);
  
  if (!user || !accessToken) {
    console.error('Signup failed');
    return;
  }
  
  // Get all bookings
  const bookingsData = await getAllBookings(accessToken);
  
  if (bookingsData && bookingsData.data && bookingsData.data.length > 0) {
    console.log('\n📋 Existing bookings:');
    bookingsData.data.forEach(b => {
      console.log(`  - ID: ${b.id}, Status: ${b.status}, Worker: ${b.assignedWorkerId || 'None'}, Service: ${b.service?.name || 'N/A'}`);
    });
    
    // Try to assign worker 16 to the first booking with REQUESTED or PENDING status
    const targetBooking = bookingsData.data.find(b => 
      b.status === 'REQUESTED' || b.status === 'PENDING'
    );
    
    if (targetBooking) {
      console.log(`\n🎯 Attempting to assign worker 16 to booking ${targetBooking.id}...`);
      await assignWorkerToBooking(accessToken, targetBooking.id, 16);
    } else {
      console.log('\n⚠️ No REQUESTED or PENDING bookings found to assign worker 16 to.');
      console.log('   You may need to create a new booking through the app.');
    }
  } else {
    console.log('\n⚠️ No existing bookings found.');
    console.log('   You need to create a booking through the app first, then assign worker 16.');
  }
}

main();