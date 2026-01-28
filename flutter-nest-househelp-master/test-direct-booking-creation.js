const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://127.0.0.1:45357';

async function testDirectBookingCreation() {
    console.log('=== TESTING DIRECT BOOKING CREATION ===');
    
    try {
        // Step 1: Login to get token
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'test.user1@example.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login successful');

        // Step 2: Directly create a booking with required fields
        console.log('\n2. Creating a booking directly...');
        const bookingResponse = await axios.post(`${API_BASE_URL}/bookings`, {
            serviceId: 1,
            userId: 18, // Test user 1's id
            type: 'on_demand',
            notes: 'Test booking created directly',
            date: '2026-01-20',
            startTime: '09:00:00',
            endTime: '12:00:00'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Booking created successfully');
        console.log('📄 Booking details:', bookingResponse.data);

        console.log('\n=== TEST PASSED ===');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('❌ Response status:', error.response.status);
            console.error('❌ Response headers:', error.response.headers);
            console.error('❌ Response data:', error.response.data);
        }
    }
}

testDirectBookingCreation();
