const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357/api';

async function testAssignmentSystem() {
  console.log('🧪 TESTING ASSIGNMENT SYSTEM COMPLETE FLOW');
  console.log('=============================================\n');

  try {
    // 1. Test availability check
    console.log('1. Testing availability check...');
    const availabilityResponse = await axios.post(`${API_BASE}/assignments/check-availability`, {
      serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: '2026-01-10T08:00:00.000Z',
      endTime: '2026-01-10T11:00:00.000Z'
    });

    console.log('✅ Availability check successful:', availabilityResponse.data);

    // 2. Test assignment attempt
    console.log('\n2. Testing assignment attempt...');
    const assignmentResponse = await axios.post(`${API_BASE}/assignments/attempt-assignment`, {
      bookingId: '5450c58d-9e74-4558-9890-6cdbc3d4fea1',
      serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: '2026-01-10T08:00:00.000Z',
      endTime: '2026-01-10T11:00:00.000Z'
    });

    console.log('✅ Assignment attempt result:', assignmentResponse.data);

    // 3. Check assignment status
    console.log('\n3. Checking assignment status...');
    const statusResponse = await axios.get(`${API_BASE}/assignments/5450c58d-9e74-4558-9890-6cdbc3d4fea1/status`);
    console.log('✅ Assignment status:', statusResponse.data);

    // 4. Test payment integration
    console.log('\n4. Testing payment integration...');
    if (assignmentResponse.data.success && assignmentResponse.data.worker) {
      const paymentResponse = await axios.post(`${API_BASE}/payments/create`, {
        bookingId: '5450c58d-9e74-4558-9890-6cdbc3d4fea1',
        amount: 50000, // in paise
        currency: 'INR',
        paymentMethod: 'upi'
      });
      console.log('✅ Payment integration test:', paymentResponse.data);
    }

    console.log('\n🎉 ASSIGNMENT SYSTEM TEST COMPLETE');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAssignmentSystem();