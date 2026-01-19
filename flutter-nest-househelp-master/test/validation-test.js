// Simple test to verify validation is working
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testValidation() {
  console.log('Testing validation implementation...\n');

  // Test 1: Valid booking creation
  console.log('Test 1: Valid booking creation');
  try {
    const validBooking = {
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      startTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      endTime: new Date(Date.now() + 120000).toISOString(),  // 2 minutes from now
      notes: 'Test booking'
    };

    const response = await axios.post(`${BASE_URL}/bookings`, validBooking);
    console.log('✅ Valid booking created successfully:', response.data.id);
  } catch (error) {
    console.log('❌ Valid booking failed:', error.response?.data || error.message);
  }

  // Test 2: Invalid UUID format
  console.log('\nTest 2: Invalid UUID format');
  try {
    const invalidBooking = {
      serviceId: 'invalid-uuid',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      startTime: new Date(Date.now() + 60000).toISOString(),
      endTime: new Date(Date.now() + 120000).toISOString()
    };

    const response = await axios.post(`${BASE_URL}/bookings`, invalidBooking);
    console.log('❌ Invalid UUID should have failed but succeeded:', response.data);
  } catch (error) {
    console.log('✅ Invalid UUID correctly rejected:', error.response?.data?.message || error.message);
  }

  // Test 3: Missing required fields
  console.log('\nTest 3: Missing required fields');
  try {
    const incompleteBooking = {
      serviceId: '550e8400-e29b-41d4-a716-446655440000'
      // Missing userId, startTime, endTime
    };

    const response = await axios.post(`${BASE_URL}/bookings`, incompleteBooking);
    console.log('❌ Incomplete booking should have failed but succeeded:', response.data);
  } catch (error) {
    console.log('✅ Incomplete booking correctly rejected:', error.response?.data?.message || error.message);
  }

  // Test 4: Invalid time range (end before start)
  console.log('\nTest 4: Invalid time range');
  try {
    const invalidTimeBooking = {
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      startTime: new Date(Date.now() + 120000).toISOString(),  // 2 minutes from now
      endTime: new Date(Date.now() + 60000).toISOString()     // 1 minute from now (invalid)
    };

    const response = await axios.post(`${BASE_URL}/bookings`, invalidTimeBooking);
    console.log('❌ Invalid time range should have failed but succeeded:', response.data);
  } catch (error) {
    console.log('✅ Invalid time range correctly rejected:', error.response?.data?.message || error.message);
  }

  // Test 5: Past time (should be rejected)
  console.log('\nTest 5: Past time');
  try {
    const pastTimeBooking = {
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      startTime: new Date(Date.now() - 60000).toISOString(),  // 1 minute ago
      endTime: new Date(Date.now() + 60000).toISOString()    // 1 minute from now
    };

    const response = await axios.post(`${BASE_URL}/bookings`, pastTimeBooking);
    console.log('❌ Past time should have failed but succeeded:', response.data);
  } catch (error) {
    console.log('✅ Past time correctly rejected:', error.response?.data?.message || error.message);
  }

  console.log('\nValidation testing completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  testValidation().catch(console.error);
}

module.exports = { testValidation };