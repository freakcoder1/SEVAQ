const axios = require('axios');

async function testLocationFunctionality() {
  try {
    console.log('Testing location functionality...');
    
    // Test 1: Check service availability for 201306 area (coordinates: 28.615, 77.37)
    console.log('\n1. Testing service availability for 201306 area...');
    const response1 = await axios.get('http://127.0.0.1:45357/locations/availability?lat=28.615&lng=77.37&radius=5.0');
    console.log('Service availability response:', response1.data);
    
    // Test 2: Get available services for 201306 area
    console.log('\n2. Testing available services for 201306 area...');
    const response2 = await axios.get('http://127.0.0.1:45357/locations/services?lat=28.615&lng=77.37&radius=5.0');
    console.log('Available services response:', response2.data);
    
    // Test 3: Get nearby zones for 201306 area
    console.log('\n3. Testing nearby zones for 201306 area...');
    const response3 = await axios.get('http://127.0.0.1:45357/locations/zones/nearby?lat=28.615&lng=77.37&maxRadius=2.0');
    console.log('Nearby zones response:', response3.data);
    
    // Test 4: Get service areas for 201306 area
    console.log('\n4. Testing service areas for 201306 area...');
    const response4 = await axios.get('http://127.0.0.1:45357/locations/areas?lat=28.615&lng=77.37');
    console.log('Service areas response:', response4.data);
    
    console.log('\n✅ All location functionality tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing location functionality:', error.response?.data || error.message);
  }
}

testLocationFunctionality();