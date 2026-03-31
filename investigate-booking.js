const axios = require('axios');

const API_URL = 'https://sevaq-production.up.railway.app/api';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyeWFuamFpc3dhbDc5MUBnbWFpbC5jb20iLCJzdWIiOiIzYTg3MmViYi03NDc3LTQ1NGUtYTY3OC01NzE5Y2RiZDZhZDMiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3NDg4NDg1MCwiZXhwIjoxNzc0OTcxMjUwfQ.L13anbWkcKbwGqDH_yiay8v3wZJcfLTMfbRUl6IJPAE';

async function investigateBooking() {
  console.log('\n=== INVESTIGATING BOOKING 48085d38-ae36-4c5a-bac4-bf79f02cb40d ===\n');
  
  // 1. Get service details for service ID 4 (booking's serviceId)
  try {
    const serviceResponse = await axios.get(
      `${API_URL}/services/4`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Service ID 4 (booking service):', serviceResponse.data);
  } catch (e) {
    console.log('Could not fetch service 4:', e.message);
  }
  
  console.log('\n---\n');
  
  // 2. Get worker details for worker ID 4 (booking workerId)
  try {
    const workerResponse = await axios.get(
      `${API_URL}/workers/4`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Worker ID 4 (booking workerId):');
    console.log('  - ID:', workerResponse.data.id);
    console.log('  - Name:', workerResponse.data.user?.firstName, workerResponse.data.user?.lastName);
    console.log('  - Is Available:', workerResponse.data.isAvailable);
    console.log('  - Services:', workerResponse.data.services?.map(s => `${s.id}:${s.name}`).join(', '));
  } catch (e) {
    console.log('Could not fetch worker 4:', e.message);
  }
  
  console.log('\n---\n');
  
  // 3. Get worker 17 details (CP Pandey - the worker who SHOULD be assigned)
  try {
    const worker17Response = await axios.get(
      `${API_URL}/workers/17`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Worker ID 17 (CP Pandey - expected worker):');
    console.log('  - ID:', worker17Response.data.id);
    console.log('  - Public ID:', worker17Response.data.publicId);
    console.log('  - Name:', worker17Response.data.user?.firstName, worker17Response.data.user?.lastName);
    console.log('  - Is Available:', worker17Response.data.isAvailable);
    console.log('  - Latitude:', worker17Response.data.latitude);
    console.log('  - Longitude:', worker17Response.data.longitude);
    console.log('  - Service Radius:', worker17Response.data.serviceRadiusKm);
    console.log('  - Services:', worker17Response.data.services?.map(s => `${s.id}:${s.name}`).join(', '));
  } catch (e) {
    console.log('Could not fetch worker 17:', e.message);
  }
  
  console.log('\n---\n');
  
  // 4. Check all services available
  try {
    const servicesResponse = await axios.get(
      `${API_URL}/services`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('All Services:');
    servicesResponse.data.forEach(s => {
      console.log(`  - ID ${s.id}: ${s.name} (category: ${s.category})`);
    });
  } catch (e) {
    console.log('Could not fetch services:', e.message);
  }
  
  console.log('\n---\n');
  
  // 5. Check all workers with service ID 2 (Cooking)
  try {
    // Get workers who have service ID 2 (Cooking)
    const workersResponse = await axios.get(
      `${API_URL}/workers`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const cookingWorkers = workersResponse.data
      .filter(w => w.services?.some(s => s.id === 2))
      .map(w => ({
        id: w.id,
        name: `${w.user?.firstName} ${w.user?.lastName}`,
        isAvailable: w.isAvailable,
        lat: w.latitude,
        lng: w.longitude,
        services: w.services?.map(s => s.name).join(', ')
      }));
    
    console.log('Workers with Cooking service (ID 2):');
    cookingWorkers.forEach(w => {
      console.log(`  - Worker ${w.id}: ${w.name} (available: ${w.isAvailable})`);
      console.log(`    Location: ${w.lat}, ${w.lng}`);
      console.log(`    Services: ${w.services}`);
    });
  } catch (e) {
    console.log('Could not fetch workers:', e.message);
  }
  
  console.log('\n=== ANALYSIS COMPLETE ===');
  console.log('\nFINDINGS:');
  console.log('- Service ID in booking: 4');
  console.log('- Expected service for Cooking: 2');
  console.log('- Worker ID in booking: 4 (not 17 = CP Pandey)');
  console.log('- Assigned Worker ID: null (assignment not persisted!)');
  console.log('- Assignment State: pending (should be assigned)');
}

investigateBooking();