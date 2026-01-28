const axios = require('axios');

// Test the home screen endpoint
async function testHomeScreen() {
  try {
    console.log('Testing home screen endpoint...');
    
    // Test with Delhi coordinates
    const response = await axios.get('http://localhost:45357/home/screen', {
      params: {
        lat: 28.5804579,
        lng: 77.4392951,
        radius: 5
      }
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check if system is ready
    if (response.data.systemReadiness.isReady) {
      console.log('✅ System is ready - showing service recommendations');
      console.log(`Found ${response.data.serviceRecommendations?.length || 0} service recommendations`);
    } else {
      console.log('❌ System is not ready - showing system state message');
      console.log('System state message:', response.data.systemStateMessage);
    }
    
  } catch (error) {
    console.error('Error testing home screen:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

// Test the system readiness endpoint directly
async function testSystemReadiness() {
  try {
    console.log('\nTesting system readiness endpoint...');
    
    const response = await axios.get('http://localhost:45357/system/readiness');
    
    console.log('System readiness response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing system readiness:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  await testSystemReadiness();
  await testHomeScreen();
}

runTests();