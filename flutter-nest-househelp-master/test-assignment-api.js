const axios = require('axios');

async function testAssignmentAPI() {
  console.log('=== TESTING ASSIGNMENT API ===\n');

  // Check availability first
  console.log('1. Checking availability...');

  const availabilityResponse = await axios.post('http://0.0.0.0:56324/assignments/check-availability', {
    serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Home Cleaning
    userLat: 28.5805083,
    userLng: 77.4392111,
    startTime: '2026-01-14T10:00:00.000Z', // 10:00 AM IST
    endTime: '2026-01-14T13:00:00.000Z' // 1:00 PM IST
  });

  console.log('Availability result:', availabilityResponse.data);

  console.log('\n=== TEST COMPLETE ===');
}

testAssignmentAPI().catch(console.error);