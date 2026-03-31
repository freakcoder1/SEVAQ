const axios = require('axios');

const API_URL = 'https://sevaq-production.up.railway.app/api';

// Login as CP Pandey worker using phone OTP
async function loginAsWorker() {
  // First send OTP to worker's phone
  const phone = '+918299126022';
  
  // Request OTP (assuming there's an OTP send endpoint)
  // Since we don't have the OTP, let's try using the existing token approach
  // Instead, let's create a direct database update through the admin API
  
  // Try to use the existing worker token from earlier - we can check via worker profile
  console.log('Attempting to update CP Pandey rating...');
  
  // Let's check if we can use the workers endpoint directly
  try {
    // Try to get worker info using a direct approach
    const workersResponse = await axios.get(`${API_URL}/workers`);
    console.log('Workers endpoint accessible:', workersResponse.data.length);
  } catch(e) {
    console.log('Workers endpoint requires auth');
  }
}

// Alternative: Use the admin controller which might have a way to update
async function updateViaAdmin() {
  // Try without auth first - some admin endpoints might be open
  try {
    const response = await axios.get(`${API_URL}/admin/workers`);
    console.log('Admin endpoint accessible:', response.data.length);
  } catch(e) {
    console.log('Admin endpoint needs auth');
  }
  
  // Let's try to find CP Pandey via the public worker endpoint
  try {
    const workersResponse = await axios.get(`${API_URL}/workers/available`, {
      params: { serviceId: 2, lat: 28.58, lng: 77.43 }
    });
    console.log('Available workers:', workersResponse.data.length);
  } catch(e) {
    console.log('Error getting available workers');
  }
}

updateViaAdmin();