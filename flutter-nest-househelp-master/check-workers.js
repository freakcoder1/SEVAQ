const axios = require('axios');

async function checkWorkers() {
  console.log('=== CHECKING ALL WORKERS ===\n');

  const baseUrl = 'http://127.0.0.1:3000';

  try {
    // Get all workers
    console.log('1. Getting all workers...');
    const workersResponse = await axios.get(`${baseUrl}/workers`);
    console.log('Total workers:', workersResponse.data.length);
    workersResponse.data.forEach((worker, i) => {
      console.log(`${i+1}. ${worker.id} - ${worker.user?.firstName} ${worker.user?.lastName} - Active: ${worker.isActive}, Available: ${worker.isAvailable}`);
      console.log(`   Services: ${worker.services?.length || 0}`);
      if (worker.services && worker.services.length > 0) {
        worker.services.forEach(service => {
          console.log(`     - ${service.name} (${service.id})`);
        });
      }
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkWorkers().catch(console.error);