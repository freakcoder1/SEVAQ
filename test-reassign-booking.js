// Reassign booking to new worker
const axios = require('axios');

const API_BASE = 'https://sevaq-production.up.railway.app/api';

// Test credentials - worker email
const WORKER_EMAIL = 'brand_new_test_1774845295463@test.com';
const WORKER_PASSWORD = 'Test1234!';

const NEW_WORKER_ID = 16;

async function getToken(email, password) {
  const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return response.data.access_token;
}

async function getAllBookings(token) {
  try {
    // Get all bookings with pagination
    const response = await axios.get(`${API_BASE}/bookings?page=1&limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data || [];
  } catch (error) {
    console.log('Error getting bookings:', error.response?.data || error.message);
    return [];
  }
}

async function assignBooking(token, bookingId, workerId) {
  try {
    // Try PATCH endpoint
    const response = await axios.patch(`${API_BASE}/bookings/${bookingId}/assign`, 
      { workerId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Booking reassigned:', response.data);
    return response.data;
  } catch (error) {
    console.log('PATCH error:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('=== Finding and reassigning booking ===\n');
  
  // Login as worker
  const token = await getToken(WORKER_EMAIL, WORKER_PASSWORD);
  console.log('Token obtained');
  
  // Get all bookings
  console.log('\n--- Getting all bookings ---');
  const bookings = await getAllBookings(token);
  
  if (bookings && bookings.length > 0) {
    console.log(`Found ${bookings.length} bookings`);
    
    // Print all bookings with details
    bookings.forEach((b, i) => {
      console.log(`\nBooking ${i+1}:`);
      console.log(`  ID: ${b.id}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  Worker: ${b.workerId} (assignedWorkerId: ${b.assignedWorkerId})`);
      console.log(`  Service: ${b.service?.name || 'N/A'}`);
    });
    
    // Find bookings not assigned to our worker
    const availableBookings = bookings.filter(b => 
      b.assignedWorkerId !== NEW_WORKER_ID && 
      (b.status === 'PENDING' || b.status === 'REQUESTED')
    );
    
    console.log('\n--- Available bookings to reassign ---');
    console.log(JSON.stringify(availableBookings, null, 2));
    
    if (availableBookings.length > 0) {
      // Try to reassign the first available booking
      const bookingToReassign = availableBookings[0];
      console.log('\n--- Reassigning booking', bookingToReassign.id, '---');
      await assignBooking(token, bookingToReassign.id, NEW_WORKER_ID);
    } else {
      console.log('\nNo bookings available to reassign');
    }
  } else {
    console.log('No bookings found');
  }
}

main().catch(console.error);