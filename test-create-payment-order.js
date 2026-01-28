
const axios = require('axios');

async function testCreatePaymentOrder() {
  try {
    console.log('📡 Testing POST /payments/create-order endpoint...');
    
    const orderData = {
      amount: 1500,
      currency: 'INR'
    };
    
    const response = await axios.post('http://127.0.0.1:45357/payments/create-order', orderData);
    
    console.log('✅ Success! Status code:', response.status);
    console.log('📄 Created order:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  }
}

testCreatePaymentOrder();
