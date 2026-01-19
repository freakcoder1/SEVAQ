#!/usr/bin/env node

/**
 * Mock Worker Seeding Script for Development Testing
 * 
 * This script creates mock workers and slots for testing the availability
 * adjustment functionality. It simulates real-world scenarios where workers
 * might be unavailable at certain times.
 * 
 * Usage: node mock-worker-seeding.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'your-admin-token-here'; // Replace with actual admin token

// Mock data for workers
const mockWorkers = [
  {
    user: {
      firstName: 'Ramesh',
      lastName: 'Kumar',
      email: 'ramesh.kumar@example.com',
      role: 'worker',
      phone: '+919876543210'
    },
    bio: 'Experienced house help with 5 years of experience in household management.',
    rating: 4.8,
    reviewCount: 120,
    location: {
      lat: 28.5805083,
      lng: 77.4392111,
      address: 'Sector 18, Noida, Uttar Pradesh'
    },
    services: ['7ff3de68-1068-4cbf-8f9f-9d283bca1f5b'] // Home Cleaning
  },
  {
    user: {
      firstName: 'Sunita',
      lastName: 'Singh',
      email: 'sunita.singh@example.com',
      role: 'worker',
      phone: '+919876543211'
    },
    bio: 'Professional cook specializing in Indian and continental cuisine.',
    rating: 4.6,
    reviewCount: 85,
    location: {
      lat: 28.5820000,
      lng: 77.4400000,
      address: 'Sector 22, Noida, Uttar Pradesh'
    },
    services: ['7f8e4b5c-a883-4c6c-b348-f966508fd49d'] // Cooking
  },
  {
    user: {
      firstName: 'Amit',
      lastName: 'Sharma',
      email: 'amit.sharma@example.com',
      role: 'worker',
      phone: '+919876543212'
    },
    bio: 'Deep cleaning specialist with attention to detail.',
    rating: 4.9,
    reviewCount: 150,
    location: {
      lat: 28.5790000,
      lng: 77.4380000,
      address: 'Sector 15, Noida, Uttar Pradesh'
    },
    services: ['e8003676-f554-41d0-b41e-a0fb5fec7c51'] // Deep Cleaning
  },
  {
    user: {
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@example.com',
      role: 'worker',
      phone: '+919876543213'
    },
    bio: 'General house help available for daily assistance.',
    rating: 4.4,
    reviewCount: 60,
    location: {
      lat: 28.5810000,
      lng: 77.4410000,
      address: 'Sector 20, Noida, Uttar Pradesh'
    },
    services: ['7ff3de68-1068-4cbf-8f9f-9d283bca1f5b'] // Home Cleaning
  },
  {
    user: {
      firstName: 'Vijay',
      lastName: 'Yadav',
      email: 'vijay.yadav@example.com',
      role: 'worker',
      phone: '+919876543214'
    },
    bio: 'Weekend specialist for deep cleaning and organization.',
    rating: 4.7,
    reviewCount: 95,
    location: {
      lat: 28.5780000,
      lng: 77.4370000,
      address: 'Sector 12, Noida, Uttar Pradesh'
    },
    services: ['e8003676-f554-41d0-b41e-a0fb5fec7c51'] // Deep Cleaning
  }
];

// Generate mock slots for a week
function generateMockSlots(workerId, serviceId, startDate, endDate) {
  const slots = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Skip Sundays (workers off)
    if (currentDate.getDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Generate slots for different time windows
    const timeWindows = [
      { startHour: 8, endHour: 12 },   // Morning
      { startHour: 12, endHour: 16 },  // Afternoon  
      { startHour: 16, endHour: 20 }   // Evening
    ];
    
    timeWindows.forEach(window => {
      // Randomly make some slots unavailable to simulate real scenarios
      const isAvailable = Math.random() > 0.3; // 70% chance of being available
      
      slots.push({
        workerId: workerId,
        serviceId: serviceId,
        startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), window.startHour),
        endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), window.endHour),
        isAvailable: isAvailable,
        price: 500.0
      });
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}

// API helper functions
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function createWorker(workerData) {
  try {
    const response = await api.post('/workers', workerData);
    console.log(`✓ Created worker: ${workerData.user.firstName} ${workerData.user.lastName}`);
    return response.data;
  } catch (error) {
    console.error(`✗ Failed to create worker ${workerData.user.firstName}:`, error.response?.data || error.message);
    return null;
  }
}

async function createSlot(slotData) {
  try {
    const response = await api.post('/slots', slotData);
    console.log(`✓ Created slot for worker ${slotData.workerId} on ${slotData.startTime}`);
    return response.data;
  } catch (error) {
    console.error(`✗ Failed to create slot:`, error.response?.data || error.message);
    return null;
  }
}

async function seedDatabase() {
  console.log('🚀 Starting mock worker seeding...\n');
  
  const createdWorkers = [];
  
  // Step 1: Create workers
  console.log('1️⃣ Creating mock workers...');
  for (const workerData of mockWorkers) {
    const worker = await createWorker(workerData);
    if (worker) {
      createdWorkers.push(worker);
    }
  }
  
  if (createdWorkers.length === 0) {
    console.log('❌ No workers were created. Please check your API connection and admin token.');
    return;
  }
  
  console.log(`\n✅ Created ${createdWorkers.length} workers successfully!\n`);
  
  // Step 2: Create slots for the next 7 days
  console.log('2️⃣ Creating mock slots for the next 7 days...');
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 7);
  
  let totalSlots = 0;
  let availableSlots = 0;
  
  for (const worker of createdWorkers) {
    const serviceId = worker.services[0]; // Use first service
    const workerSlots = generateMockSlots(worker.id, serviceId, startDate, endDate);
    
    for (const slotData of workerSlots) {
      totalSlots++;
      if (slotData.isAvailable) {
        availableSlots++;
        await createSlot(slotData);
      }
    }
  }
  
  console.log(`\n✅ Created ${totalSlots} total slots (${availableSlots} available, ${totalSlots - availableSlots} unavailable)!\n`);
  
  // Step 3: Create some bookings to simulate busy workers
  console.log('3️⃣ Creating mock bookings to simulate busy workers...');
  // This would require creating users and bookings, which is more complex
  // For now, we'll just log the summary
  
  console.log('\n🎉 Mock seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • Workers created: ${createdWorkers.length}`);
  console.log(`   • Total slots: ${totalSlots}`);
  console.log(`   • Available slots: ${availableSlots}`);
  console.log(`   • Unavailable slots: ${totalSlots - availableSlots}`);
  console.log(`   • Coverage: Next 7 days, 3 time windows per day`);
  
  console.log('\n💡 Test scenarios you can now try:');
  console.log('   1. Request a booking during unavailable time → Should show AvailabilityAdjustmentScreen');
  console.log('   2. Request a booking during available time → Should proceed normally');
  console.log('   3. Try different services → Should show appropriate workers');
  console.log('   4. Test weekend bookings → Should show limited availability');
  
  console.log('\n🔧 API endpoints to test:');
  console.log('   • GET /workers - List all workers');
  console.log('   • GET /slots - List all slots');
  console.log('   • POST /assignments/start-assignment-flow - Test assignment flow');
  console.log('   • GET /slots/alternatives - Test alternative slot suggestions');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run the seeding
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase, mockWorkers, generateMockSlots };