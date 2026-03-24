const axios = require('axios');

const API_BASE = 'http://127.0.0.1:45357';

async function testIdTypeInconsistencies() {
  console.log('🔍 TESTING ID TYPE INCONSISTENCIES IN ASSIGNMENT SYSTEM');
  console.log('===================================================');

  try {
    // Test 1: Check if server is running
    console.log('\n1. Checking server health...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is healthy:', healthResponse.data);

    // Test 2: Check bookings endpoint
    console.log('\n2. Checking bookings endpoint...');
    const bookingsResponse = await axios.get(`${API_BASE}/bookings`);
    console.log('✅ Bookings endpoint returned:', bookingsResponse.data.length, 'bookings');
    
    if (bookingsResponse.data.length > 0) {
      const firstBooking = bookingsResponse.data[0];
      console.log('📋 First booking details:', {
        id: firstBooking.id,
        idType: typeof firstBooking.id,
        userId: firstBooking.userId,
        userIdType: typeof firstBooking.userId,
        workerId: firstBooking.workerId,
        workerIdType: typeof firstBooking.workerId,
        serviceId: firstBooking.serviceId,
        serviceIdType: typeof firstBooking.serviceId,
        assignmentState: firstBooking.assignmentState,
        assignedWorkerId: firstBooking.assignedWorkerId
      });
    }

    // Test 3: Check workers endpoint
    console.log('\n3. Checking workers endpoint...');
    const workersResponse = await axios.get(`${API_BASE}/workers`);
    console.log('✅ Workers endpoint returned:', workersResponse.data.length, 'workers');
    
    if (workersResponse.data.length > 0) {
      const firstWorker = workersResponse.data[0];
      console.log('👷 First worker details:', {
        id: firstWorker.id,
        idType: typeof firstWorker.id,
        userId: firstWorker.userId,
        userIdType: typeof firstWorker.userId
      });
    }

    // Test 4: Check services endpoint
    console.log('\n4. Checking services endpoint...');
    const servicesResponse = await axios.get(`${API_BASE}/services`);
    console.log('✅ Services endpoint returned:', servicesResponse.data.length, 'services');
    
    if (servicesResponse.data.length > 0) {
      const firstService = servicesResponse.data[0];
      console.log('🔧 First service details:', {
        id: firstService.id,
        idType: typeof firstService.id,
        name: firstService.name
      });
    }

    // Test 5: Attempt to create a test booking
    console.log('\n5. Testing booking creation...');
    const testBookingData = {
      userId: 1,
      workerId: null,
      serviceId: 1,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      amount: 500.0,
      status: 'PENDING',
      type: 'SCHEDULED',
      assignmentState: 'PENDING',
      assignedWorkerId: null,
      reassignmentCount: 0
    };

    const createBookingResponse = await axios.post(`${API_BASE}/bookings`, testBookingData);
    console.log('✅ Booking created successfully:', {
      id: createBookingResponse.data.id,
      idType: typeof createBookingResponse.data.id,
      assignmentState: createBookingResponse.data.assignmentState
    });

    // Test 6: Attempt assignment
    console.log('\n6. Testing assignment attempt...');
    const bookingId = createBookingResponse.data.id;
    const assignmentResponse = await axios.post(`${API_BASE}/assignments/attempt-assignment`, {
      bookingId: bookingId,
      serviceId: 1,
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: testBookingData.startTime,
      endTime: testBookingData.endTime
    });
    
    console.log('✅ Assignment attempt result:', assignmentResponse.data);

    // Test 7: Check assignment status
    console.log('\n7. Checking assignment status...');
    const statusResponse = await axios.get(`${API_BASE}/assignments/${bookingId}/status`);
    console.log('✅ Assignment status:', statusResponse.data);

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('==================================');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
