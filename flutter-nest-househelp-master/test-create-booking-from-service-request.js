const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://127.0.0.1:45357';

async function testCreateBookingFromServiceRequest() {
    console.log('=== TESTING CREATE BOOKING FROM ASSIGNED SERVICE REQUEST ===');
    
    try {
        // Step 1: Login to get token
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'test.user1@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login successful');

        // Step 2: Create a service request that should get assigned
        console.log('\n2. Creating a service request...');
        const serviceRequestResponse = await axios.post(`${API_BASE_URL}/service-requests`, {
            serviceId: 1,
            date: '2026-01-18',
            timeWindow: 'morning',
            priceSnapshot: 300,
            location: {
                lat: 28.582,
                lng: 77.437,
                address: '123 Main Street, New Delhi'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const serviceRequestId = serviceRequestResponse.data.requestId;
        console.log(`✅ Service request created: ${serviceRequestId}`);

        // Step 3: Wait for assignment processing (should be fast)
        console.log('\n3. Waiting for assignment processing...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Check assignment status
        console.log('\n4. Checking assignment status...');
        const statusResponse = await axios.get(`${API_BASE_URL}/service-requests/${serviceRequestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Assignment status:', statusResponse.data.assignmentStatus);
        
        if (statusResponse.data.assignmentStatus !== 'ASSIGNED') {
            console.log('❌ Service request not assigned. Cannot create booking.');
            return;
        }

        // Step 5: Create booking from service request
        console.log('\n5. Creating booking from service request...');
        const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, {
            serviceRequestId: serviceRequestId
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Booking created successfully');
        console.log('📄 Booking details:', bookingResponse.data);

        // Step 6: Verify payment can be initiated (if supported)
        console.log('\n6. Booking created successfully. Payment flow would be next step.');

        console.log('\n=== TEST PASSED ===');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testCreateBookingFromServiceRequest();
