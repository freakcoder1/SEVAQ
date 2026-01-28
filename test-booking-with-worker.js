const axios = require('axios');

async function testCreateBooking() {
  try {
    console.log('📡 Testing POST /bookings endpoint with workerId...');
    
    // Create a date for tomorrow at 8:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    const bookingData = {
      userId: 18, // Test user 1
      serviceId: 1, // Home cleaning
      workerId: 3, // Vikram Singh
      startTime: tomorrow.toISOString(),
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
      notes: 'Test booking with worker assignment'
    };
    
    const response = await axios.post('http://127.0.0.1:45357/bookings', bookingData);
    
    console.log('✅ Success! Status code:', response.status);
    console.log('📄 Created booking:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreateBooking();
