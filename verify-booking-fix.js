const axios = require('axios');

const API_URL = 'https://sevaq-production.up.railway.app/api';

// User token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyeWFuamFpc3dhbDc5MUBnbWFpbC5jb20iLCJzdWIiOiIzYTg3MmViYi03NDc3LTQ1NGUtYTY3OC01NzE5Y2RiZDZhZDMiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3NDg4NDg1MCwiZXhwIjoxNzc0OTcxMjUwfQ.L13anbWkcKbwGqDH_yiay8v3wZJcfLTMfbRUl6IJPAE';

async function verifyBookingAssignment() {
  console.log('\n=== VERIFYING BOOKING ASSIGNMENT AFTER FIX ===\n');
  
  const bookingId = '48085d38-ae36-4c5a-bac4-bf79f02cb40d';
  
  try {
    // Get the booking to verify assignment
    const response = await axios.get(
      `${API_URL}/bookings/${bookingId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const booking = response.data;
    console.log('Booking Details:');
    console.log('  - ID:', booking.id);
    console.log('  - Status:', booking.status);
    console.log('  - Worker ID:', booking.workerId);
    console.log('  - Assigned Worker ID:', booking.assignedWorkerId);
    console.log('  - Assignment State:', booking.assignmentState);
    console.log('  - Assignment Reason:', booking.assignmentReason);
    console.log('  - Assignment Timestamp:', booking.assignmentTimestamp);
    console.log('  - Service:', booking.service?.name);
    console.log('  - Date:', booking.date);
    console.log('  - Start Time:', booking.startTime);
    console.log('  - End Time:', booking.endTime);
    
    if (booking.worker) {
      console.log('\nAssigned Worker:');
      console.log('  - ID:', booking.worker.id);
      console.log('  - Name:', booking.worker.user?.firstName, booking.worker.user?.lastName);
      console.log('  - Phone:', booking.worker.user?.phone);
      console.log('  - Is Available:', booking.worker.isAvailable);
    }
    
    console.log('\n=== VERIFICATION COMPLETE ===');
    if (booking.assignedWorkerId === 17 && booking.assignmentState === 'assigned') {
      console.log('✅ SUCCESS: Worker 17 (CP Pandey) is now assigned to the booking!');
    } else {
      console.log('❌ Assignment may not be correct');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

verifyBookingAssignment();