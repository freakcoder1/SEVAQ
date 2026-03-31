// Find Aryan's booking
const axios = require('axios');

const API_BASE = 'https://sevaq-production.up.railway.app/api';

// Aryan's credentials
const ARYAN_EMAIL = 'aryan.jaiswal@gmail.com';
const ARYAN_PASSWORD = 'Aryan@123';

const NEW_WORKER_ID = 16;

async function getToken(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return response.data.access_token;
  } catch (error) {
    console.log(`Login failed for ${email}:`, error.response?.status);
    return null;
  }
}

async function findBookings(token) {
  try {
    // Get bookings as Aryan
    const response = await axios.get(`${API_BASE}/bookings?page=1&limit=20`, {
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
    // Try to reassign via assign-worker endpoint
    const response = await axios.post(`${API_BASE}/bookings/${bookingId}/assign-worker`, 
      { workerId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Booking reassigned via assign-worker:', response.data);
    return response.data;
  } catch (error) {
    console.log('assign-worker error:', error.response?.data || error.message);
    
    // Try PATCH
    try {
      const response2 = await axios.patch(`${API_BASE}/bookings/${bookingId}`, 
        { workerId, assignedWorkerId: workerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Booking reassigned via PATCH:', response2.data);
      return response2.data;
    } catch (error2) {
      console.log('PATCH error:', error2.response?.data || error2.message);
      return null;
    }
  }
}

async function main() {
  console.log('=== Finding Aryan Jaiswal booking ===\n');
  
  // Login as Aryan
  const token = await getToken(ARYAN_EMAIL, ARYAN_PASSWORD);
  if (!token) {
    console.log('Failed to login as Aryan');
    return;
  }
  console.log('Logged in as Aryan');
  
  // Get Aryan's bookings
  const bookings = await findBookings(token);
  
  console.log(`\nFound ${bookings.length} bookings for Aryan`);
  
  // Find the March 31, 2026 booking
  const march31Bookings = bookings.filter(b => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    return bookingDate.getDate() === 31 && 
           bookingDate.getMonth() === 2 && // March (0-indexed)
           bookingDate.getFullYear() === 2026;
  });
  
  if (march31Bookings.length > 0) {
    console.log('\n=== Found booking on March 31, 2026 ===');
    console.log(JSON.stringify(march31Bookings[0], null, 2));
    
    // Try to reassign to worker 16
    console.log('\n=== Reassigning to worker 16 ===');
    await assignBooking(token, march31Bookings[0].id, NEW_WORKER_ID);
  } else {
    console.log('\nNo booking found for March 31, 2026');
    console.log('\nAll bookings:');
    bookings.forEach((b, i) => {
      console.log(`\nBooking ${i+1}:`);
      console.log(`  ID: ${b.id}`);
      console.log(`  Date: ${b.date}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  Service: ${b.service?.name}`);
      console.log(`  Worker: ${b.workerId} / ${b.assignedWorkerId}`);
    });
  }
}

main().catch(console.error);