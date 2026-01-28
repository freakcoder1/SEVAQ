
const axios = require('axios');

async function testCreatePayment() {
  try {
    console.log('📡 Testing POST /payments endpoint...');
    
    // First, let's get a valid booking ID
    const bookingsResponse = await axios.get('http://127.0.0.1:45357/bookings');
    const bookings = bookingsResponse.data;
    
    if (bookings.length === 0) {
      console.error('❌ No bookings available');
      return;
    }
    
    const lastBooking = bookings[bookings.length - 1];
    console.log('📄 Using booking:', lastBooking);
    
    const paymentData = {
      bookingId: lastBooking.id,
      amount: 1500, // Default amount for service 1
      paymentMethod: 'UPI',
      transactionId: `TXN${Date.now()}`
    };
    
    const response = await axios.post('http://127.0.0.1:45357/payments', paymentData);
    
    console.log('✅ Success! Status code:', response.status);
    console.log('📄 Created payment:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  }
}

testCreatePayment();
