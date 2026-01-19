const axios = require('axios');

async function checkServices() {
  console.log('=== CHECKING ALL SERVICES ===\n');

  const baseUrl = 'http://127.0.0.1:56324';

  try {
    // Get all services
    console.log('1. Getting all services...');
    const servicesResponse = await axios.get(`${baseUrl}/services`);
    console.log('Total services:', servicesResponse.data.length);
    servicesResponse.data.forEach((service, i) => {
      console.log(`${i+1}. ${service.name} (${service.id}) - Category: ${service.category}`);
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkServices().catch(console.error);