const axios = require('axios');

async function checkWorkers() {
  try {
    const response = await axios.get('http://0.0.0.0:45357/workers');
    console.log('Workers:', response.data.length);
    if (response.data.length > 0) {
      console.log('First worker:', response.data[0]);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkWorkers();