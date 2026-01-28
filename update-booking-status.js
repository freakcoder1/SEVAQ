const axios = require('axios');

async function updateBookingStatus() {
  try {
    console.log('🔄 Updating booking status...');
    
    const response = await axios.patch('http://localhost:45357/bookings/109', {
      status: 'confirmed'
    });
    
    console.log('✅ Success! Status code:', response.status);
    console.log('📄 Updated booking:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  }
}

updateBookingStatus();
