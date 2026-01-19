const axios = require('axios');

async function testServiceRequestValidation() {
  const baseURL = 'http://127.0.0.1:3000';

  try {
    // First, login to get a token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test.customer@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.access_token;
    const userId = loginResponse.data.user.id;
    console.log('Login successful, token received, userId:', userId);

    // Get a serviceId
    console.log('Getting services...');
    const servicesResponse = await axios.get(`${baseURL}/services`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const serviceId = servicesResponse.data[0].id;
    console.log('Got serviceId:', serviceId);

    // Test service request creation with valid data
    console.log('\nTesting service request creation with valid data...');
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2); // 2 hours from now
    const endTime = new Date(futureTime);
    endTime.setHours(endTime.getHours() + 2); // 4 hours from now

    const validRequest = {
      serviceId: serviceId, // Use actual serviceId
      userId: userId, // Use actual userId
      startTime: futureTime,
      endTime: endTime,
      location: {
        lat: 28.6139,
        lng: 77.2090
      }
    };

    const response = await axios.post(`${baseURL}/bookings`, validRequest, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Service request created successfully:', response.data);

    // Test with invalid userId (not UUID)
    console.log('\nTesting with invalid userId...');
    const invalidUserIdRequest = {
      ...validRequest,
      userId: 'invalid-user-id'
    };

    try {
      await axios.post(`${baseURL}/bookings`, invalidUserIdRequest, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('ERROR: Should have failed with invalid userId');
    } catch (error) {
      console.log('Expected validation error for invalid userId:', error.response?.data?.message || error.message);
    }

    // Test with location.address (should not exist)
    console.log('\nTesting with location.address (should fail)...');
    const invalidLocationRequest = {
      ...validRequest,
      location: {
        ...validRequest.location,
        address: 'Some address that should not be allowed'
      }
    };

    try {
      await axios.post(`${baseURL}/bookings`, invalidLocationRequest, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('ERROR: Should have failed with location.address');
    } catch (error) {
      console.log('Expected validation error for location.address:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testServiceRequestValidation();