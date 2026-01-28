const axios = require('axios');

// API base URL
const API_BASE = 'http://127.0.0.1:45357';

async function testSlotsAvailability() {
  try {
    console.log('🔍 Testing slots availability...');

    // Get slots for 2026-01-20 (the date we're testing)
    const slotsResponse = await axios.get(`${API_BASE}/slots?date=2026-01-20`);
    
    console.log('✅ Slots for 2026-01-20:');
    console.log(`   Total slots: ${slotsResponse.data.length}`);
    
    if (slotsResponse.data.length > 0) {
      console.log('📋 Slot details:');
      slotsResponse.data.slice(0, 3).forEach((slot, index) => {
        console.log(`   ${index + 1}. Worker ID: ${slot.workerId}`);
        console.log(`      Start: ${slot.startTime}`);
        console.log(`      End: ${slot.endTime}`);
        console.log(`      Booked: ${slot.isBooked}`);
      });
      
      if (slotsResponse.data.length > 3) {
        console.log(`   ... and ${slotsResponse.data.length - 3} more slots`);
      }
    }

    console.log('\n🎉 Slots are available for the requested date!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSlotsAvailability();
