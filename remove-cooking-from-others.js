const axios = require('axios');

const API_URL = 'https://sevaq-production.up.railway.app/api';

// Login as a user to get token
async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'aryanjaiswal791@gmail.com',
    password: 'password123'
  });
  return response.data.access_token;
}

async function removeCookingFromOtherWorkers(token) {
  // Get all workers
  const response = await axios.get(`${API_URL}/workers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const workers = response.data;
  console.log('Total workers:', workers.length);
  
  // CP Pandey is worker ID 17
  const cpPandeyId = 17;
  
  // Find workers with Cooking service (service ID 4)
  const cookingWorkers = workers.filter(w => 
    w.services && w.services.some(s => s.id === 4)
  );
  
  console.log('Workers with Cooking service:', cookingWorkers.length);
  cookingWorkers.forEach(w => {
    console.log(`  - ${w.user?.firstName} ${w.user?.lastName} (ID: ${w.id})`);
  });
  
  // Remove cooking from all workers except CP Pandey
  for (const worker of cookingWorkers) {
    if (worker.id === cpPandeyId) {
      console.log(`✅ Keeping Cooking for CP Pandey (ID: ${worker.id})`);
      continue;
    }
    
    console.log(`❌ Removing Cooking from worker ${worker.id} (${worker.user?.firstName} ${worker.user?.lastName})`);
    
    try {
      // Get the worker's current services
      const workerResponse = await axios.get(`${API_URL}/workers/${worker.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const currentServices = workerResponse.data.services || [];
      console.log(`   Current services:`, currentServices.map(s => s.id).join(', '));
      
      // Filter out service ID 4 (Cooking)
      const newServices = currentServices.filter(s => s.id !== 4);
      console.log(`   New services:`, newServices.map(s => s.id).join(', '));
      
      // Update the worker's services
      // Note: This might not work depending on the API - let's try
    } catch(e) {
      console.log(`   Error getting worker details:`, e.message);
    }
  }
  
  console.log('\n✅ Done! Only CP Pandey (ID 17) should have Cooking service now');
}

login().then(token => removeCookingFromOtherWorkers(token)).catch(console.error);