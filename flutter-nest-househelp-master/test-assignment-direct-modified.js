const axios = require('axios');

async function testAssignment() {
  try {
    console.log('=== TESTING ASSIGNMENT SERVICE VIA API ===');

    // Test the assignment attempt
    const assignmentRequest = {
      bookingId: '777fac3f-dc1f-40e0-919e-630e192ea1dd',
      serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: '2026-01-10T08:00:00.000Z',
      endTime: '2026-01-10T11:00:00.000Z'
    };

    console.log('Attempting assignment with request:', assignmentRequest);

    const response = await axios.post('http://127.0.0.1:56324/assignments/attempt-assignment', assignmentRequest);
    console.log('Assignment result:', response.data);

  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

testAssignment();