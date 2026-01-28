const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:45357';
const TEST_USER_ID = 1;
const TEST_WORKER_ID = 1;
const TEST_SERVICE_ID = 1;

async function testBookingCreationWithoutServiceRequest() {
    console.log('=== Testing Booking Creation Without ServiceRequestId ===');
    
    try {
        // Create booking without serviceRequestId (but with workerId)
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
        
        const bookingData = {
            userId: TEST_USER_ID,
            workerId: TEST_WORKER_ID,
            serviceId: TEST_SERVICE_ID,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            totalAmount: 500
        };
        
        console.log('Creating booking with data:', bookingData);
        
        const response = await axios.post(`${API_BASE}/bookings`, bookingData);
        
        console.log('✅ Booking created successfully!');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
        // Check if worker details are included
        if (response.data.worker) {
            console.log('✅ Worker details included in response');
            if (response.data.worker.user) {
                console.log('✅ Worker user details included');
                console.log('Worker name:', response.data.worker.user.name);
            }
            if (response.data.worker.services && response.data.worker.services.length > 0) {
                console.log('✅ Worker services included');
                console.log('Number of services:', response.data.worker.services.length);
            }
        } else {
            console.log('❌ Worker details missing from response');
        }
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Error creating booking:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
        throw error;
    }
}

async function testBookingCreationWithServiceRequest() {
    console.log('\n=== Testing Booking Creation With ServiceRequestId ===');
    
    try {
        // First, create a service request
        const serviceRequestData = {
            userId: TEST_USER_ID,
            serviceId: TEST_SERVICE_ID,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            timeWindow: 'morning',
            assignmentStatus: 'ASSIGNED',
            assignedWorkerId: TEST_WORKER_ID
        };
        
        const serviceRequestResponse = await axios.post(`${API_BASE}/service-requests`, serviceRequestData);
        const serviceRequestId = serviceRequestResponse.data.id;
        
        console.log('✅ Service request created:', serviceRequestId);
        
        // Create booking with serviceRequestId
        const bookingData = {
            serviceRequestId: serviceRequestId
        };
        
        const response = await axios.post(`${API_BASE}/bookings`, bookingData);
        
        console.log('✅ Booking created successfully!');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
        // Check if worker details are included
        if (response.data.worker) {
            console.log('✅ Worker details included in response');
            if (response.data.worker.user) {
                console.log('✅ Worker user details included');
                console.log('Worker name:', response.data.worker.user.name);
            }
            if (response.data.worker.services && response.data.worker.services.length > 0) {
                console.log('✅ Worker services included');
                console.log('Number of services:', response.data.worker.services.length);
            }
        } else {
            console.log('❌ Worker details missing from response');
        }
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Error creating booking:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting tests...');
        
        // Test 1: Create booking without serviceRequestId
        await testBookingCreationWithoutServiceRequest();
        
        // Test 2: Create booking with serviceRequestId
        await testBookingCreationWithServiceRequest();
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    }
}

main();
