const axios = require('axios');

async function testCreateBooking() {
  try {
    console.log('📡 Testing POST /bookings endpoint...');
    
    // Create a date for tomorrow at 8:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    const bookingData = {
      userId: 1, // Numeric userId
      serviceId: 1, // Numeric serviceId
      startTime: tomorrow.toISOString(),
      endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      notes: 'Test booking for tomorrow at 8 AM'
    };
    
    const response = await axios.post('http://127.0.0.1:45357/bookings', bookingData);
    
    console.log('✅ Success! Status code:', response.status);
    console.log('📄 Created booking:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  }
}

testCreateBooking();