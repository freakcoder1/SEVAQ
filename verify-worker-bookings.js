const axios = require('axios');

const API_URL = 'https://sevaq-production.up.railway.app/api';

// Use worker token (CP Pandey worker app token)
const workerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImNwcGFuZGV5MUBnbWFpbC5jb20iLCJzdWIiOiJlYWM3NWQxOC1hOGRlLTRkMGQtODUyZC04YmFiZmM5NDhiZGQiLCJyb2xlIjoid29ya2VyIiwiaWF0IjoxNzczNjQ4MjAwLCJleHAiOjE3NzM3MzQ2MDB9.Bj5F8P1LqKxzN3GjX5mQv9D7k8cN2vW4yT6sR0uE4pI';

async function verifyWorkerAssignment() {
  console.log('\n=== VERIFYING WORKER 17 SEES BOOKING IN THEIR LIST ===\n');
  
  try {
    // Get bookings for worker 17 using worker endpoint
    const response = await axios.get(
      `${API_URL}/workers/me/bookings`,
      { headers: { Authorization: `Bearer ${workerToken}` } }
    );
    
    console.log('Worker bookings response:');
    console.log('Status:', response.status);
    console.log('Bookings count:', response.data.length);
    console.log('Bookings:', JSON.stringify(response.data, null, 2));
    
    // Check if our booking is in the list
    const targetBooking = response.data.find(
      b => b.id === '48085d38-ae36-4c5a-bac4-bf79f02cb40d' || b.publicId === '48085d38-ae36-4c5a-bac4-bf79f02cb40d'
    );
    
    if (targetBooking) {
      console.log('\n✅ SUCCESS! Worker 17 now sees the booking:');
      console.log('  - Booking ID:', targetBooking.id || targetBooking.publicId);
      console.log('  - Service:', targetBooking.service?.name);
      console.log('  - Date:', targetBooking.date);
      console.log('  - Status:', targetBooking.status);
      console.log('  - Start Time:', targetBooking.startTime);
    } else {
      console.log('\n❌ Booking not found in worker list');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

verifyWorkerAssignment();