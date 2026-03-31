const axios = require('axios');

const API_URL = 'https://sevaq-production.up.railway.app/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyeWFuamFpc3dhbDc5MUBnbWFpbC5jb20iLCJzdWIiOiIzYTg3MmViYi03NDc3LTQ1NGUtYTY3OC01NzE5Y2RiZDZhZDMiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3NDg4NDg1MCwiZXhwIjoxNzc0OTcxMjUwfQ.L13anbWkcKbwGqDH_yiay8v3wZJcfLTMfbRUl6IJPAE';

async function assignWorker17ToBooking() {
  console.log('\n=== ATTEMPTING TO ASSIGN WORKER 17 (CP Pandey) TO BOOKING ===\n');
  
  const bookingPublicId = '48085d38-ae36-4c5a-bac4-bf79f02cb40d';
  const workerId = 17;
  
  try {
    // Try to assign using the bookings controller endpoint
    const response = await axios.post(
      `${API_URL}/bookings/assign`,
      {
        bookingId: bookingPublicId,
        workerId: workerId.toString()
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('SUCCESS! Assignment response:', response.data);
  } catch (error) {
    console.log('ERROR:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  // Also try alternative endpoint
  try {
    const altResponse = await axios.patch(
      `${API_URL}/bookings/${bookingPublicId}`,
      {
        workerId: workerId,
        assignmentState: 'ASSIGNED'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('\nAlternative PATCH success:', altResponse.data);
  } catch (error) {
    console.log('\nAlternative PATCH error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

assignWorker17ToBooking();