const axios = require('axios');

async function createWorkers() {
  console.log('🚀 Creating workers via API...');
  
  const baseUrl = 'http://localhost:56324';
  
  // First, login as admin to get token
  let token;
  try {
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    token = loginResponse.data.access_token;
    console.log('✅ Admin login successful');
  } catch (error) {
    console.log('❌ Admin login failed, trying with test customer...');
    try {
      const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
        email: 'test.customer@example.com',
        password: 'password123'
      });
      token = loginResponse.data.access_token;
      console.log('✅ Customer login successful');
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      return;
    }
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Worker data
  const workersData = [
    {
      bio: 'Experienced housekeeping professional with 5 years of experience in residential cleaning.',
      rating: 4.8,
      reviewCount: 0,
      yearsOfExperience: 5,
      homesServedInArea: 85,
      reliabilityStreak: 15,
      isVerified: true,
      isTrained: true,
      isMonitored: true,
      isActive: true,
      latitude: 28.5805083,
      longitude: 77.4392111,
      microZoneId: 'Greater Noida - Alpha 1',
      serviceAreaId: 'Greater Noida',
      isAvailable: true,
      currentLat: 28.5805083,
      currentLng: 77.4392111,
      lastLocationUpdate: new Date().toISOString(),
      serviceRadiusKm: 3,
      availabilitySchedule: [
        { day: 1, startTime: '08:00', endTime: '18:00' },
        { day: 2, startTime: '08:00', endTime: '18:00' },
        { day: 3, startTime: '08:00', endTime: '18:00' },
        { day: 4, startTime: '08:00', endTime: '18:00' },
        { day: 5, startTime: '08:00', endTime: '18:00' },
        { day: 6, startTime: '09:00', endTime: '17:00' },
        { day: 0, startTime: '10:00', endTime: '14:00' }
      ]
    },
    {
      bio: 'Professional cook specializing in Indian and continental cuisine.',
      rating: 4.9,
      reviewCount: 0,
      yearsOfExperience: 8,
      homesServedInArea: 60,
      reliabilityStreak: 20,
      isVerified: true,
      isTrained: true,
      isMonitored: true,
      isActive: true,
      latitude: 28.5812345,
      longitude: 77.4389876,
      microZoneId: 'Greater Noida - Alpha 2',
      serviceAreaId: 'Greater Noida',
      isAvailable: true,
      currentLat: 28.5812345,
      currentLng: 77.4389876,
      lastLocationUpdate: new Date().toISOString(),
      serviceRadiusKm: 2.5,
      availabilitySchedule: [
        { day: 1, startTime: '09:00', endTime: '19:00' },
        { day: 2, startTime: '09:00', endTime: '19:00' },
        { day: 3, startTime: '09:00', endTime: '19:00' },
        { day: 4, startTime: '09:00', endTime: '19:00' },
        { day: 5, startTime: '09:00', endTime: '19:00' },
        { day: 6, startTime: '10:00', endTime: '16:00' },
        { day: 0, startTime: '11:00', endTime: '15:00' }
      ]
    },
    {
      bio: 'Multi-skilled professional offering both cleaning and cooking services.',
      rating: 4.7,
      reviewCount: 0,
      yearsOfExperience: 4,
      homesServedInArea: 55,
      reliabilityStreak: 12,
      isVerified: true,
      isTrained: true,
      isMonitored: true,
      isActive: true,
      latitude: 28.5798765,
      longitude: 77.4401234,
      microZoneId: 'Greater Noida - Beta',
      serviceAreaId: 'Greater Noida',
      isAvailable: true,
      currentLat: 28.5798765,
      currentLng: 77.4401234,
      lastLocationUpdate: new Date().toISOString(),
      serviceRadiusKm: 3.5,
      availabilitySchedule: [
        { day: 1, startTime: '07:00', endTime: '17:00' },
        { day: 2, startTime: '07:00', endTime: '17:00' },
        { day: 3, startTime: '07:00', endTime: '17:00' },
        { day: 4, startTime: '07:00', endTime: '17:00' },
        { day: 5, startTime: '07:00', endTime: '17:00' },
        { day: 6, startTime: '08:00', endTime: '14:00' },
        { day: 0, startTime: '09:00', endTime: '13:00' }
      ]
    }
  ];

  for (let i = 0; i < workersData.length; i++) {
    try {
      const response = await axios.post(`${baseUrl}/workers`, workersData[i], { headers });
      console.log(`✅ Created worker ${i + 1}: ${response.data.id}`);
    } catch (error) {
      console.error(`❌ Failed to create worker ${i + 1}:`, error.response?.data || error.message);
    }
  }

  console.log('🎉 Worker creation completed!');
}

createWorkers().catch(console.error);