const axios = require('axios');

async function checkDatabase() {
  console.log('=== CHECKING DATABASE ===\n');

  const baseUrl = 'http://127.0.0.1:56324';

  try {
    // Check workers for the service
    console.log('1. Checking workers for Home Cleaning service...');
    const workersResponse = await axios.get(`${baseUrl}/workers/service/79aa1876-6dfd-49ae-8aa3-8e35e6f15175`);
    console.log('Workers found:', workersResponse.data.length);
    workersResponse.data.forEach((worker, i) => {
      console.log(`  Worker ${i+1}: ${worker.id} - Active: ${worker.isActive}, Available: ${worker.isAvailable}`);
      console.log(`    Location: ${worker.currentLat || worker.latitude}, ${worker.currentLng || worker.longitude}`);
    });

    // Check available slots
    console.log('\n2. Checking available slots...');
    const slotsResponse = await axios.get(`${baseUrl}/slots`);
    console.log('Total slots:', slotsResponse.data.length);
    const availableSlots = slotsResponse.data.filter(slot => slot.isBooked === false);
    console.log('Available slots:', availableSlots.length);

    // Check slots for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    console.log(`\n3. Checking slots for ${tomorrowStr}...`);
    const tomorrowSlots = availableSlots.filter(slot => {
      const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
      return slotDate === tomorrowStr;
    });
    console.log('Available slots for tomorrow:', tomorrowSlots.length);
    tomorrowSlots.forEach(slot => {
      console.log(`  Slot: ${slot.startTime} to ${slot.endTime} (Worker: ${slot.workerId})`);
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkDatabase().catch(console.error);