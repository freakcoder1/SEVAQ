const axios = require('axios');

const API_BASE_URL = 'http://192.168.29.154:45357';

async function testCreateBooking() {
    console.log('Testing Create Booking API...');
    
    try {
        const response = await axios.post(`${API_BASE_URL}/bookings`, {
            serviceRequestId: 'e6bfe71e-7102-432d-ac72-f1c9e55dac04'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Booking created successfully');
        console.log('Response:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ Error creating booking:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
}

async function testGetBookings() {
    console.log('\nTesting Get Bookings API...');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/bookings`);
        
        console.log('✅ Bookings retrieved successfully');
        console.log(`Number of bookings: ${response.data.length}`);
        
        if (response.data.length > 0) {
            console.log('First booking:', response.data[0]);
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Error retrieving bookings:', error.message);
        throw error;
    }
}

async function main() {
    console.log('=== Booking API Tests ===\n');
    
    try {
        // Test create booking
        const newBooking = await testCreateBooking();
        
        // Test get all bookings
        const allBookings = await testGetBookings();
        
        console.log('\n=== All tests completed successfully ===');
    } catch (error) {
        console.error('\n=== Test failed ===');
    }
}

main();
