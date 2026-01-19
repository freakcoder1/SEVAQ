const axios = require('axios');

const API_BASE = 'http://127.0.0.1:3000';

async function testAssignmentWithWorkingSlot() {
    console.log('=== TESTING ASSIGNMENT WITH WORKING SLOT ===\n');

    try {
        // 1. Create a test booking with available time slot
        console.log('1. Creating a test booking with available time slot...');
        const bookingData = {
            userId: '970763f8-84e8-4422-816d-b71f2612c795',
            serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
            startTime: '2026-01-10T08:00:00.000Z',
            endTime: '2026-01-10T11:00:00.000Z',
            type: 'on_demand',
            notes: 'Test booking for assignment with working slot'
        };

        const bookingResponse = await axios.post(`${API_BASE}/bookings`, bookingData);
        const bookingId = bookingResponse.data.id;
        console.log(`Booking created: ${bookingId}`);

        // 2. Attempt assignment
        console.log('\n2. Attempting assignment...');
        const assignmentResponse = await axios.post(`${API_BASE}/bookings/${bookingId}/attempt-assignment`);
        console.log('Assignment result:', JSON.stringify(assignmentResponse.data, null, 2));

        // 3. Check assignment status
        console.log('\n3. Checking assignment status...');
        const statusResponse = await axios.get(`${API_BASE}/assignments/${bookingId}/status`);
        console.log('Assignment status:', JSON.stringify(statusResponse.data, null, 2));

        // 4. Check booking details
        console.log('\n4. Checking booking details...');
        const bookingDetailsResponse = await axios.get(`${API_BASE}/bookings/${bookingId}`);
        console.log('Booking details:', JSON.stringify(bookingDetailsResponse.data, null, 2));

        console.log('\n=== TEST COMPLETE ===');

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testAssignmentWithWorkingSlot();