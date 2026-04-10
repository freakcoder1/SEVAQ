const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://127.0.0.1:45357/api';

async function main() {
  console.log('=== TESTING COMPLETE SERVICE REQUEST → ASSIGNMENT → BOOKING → PAYMENT FLOW ===\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.user1@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.access_token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful, got token\n');

    // Step 2: Create a service request
    console.log('2. Creating a service request...');
    const serviceRequestData = {
      serviceId: 1,
      date: '2026-01-20',
      timeWindow: 'early-morning',
      priceSnapshot: 1500,
      location: {
        lat: 28.5805083,
        lng: 77.4392111,
        address: 'Test Address'
      }
    };

    const serviceRequestResponse = await axios.post(
      `${BASE_URL}/service-requests`,
      serviceRequestData,
      { headers: authHeaders }
    );

    const serviceRequest = serviceRequestResponse.data;
    console.log('✅ Service request created:', JSON.stringify(serviceRequest, null, 2));
    console.log();

    // Step 3: Create booking from service request
    console.log('3. Creating booking from service request...');
    const bookingData = {
      serviceRequestId: serviceRequest.requestId
    };

    const bookingResponse = await axios.post(
      `${BASE_URL}/bookings`,
      bookingData,
      { headers: authHeaders }
    );

    const booking = bookingResponse.data;
    console.log(`✅ Booking created: ${booking.id}\n`);

    // Step 4: Check assignment status
    console.log('4. Checking assignment status...');
    const assignmentResponse = await axios.get(
      `${BASE_URL}/assignments/${booking.id}/status`,
      { headers: authHeaders }
    );

    console.log('✅ Assignment status:', assignmentResponse.data.status);
    
    if (assignmentResponse.data.status === 'ASSIGNED' && assignmentResponse.data.assignedWorkerId) {
      console.log('✅ Worker assigned:', assignmentResponse.data.assignedWorkerId);
    }
    console.log();

    // Step 6: Create payment order
    console.log('6. Creating payment order...');
    const paymentData = {
      bookingId: booking.id,
      amount: 1500
    };

    const paymentResponse = await axios.post(
      `${BASE_URL}/payments/create-order`,
      paymentData,
      { headers: authHeaders }
    );

    console.log('✅ Payment order created:', paymentResponse.data);
    console.log();

    // Step 7: Verify payment
    console.log('7. Verifying payment...');
    const verifyData = {
      razorpayOrderId: paymentResponse.data.id,
      razorpayPaymentId: 'test_payment_123',
      signature: 'test_signature',
      bookingData: { id: booking.id }
    };

    const verifyResponse = await axios.post(
      `${BASE_URL}/payments/verify`,
      verifyData,
      { headers: authHeaders }
    );

    console.log('✅ Payment verified:', verifyResponse.data.status);

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('🔄 Flow: Service Request → Assignment → Booking → Payment');
    console.log(`📝 Service Request: ${serviceRequest.requestId}`);
    console.log(`👷 Worker: ${assignmentResponse.data.assignedWorkerId}`);
    console.log(`📅 Booking: ${booking.id}`);
    console.log(`💳 Payment: ${verifyResponse.data.status}`);

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

main();
