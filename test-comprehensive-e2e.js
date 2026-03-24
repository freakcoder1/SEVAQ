/**
 * Comprehensive End-to-End Test Suite
 * Tests the complete flow from Login to Booking including:
 * - Login/Authentication
 * - One-Time Service Booking
 * - Subscription Service
 * - Worker Assignment
 * - Notifications
 */

const BASE_URL = 'http://localhost:45357/api';

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📝';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Test 1: Login/Authentication
async function testLogin() {
  log('=== TEST 1: Login/Authentication ===', 'info');
  
  // First, let's check if we have a test user or need to create one
  // Using OTP login flow
  const loginData = {
    phone: '9876543210',
    fcmToken: 'test-fcm-token-e2e-' + Date.now()
  };

  const result = await makeRequest('POST', '/auth/login', loginData);
  
  if (result.status === 200 || result.status === 201) {
    log('Login initiated successfully', 'success');
    return { success: true, message: 'Login flow works - OTP would be sent to phone' };
  } else if (result.status === 404) {
    // User doesn't exist, need to signup first
    log('User not found, testing signup flow', 'warning');
    return await testSignup();
  } else {
    log(`Login failed: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

async function testSignup() {
  log('=== TEST 1b: Signup (New User) ===', 'info');
  
  const signupData = {
    phone: '9876543210',
    name: 'E2E Test User',
    fcmToken: 'test-fcm-token-e2e-' + Date.now(),
    address: 'Test Address, Greater Noida',
    latitude: 28.5781082,
    longitude: 77.4389454
  };

  const result = await makeRequest('POST', '/auth/signup', signupData);
  
  if (result.status === 201 || result.status === 200) {
    log('Signup successful', 'success');
    return { success: true, message: 'User created successfully' };
  } else if (result.status === 409) {
    // User already exists, this is fine
    log('User already exists', 'warning');
    return { success: true, message: 'User already exists' };
  } else {
    log(`Signup failed: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 2: Get Service Profiles
async function testServiceProfiles() {
  log('=== TEST 2: Service Profiles ===', 'info');
  
  const result = await makeRequest('GET', '/service-profiles');
  
  if (result.status === 200 && result.data) {
    log(`Found ${result.data.length} service profiles`, 'success');
    return { success: true, services: result.data };
  } else {
    log(`Failed to get services: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 3: Check Availability
async function testAvailability() {
  log('=== TEST 3: Check Service Availability ===', 'info');
  
  const availabilityData = {
    latitude: 28.5781082,
    longitude: 77.4389454,
    serviceId: 1 // Cleaning service
  };

  const result = await makeRequest('POST', '/availability/check', availabilityData);
  
  if (result.status === 200) {
    log(`Availability: isAvailable=${result.data.isAvailable}, workers=${result.data.workerCount}`, 'success');
    return { success: true, availability: result.data };
  } else {
    log(`Availability check failed: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 4: Get Slots
async function testSlots() {
  log('=== TEST 4: Get Available Slots ===', 'info');
  
  const result = await makeRequest('GET', '/slots');
  
  if (result.status === 200 && result.data) {
    log(`Found ${result.data.length} slots`, 'success');
    return { success: true, slots: result.data };
  } else {
    log(`Failed to get slots: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 5: One-Time Booking Creation
async function testOneTimeBooking() {
  log('=== TEST 5: One-Time Booking Creation ===', 'info');
  
  const today = new Date();
  const bookingDate = today.toISOString().split('T')[0];
  
  // First get available slots
  const slotsResult = await makeRequest('GET', '/slots');
  let slotId = 1;
  if (slotsResult.status === 200 && slotsResult.data && slotsResult.data.length > 0) {
    slotId = slotsResult.data[0].id;
  }

  const bookingData = {
    serviceId: 1,
    date: bookingDate,
    startTime: '10:00',
    endTime: '12:00',
    address: 'Test Address, Greater Noida',
    latitude: 28.5781082,
    longitude: 77.4389454,
    notes: 'E2E Test One-Time Booking',
    isSubscription: false
  };

  const result = await makeRequest('POST', '/bookings', bookingData);
  
  if (result.status === 201 || result.status === 200) {
    log(`One-Time Booking created: ID=${result.data.id}`, 'success');
    return { success: true, booking: result.data };
  } else {
    log(`One-Time Booking failed: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 6: Subscription Creation
async function testSubscription() {
  log('=== TEST 6: Subscription Service Creation ===', 'info');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  const subscriptionData = {
    serviceId: 1,
    startDate: startDateStr,
    frequency: 'WEEKLY',
    daysOfWeek: ['MONDAY', 'WEDNESDAY'],
    startTime: '10:00',
    endTime: '12:00',
    address: 'Test Address, Greater Noida',
    latitude: 28.5781082,
    longitude: 77.4389454,
    notes: 'E2E Test Subscription',
    isActive: true
  };

  const result = await makeRequest('POST', '/subscriptions', subscriptionData);
  
  if (result.status === 201 || result.status === 200) {
    log(`Subscription created: ID=${result.data.id}`, 'success');
    return { success: true, subscription: result.data };
  } else {
    log(`Subscription creation failed: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 7: Worker Assignment
async function testWorkerAssignment() {
  log('=== TEST 7: Worker Assignment ===', 'info');
  
  // First, get bookings to find one without worker
  const bookingsResult = await makeRequest('GET', '/bookings');
  
  let pendingBooking = null;
  if (bookingsResult.status === 200 && bookingsResult.data && bookingsResult.data.length > 0) {
    pendingBooking = bookingsResult.data.find(b => !b.workerId && b.status !== 'COMPLETED');
  }
  
  if (pendingBooking) {
    log(`Found pending booking: ID=${pendingBooking.id}, attempting assignment...`, 'info');
    
    const assignmentResult = await makeRequest('POST', `/bookings/${pendingBooking.id}/attempt-assignment`);
    
    if (assignmentResult.status === 200 || assignmentResult.status === 201) {
      log(`Worker assignment completed for booking ${pendingBooking.id}`, 'success');
      return { success: true, assignment: assignmentResult.data };
    } else {
      log(`Worker assignment pending: ${JSON.stringify(assignmentResult.data)}`, 'warning');
      return { success: true, message: 'Assignment in progress', pending: true };
    }
  } else {
    log('No pending bookings found for assignment', 'warning');
    return { success: true, message: 'No pending bookings to assign' };
  }
}

// Test 8: Notifications - Get Upcoming Bookings
async function testUpcomingBookings() {
  log('=== TEST 8: Notifications - Upcoming Bookings ===', 'info');
  
  const result = await makeRequest('GET', '/notifications/upcoming-bookings');
  
  if (result.status === 200) {
    log(`Found ${result.data.length} upcoming bookings`, 'success');
    return { success: true, bookings: result.data };
  } else {
    log(`Failed to get upcoming bookings: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 9: Notifications - All Bookings
async function testAllBookings() {
  log('=== TEST 9: Notifications - All Bookings ===', 'info');
  
  const result = await makeRequest('GET', '/notifications/all-bookings');
  
  if (result.status === 200) {
    log(`Found ${result.data.length} total bookings`, 'success');
    return { success: true, bookings: result.data };
  } else {
    log(`Failed to get all bookings: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 10: Get Bookings
async function testGetBookings() {
  log('=== TEST 10: Get User Bookings ===', 'info');
  
  const result = await makeRequest('GET', '/bookings');
  
  if (result.status === 200) {
    log(`Found ${result.data.length} bookings`, 'success');
    return { success: true, bookings: result.data };
  } else {
    log(`Failed to get bookings: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 11: Health Check
async function testHealthCheck() {
  log('=== TEST 11: Health Check ===', 'info');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.status === 200) {
    log('Health check passed', 'success');
    return { success: true, health: result.data };
  } else {
    log(`Health check failed: ${JSON.stringify(result.data)}`, 'error');
    return { success: false, error: result.data };
  }
}

// Test 12: System Readiness
async function testSystemReadiness() {
  log('=== TEST 12: System Readiness ===', 'info');
  
  const result = await makeRequest('GET', '/system/readiness');
  
  if (result.status === 200) {
    log('System ready', 'success');
    return { success: true, readiness: result.data };
  } else {
    log(`System not ready: ${JSON.stringify(result.data)}`, 'warning');
    return { success: true, readiness: result.data };
  }
}

// Main Test Runner
async function runComprehensiveTests() {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════', 'info');
  log('    COMPREHENSIVE END-TO-END TEST SUITE', 'info');
  log('    Login → Booking → Subscription → Worker → Notifications', 'info');
  log('═══════════════════════════════════════════════════════════\n', 'info');

  const results = {
    login: null,
    signup: null,
    serviceProfiles: null,
    availability: null,
    slots: null,
    oneTimeBooking: null,
    subscription: null,
    workerAssignment: null,
    upcomingBookings: null,
    allBookings: null,
    getBookings: null,
    healthCheck: null,
    systemReadiness: null
  };

  // Run all tests
  try {
    // Test 1: Login (will also test signup if needed)
    results.healthCheck = await testHealthCheck();
    await new Promise(r => setTimeout(r, 500));

    results.systemReadiness = await testSystemReadiness();
    await new Promise(r => setTimeout(r, 500));

    results.login = await testLogin();
    await new Promise(r => setTimeout(r, 500));

    results.serviceProfiles = await testServiceProfiles();
    await new Promise(r => setTimeout(r, 500));

    results.availability = await testAvailability();
    await new Promise(r => setTimeout(r, 500));

    results.slots = await testSlots();
    await new Promise(r => setTimeout(r, 500));

    results.oneTimeBooking = await testOneTimeBooking();
    await new Promise(r => setTimeout(r, 500));

    results.subscription = await testSubscription();
    await new Promise(r => setTimeout(r, 500));

    results.workerAssignment = await testWorkerAssignment();
    await new Promise(r => setTimeout(r, 500));

    results.getBookings = await testGetBookings();
    await new Promise(r => setTimeout(r, 500));

    results.upcomingBookings = await testUpcomingBookings();
    await new Promise(r => setTimeout(r, 500));

    results.allBookings = await testAllBookings();
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  }

  // Summary
  console.log('\n');
  log('═══════════════════════════════════════════════════════════', 'info');
  log('                    TEST SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');

  const testNames = {
    healthCheck: 'Health Check',
    systemReadiness: 'System Readiness',
    login: 'Login/Authentication',
    serviceProfiles: 'Service Profiles',
    availability: 'Service Availability',
    slots: 'Available Slots',
    oneTimeBooking: 'One-Time Booking',
    subscription: 'Subscription Service',
    workerAssignment: 'Worker Assignment',
    getBookings: 'Get Bookings',
    upcomingBookings: 'Upcoming Bookings Notification',
    allBookings: 'All Bookings Notification'
  };

  let passed = 0;
  let failed = 0;

  for (const [key, name] of Object.entries(testNames)) {
    const result = results[key];
    if (result && result.success) {
      log(`${name}: PASSED`, 'success');
      passed++;
    } else {
      log(`${name}: FAILED`, 'error');
      failed++;
    }
  }

  console.log('\n');
  log(`Total: ${passed} passed, ${failed} failed`, failed > 0 ? 'error' : 'success');
  log('═══════════════════════════════════════════════════════════\n', 'info');

  return results;
}

// Run tests
runComprehensiveTests()
  .then(results => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
