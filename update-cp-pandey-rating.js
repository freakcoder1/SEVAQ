const axios = require('axios');

const API_URL = 'https://sevaq-production.up.railway.app/api';

async function updateWorkerRating() {
  // First login as admin to get token
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@sevaq.com',
    password: 'admin123'
  });
  
  const token = loginResponse.data.access_token;
  console.log('Admin logged in');
  
  // Get all workers to find CP Pandey
  const workersResponse = await axios.get(`${API_URL}/admin/workers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const workers = workersResponse.data;
  console.log('Found workers:', workers.length);
  
  // Find CP Pandey
  const cpPandey = workers.find(w => 
    w.user?.firstName?.toLowerCase() === 'cp' && 
    w.user?.lastName?.toLowerCase() === 'pandey'
  );
  
  if (!cpPandey) {
    console.log('CP Pandey not found!');
    console.log('Workers:', JSON.stringify(workers.slice(0, 5), null, 2));
    return;
  }
  
  console.log('Found CP Pandey:', cpPandey.id, cpPandey.publicId);
  
  // Update rating to 5.0
  const updateResponse = await axios.patch(
    `${API_URL}/admin/workers/${cpPandey.id}`,
    { rating: '5.0', reviewCount: 10 },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  console.log('Updated CP Pandey rating:', updateResponse.data.rating);
}

updateWorkerRating().catch(console.error);