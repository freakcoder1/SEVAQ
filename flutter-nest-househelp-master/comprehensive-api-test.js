/**
 * Comprehensive API Test Suite
 * Tests: Login -> Booking (One-Time) -> Subscription -> Worker Assignment -> Notifications
 * 
 * Base URL: http://localhost:45357
 */

const http = require('http');
const BASE_URL = 'http://127.0.0.1:45357';

// Test utilities
const log = (testName, status, details = '') => {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${symbol} ${testName}: ${status} ${details}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP helper
async function makeRequest(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    // Ensure endpoint starts with /api
    const path = endpoint.startsWith('/api') ? endpoint : '/api' + endpoint;
    
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (e) => reject(e));
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ============================================
// TEST 1: Authentication / Login
// ============================================
async function testLogin() {
  console.log('\n========== TEST 1: Authentication / Login ==========\n');
  
  const results = {
    validCredentials: false,
    invalidCredentials: false,
  };
  let token = null;
  let userId = null;
  
  // Test 1.1: Valid login with existing user
  try {
    // First, let's create a test user via signup
    const randomEmail = 'testuser' + Date.now() + '@example.com';
    const signupResponse = await makeRequest('POST', '/api/auth/signup', {
      email: randomEmail,
      password: 'Test123456!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+91' + Date.now().toString().slice(-10),
    });
    
    let loginEmail = randomEmail;
    let loginPassword = 'Test123456!';
    
    const response = await makeRequest('POST', '/api/auth/login', {
      email: loginEmail,
      password: loginPassword,
    });
    
    if (response.status === 201 && response.data.access_token) {
      results.validCredentials = true;
      token = response.data.access_token;
      // Decode JWT to get userId
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub || payload.userId;
      log('Login with valid credentials', 'PASS', `Token: ${token.substring(0, 20)}..., UserId: ${userId}`);
    } else {
      log('Login with valid credentials', 'FAIL', `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    log('Login with valid credentials', 'FAIL', error.message);
  }
  
  // Test 1.2: Invalid credentials should fail
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    
    if (response.status === 401) {
      results.invalidCredentials = true;
      log('Login with invalid credentials', 'PASS', 'Correctly rejected');
    } else {
      log('Login with invalid credentials', 'FAIL', `Expected 401, got ${response.status}`);
    }
  } catch (error) {
    log('Login with invalid credentials', 'FAIL', error.message);
  }
  
  return { ...results, token, userId };
}

// ============================================
// TEST 2: One-Time Booking
// ============================================
async function testOneTimeBooking(token, userId) {
  console.log('\n========== TEST 2: One-Time Booking ==========\n');
  
  const results = {
    createBooking: false,
    getBookings: false,
    updateBooking: false,
  };
  
  let bookingId = null;
  
  // Test 2.1: Create a one-time booking
  try {
    // First, get available services
    const servicesRes = await makeRequest('GET', '/services');
    // FIX: Handle nested data structure (data.data vs data)
    const services = servicesRes.data.data || servicesRes.data;
    const service = services && services[0];
    
    if (!service) {
      log('Create one-time booking', 'FAIL', 'No services available');
      return { ...results, bookingId: null };
    }
    
    // Create booking for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const response = await makeRequest('POST', '/bookings', {
      serviceId: service.id,
      userId: userId,
      date: dateStr,
      startTime: '10:00',
      endTime: '12:00',
      type: 'ONE_TIME',
      location: {
        latitude: 28.5781082,
        longitude: 77.4389454,
        address: 'Test Address, Greater Noida'
      }
    }, token);
    
    if (response.status === 201 || response.status === 200) {
      results.createBooking = true;
      bookingId = response.data.id || response.data.booking?.id;
      log('Create one-time booking', 'PASS', `Booking ID: ${bookingId}`);
    } else {
      log('Create one-time booking', 'FAIL', `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    log('Create one-time booking', 'FAIL', error.message);
  }
  
  // Test 2.2: Get all bookings
  try {
    const response = await makeRequest('GET', '/bookings', null, token);
    
    if (response.data.data || response.data.length >= 0) {
      results.getBookings = true;
      log('Get all bookings', 'PASS', `Found ${response.data.data?.length || response.data.length || 0} bookings`);
    } else {
      log('Get all bookings', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Get all bookings', 'FAIL', error.message);
  }
  
  return { ...results, bookingId };
}

// ============================================
// TEST 3: Subscription Service
// ============================================
async function testSubscription(token) {
  console.log('\n========== TEST 3: Subscription Service ==========\n');
  
  const results = {
    getServiceProfiles: false,
    createSubscription: false,
    getSubscriptions: false,
    pauseSubscription: false,
    resumeSubscription: false,
    cancelSubscription: false,
  };
  
  let subscriptionId = null;
  let profile = null;
  
  // Test 3.1: Get service profiles
  try {
    const response = await makeRequest('GET', '/service-profiles');
    
    if (response.data.success && response.data.data) {
      results.getServiceProfiles = true;
      profile = response.data.data[0];
      log('Get service profiles', 'PASS', `Found ${response.data.data.length} profiles`);
    } else {
      log('Get service profiles', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Get service profiles', 'FAIL', error.message);
  }
  
  // Test 3.2: Get subscriptions for current user
  try {
    const response = await makeRequest('GET', '/subscriptions', null, token);
    
    if (Array.isArray(response.data) || response.data.length >= 0) {
      results.getSubscriptions = true;
      log('Get user subscriptions', 'PASS', `Found ${response.data.length || 0} subscriptions`);
    } else {
      log('Get user subscriptions', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Get user subscriptions', 'FAIL', error.message);
  }
  
  // Test 3.3: Create subscription
  try {
    if (!profile) {
      log('Create subscription', 'FAIL', 'No service profile available');
      return { ...results, subscriptionId: null };
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    
    const response = await makeRequest('POST', '/subscriptions', {
      serviceProfileId: profile.id,
      preferredTimeWindow: 'MORNING',
      startDate: startDate.toISOString().split('T')[0],
      location: {
        lat: 28.5355,
        lng: 77.391,
        address: 'Test Address, Noida',
      },
      monthlyPriceSnapshot: profile.monthlyPrice || 2500,
    }, token);
    
    if (response.status === 201 || response.status === 200) {
      results.createSubscription = true;
      subscriptionId = response.data.id || response.data.publicId;
      log('Create subscription', 'PASS', `Subscription ID: ${subscriptionId}`);
    } else {
      log('Create subscription', 'FAIL', `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    log('Create subscription', 'FAIL', error.message);
  }
  
  // Test 3.4: Pause subscription
  if (subscriptionId) {
    try {
      const response = await makeRequest('PUT', `/subscriptions/${subscriptionId}/pause`, null, token);
      
      if (response.status === 200 || response.status === 201) {
        results.pauseSubscription = true;
        log('Pause subscription', 'PASS', 'Subscription paused');
      }
    } catch (error) {
      log('Pause subscription', 'FAIL', error.message);
    }
    
    // Test 3.5: Resume subscription
    try {
      const response = await makeRequest('PUT', `/subscriptions/${subscriptionId}/resume`, null, token);
      
      if (response.status === 200 || response.status === 201) {
        results.resumeSubscription = true;
        log('Resume subscription', 'PASS', 'Subscription resumed');
      }
    } catch (error) {
      log('Resume subscription', 'FAIL', error.message);
    }
    
    // Test 3.6: Cancel subscription
    try {
      const response = await makeRequest('PUT', `/subscriptions/${subscriptionId}/cancel`, null, token);
      
      if (response.status === 200 || response.status === 201) {
        results.cancelSubscription = true;
        log('Cancel subscription', 'PASS', 'Subscription cancelled');
      }
    } catch (error) {
      log('Cancel subscription', 'FAIL', error.message);
    }
  }
  
  return { ...results, subscriptionId };
}

// ============================================
// TEST 4: Worker Assignment
// ============================================
async function testWorkerAssignment(token, bookingId) {
  console.log('\n========== TEST 4: Worker Assignment ==========\n');
  
  const results = {
    getWorkers: false,
    assignWorker: false,
    getBookings: false,
  };
  
  // Test 4.1: Get available workers by location
  try {
    const response = await makeRequest('GET', '/workers?lat=28.5355&long=77.391&radius=10');
    
    if (response.data) {
      results.getWorkers = true;
      const workerCount = Array.isArray(response.data) ? response.data.length : 'multiple';
      log('Get available workers', 'PASS', `Found ${workerCount} workers`);
    } else {
      log('Get available workers', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Get available workers', 'FAIL', error.message);
  }
  
  // Test 4.2: Get workers by service
  try {
    const servicesRes = await makeRequest('GET', '/services');
    const service = servicesRes.data[0];
    
    if (service) {
      const response = await makeRequest('GET', `/workers/service/${service.id}`);
      
      if (response.data) {
        results.getWorkers = true;
        const workerCount = Array.isArray(response.data) ? response.data.length : 'multiple';
        log('Get workers by service', 'PASS', `Found ${workerCount} workers`);
      }
    }
  } catch (error) {
    log('Get workers by service', 'FAIL', error.message);
  }
  
  // Test 4.3: Assign worker to booking
  try {
    // First get workers
    const workersRes = await makeRequest('GET', '/workers?lat=28.5355&long=77.391&radius=10');
    const workers = Array.isArray(workersRes.data) ? workersRes.data : [];
    const worker = workers[0];
    
    if (!bookingId || !worker) {
      log('Assign worker to booking', 'FAIL', 'Missing booking or worker');
      return results;
    }
    
    const response = await makeRequest('POST', '/bookings/assign', {
      bookingId: bookingId.toString(),
      workerId: worker.id.toString(),
    }, token);
    
    if (response.status === 201 || response.status === 200) {
      results.assignWorker = true;
      log('Assign worker to booking', 'PASS', `Assigned worker: ${worker.id}`);
    } else {
      log('Assign worker to booking', 'FAIL', `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    log('Assign worker to booking', 'FAIL', error.message);
  }
  
  return results;
}

// ============================================
// TEST 5: Notifications
// ============================================
async function testNotifications(token) {
  console.log('\n========== TEST 5: Notifications ==========\n');
  
  const results = {
    getUpcomingBookings: false,
    getAllBookings: false,
    sendPreServiceReminders: false,
  };
  
  // Test 5.1: Get upcoming bookings for reminders
  try {
    const response = await makeRequest('GET', '/notifications/upcoming-bookings', null, token);
    
    if (response.data.count !== undefined) {
      results.getUpcomingBookings = true;
      log('Get upcoming bookings for notifications', 'PASS', `Found ${response.data.count} bookings`);
    } else {
      log('Get upcoming bookings for notifications', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Get upcoming bookings for notifications', 'FAIL', error.message);
  }
  
  // Test 5.2: Get all bookings (user)
  try {
    const response = await makeRequest('GET', '/notifications/all-bookings', null, token);
    
    if (response.data.count !== undefined) {
      results.getAllBookings = true;
      log('Get all bookings for user', 'PASS', `Found ${response.data.count} bookings`);
    } else {
      log('Get all bookings for user', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Get all bookings for user', 'FAIL', error.message);
  }
  
  // Test 5.3: Send pre-service reminders (admin endpoint)
  try {
    const response = await makeRequest('POST', '/notifications/send-pre-service-reminders');
    
    if (response.status === 201 || response.status === 200) {
      results.sendPreServiceReminders = true;
      log('Send pre-service reminders', 'PASS', 'Reminders triggered');
    } else {
      log('Send pre-service reminders', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Send pre-service reminders', 'FAIL', error.message);
  }
  
  return results;
}

// ============================================
// TEST 6: Service Profiles
// ============================================
async function testServiceProfiles() {
  console.log('\n========== TEST 6: Service Profiles ==========\n');
  
  const results = {
    getAllProfiles: false,
    getByServiceType: false,
    getProfileById: false,
  };
  
  // Test 6.1: Get all profiles
  try {
    const response = await makeRequest('GET', '/service-profiles');
    
    if (response.data.success) {
      results.getAllProfiles = true;
      log('Get all service profiles', 'PASS', `Found ${response.data.data.length} profiles`);
    } else {
      log('Get all service profiles', 'FAIL', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Get all service profiles', 'FAIL', error.message);
  }
  
  // Test 6.2: Get profiles by service type
  try {
    const response = await makeRequest('GET', '/service-profiles?serviceType=MANAGED');
    
    if (response.data.success) {
      results.getByServiceType = true;
      log('Get profiles by service type', 'PASS', `Found ${response.data.data.length} MANAGED profiles`);
    }
  } catch (error) {
    log('Get profiles by service type', 'FAIL', error.message);
  }
  
  // Test 6.3: Get profile by ID
  try {
    const allProfiles = await makeRequest('GET', '/service-profiles');
    const firstProfileId = allProfiles.data.data?.[0]?.id;
    
    if (firstProfileId) {
      const response = await makeRequest('GET', `/service-profiles/${firstProfileId}`);
      
      if (response.data.success) {
        results.getProfileById = true;
        log('Get service profile by ID', 'PASS', `Found profile: ${response.data.data.name}`);
      }
    }
  } catch (error) {
    log('Get service profile by ID', 'FAIL', error.message);
  }
  
  return results;
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log('======================================================');
  console.log('     COMPREHENSIVE API TEST SUITE');
  console.log('     Login -> Booking -> Subscription -> Assignment -> Notifications');
  console.log('======================================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  const allResults = {
    login: {},
    oneTimeBooking: {},
    subscription: {},
    workerAssignment: {},
    notifications: {},
    serviceProfiles: {},
  };
  
  try {
    // Step 1: Login
    const loginResult = await testLogin();
    allResults.login = loginResult;
    
    if (!loginResult.token) {
      console.log('\n⚠️ Cannot proceed without valid authentication token');
      console.log('Testing public endpoints only...\n');
      
      // Test service profiles (public endpoint)
      allResults.serviceProfiles = await testServiceProfiles();
    } else {
      // Step 2: One-Time Booking
      const bookingResult = await testOneTimeBooking(loginResult.token);
      allResults.oneTimeBooking = bookingResult;
      
      // Step 3: Subscription
      const subscriptionResult = await testSubscription(loginResult.token);
      allResults.subscription = subscriptionResult;
      
      // Step 4: Worker Assignment
      const bookingId = bookingResult.bookingId;
      allResults.workerAssignment = await testWorkerAssignment(loginResult.token, bookingId);
      
      // Step 5: Notifications
      allResults.notifications = await testNotifications(loginResult.token);
      
      // Step 6: Service Profiles
      allResults.serviceProfiles = await testServiceProfiles();
    }
  } catch (error) {
    console.error('\n💥 Test execution error:', error.message);
  }
  
  // Summary
  console.log('\n======================================================');
  console.log('               TEST SUMMARY');
  console.log('======================================================');
  
  const summarize = (section, results) => {
    const passed = Object.values(results).filter(v => v === true).length;
    const total = Object.keys(results).length;
    console.log(`${section}: ${passed}/${total} passed`);
  };
  
  summarize('Login', allResults.login);
  summarize('One-Time Booking', allResults.oneTimeBooking);
  summarize('Subscription', allResults.subscription);
  summarize('Worker Assignment', allResults.workerAssignment);
  summarize('Notifications', allResults.notifications);
  summarize('Service Profiles', allResults.serviceProfiles);
  
  console.log('\n======================================================');
  console.log('               TESTS COMPLETED');
  console.log('======================================================\n');
  
  return allResults;
}

// Export for use in other scripts
module.exports = { runAllTests, makeRequest, BASE_URL };

// Run if executed directly
if (require.main === module) {
  runAllTests();
}
