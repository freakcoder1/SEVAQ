const axios = require('axios');

async function testBooking153() {
  try {
    console.log('Checking booking 153...');
    
    const response = await axios.get('http://127.0.0.1:45357/bookings/153');
    console.log('✅ Success! Status code:', response.status);
    console.log('📄 Booking details:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBooking153();
