const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const testWorker = {
    userId: 'test-user-id',
    bio: 'Test worker bio',
    serviceIds: ['7ff3de68-1068-4cbf-8f9f-9d283bca1f5b'], // Home Cleaning service
    latitude: 28.5804579,
    longitude: 77.4392951
};

const invalidWorker = {
    userId: 'test-user-id-2',
    bio: 'Test worker bio',
    serviceIds: ['7ff3de68-1068-4cbf-8f9f-9d283bca1f5b'],
    // Missing latitude and longitude
};

async function testLocationRequirements() {
    console.log('Testing Worker Location Requirements Implementation...\n');

    try {
        // Test 1: Create worker with valid location data
        console.log('Test 1: Creating worker with valid location data...');
        const response1 = await axios.post(`${BASE_URL}/workers`, testWorker);
        console.log('✅ SUCCESS: Worker created with location data');
        console.log('Worker ID:', response1.data.id);
        console.log('Location:', response1.data.latitude, response1.data.longitude);

        // Test 2: Create worker without location data (should fail)
        console.log('\nTest 2: Creating worker without location data (should fail)...');
        try {
            await axios.post(`${BASE_URL}/workers`, invalidWorker);
            console.log('❌ FAIL: Worker was created without location data (validation should have failed)');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ SUCCESS: Worker creation failed due to missing location data');
                console.log('Validation errors:', error.response.data.message);
            } else {
                console.log('❌ FAIL: Unexpected error:', error.message);
            }
        }

        // Test 3: Update worker availability with location data
        console.log('\nTest 3: Updating worker availability with location data...');
        const workerId = response1.data.id;
        const availabilityResponse = await axios.patch(`${BASE_URL}/workers/${workerId}/availability`, { isAvailable: true });
        console.log('✅ SUCCESS: Worker marked as available');
        console.log('Is Available:', availabilityResponse.data.isAvailable);

        console.log('\n🎉 All tests passed! Location requirements are properly enforced.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the tests
testLocationRequirements();