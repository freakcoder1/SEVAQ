/**
 * Comprehensive E2E Test Suite
 * Tests the complete flow from Login to Booking including:
 * - Login/Authentication
 * - One-Time Service Booking
 * - Subscription Service
 * - Worker Assignment
 * - Notifications
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:45357/api';
let authToken = null;
let testUserId = null;

async function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📝';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function runTests() {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════', 'info');
  log('    COMPREHENSIVE END-TO-END TEST SUITE', 'info');
  log('    Login → Booking → Subscription → Worker → Notifications', 'info');
  log('═══════════════════════════════════════════════════════════\n', 'info');

  const results = {
    passed: 0,
    failed: 0
  };

  try {
    // TEST 1: Login
    log('=== TEST 1: Login/Authentication ===', 'info');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test.user1@example.com',
        password: 'password123'
      });
      authToken = loginResponse.data.access_token;
      testUserId = loginResponse.data.user.id;
      log(`Login successful - User ID: ${testUserId}`, 'success');
      results.passed++;
    } catch (error) {
      log(`Login failed: ${error.response?.data?.message || error.message}`, 'error');
      results.failed++;
    }

    // TEST 2: Health Check (no auth required)
    log('\n=== TEST 2: Health Check ===', 'info');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      log(`Health OK - Database: ${healthResponse.data.info.database.status}`, 'success');
      results.passed++;
    } catch (error) {
      log(`Health check failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 3: Service Profiles (no auth required)
    log('\n=== TEST 3: Service Profiles ===', 'info');
    try {
      const servicesResponse = await axios.get(`${BASE_URL}/service-profiles`);
      log(`Found ${servicesResponse.data.length} service profiles`, 'success');
      results.passed++;
    } catch (error) {
      log(`Service profiles failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 4: Get Bookings (with auth)
    log('\n=== TEST 4: Get Bookings ===', 'info');
    try {
      const bookingsResponse = await axios.get(`${BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`Found ${bookingsResponse.data.length} bookings`, 'success');
      results.passed++;
    } catch (error) {
      log(`Get bookings failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 5: Get Subscriptions (with auth)
    log('\n=== TEST 5: Get Subscriptions ===', 'info');
    try {
      const subsResponse = await axios.get(`${BASE_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`Found ${subsResponse.data.length} subscriptions`, 'success');
      results.passed++;
    } catch (error) {
      log(`Get subscriptions failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 6: Upcoming Bookings Notification (with auth)
    log('\n=== TEST 6: Upcoming Bookings Notification ===', 'info');
    try {
      const upcomingResponse = await axios.get(`${BASE_URL}/notifications/upcoming-bookings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`Found ${upcomingResponse.data.length} upcoming bookings`, 'success');
      results.passed++;
    } catch (error) {
      log(`Upcoming bookings failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 7: All Bookings Notification (with auth)
    log('\n=== TEST 7: All Bookings Notification ===', 'info');
    try {
      const allBookingsResponse = await axios.get(`${BASE_URL}/notifications/all-bookings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`Found ${allBookingsResponse.data.length} total bookings`, 'success');
      results.passed++;
    } catch (error) {
      log(`All bookings failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 8: Availability Check
    log('\n=== TEST 8: Service Availability Check ===', 'info');
    try {
      const availResponse = await axios.post(`${BASE_URL}/availability/check`, {
        latitude: 28.5781082,
        longitude: 77.4389454,
        serviceId: 1
      });
      log(`Availability: ${availResponse.data.status}, Workers: ${availResponse.data.availableCount}`, 'success');
      results.passed++;
    } catch (error) {
      log(`Availability check failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 9: Slots
    log('\n=== TEST 9: Available Slots ===', 'info');
    try {
      const slotsResponse = await axios.get(`${BASE_URL}/slots`);
      log(`Found ${slotsResponse.data.length} slots`, 'success');
      results.passed++;
    } catch (error) {
      log(`Slots failed: ${error.message}`, 'error');
      results.failed++;
    }

    // TEST 10: Locations Availability
    log('\n=== TEST 10: Locations Service Availability ===', 'info');
    try {
      const locResponse = await axios.get(`${BASE_URL}/locations/availability?lat=28.5781082&lng=77.4389454&radius=5`);
      log(`Location availability OK`, 'success');
      results.passed++;
    } catch (error) {
      log(`Location availability failed: ${error.message}`, 'error');
      results.failed++;
    }

  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
  }

  // Summary
  console.log('\n');
  log('═══════════════════════════════════════════════════════════', 'info');
  log('                    TEST SUMMARY', 'info');
  log('═══════════════════════════════════════════════════════════', 'info');
  log(`Total Passed: ${results.passed}`, results.passed >= 8 ? 'success' : 'warning');
  log(`Total Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
  log('═══════════════════════════════════════════════════════════\n', 'info');

  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED!', 'success');
  } else {
    log('⚠️ SOME TESTS NEED ATTENTION', 'warning');
  }

  return results;
}

runTests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
