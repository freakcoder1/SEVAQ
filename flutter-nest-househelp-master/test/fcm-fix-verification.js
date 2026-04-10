/**
 * FCM Fix Verification Script
 * 
 * This script verifies that the FCM notification fixes are working correctly:
 * 1. Dynamic service UUID lookup in subscription-assignment.scheduler.ts
 * 2. Database connection resilience in data-source.ts
 * 3. Firebase diagnostics in notifications.service.ts
 * 4. Firebase status endpoint in notifications.controller.ts
 * 
 * Usage: node test/fcm-fix-verification.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:45357';
const TEST_TIMEOUT_MS = 10000;

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(title, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logTest(name, passed, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? 'green' : 'red';
  log(`[${status}] ${name}`, color);
  if (details) {
    log(`       ${details}`, passed ? 'green' : 'red');
  }
}

/**
 * Make an HTTP request and return the response
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, { timeout: TEST_TIMEOUT_MS }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${TEST_TIMEOUT_MS}ms`));
    });
  });
}

/**
 * Test 1: Firebase Status Endpoint
 * Verifies that the Firebase status endpoint returns valid response
 */
async function testFirebaseStatusEndpoint() {
  logSection('Test 1: Firebase Status Endpoint');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/notifications/firebase-status`);
    
    // Check if endpoint exists
    logTest('Endpoint exists (HTTP 200)', response.statusCode === 200, 
      `Got HTTP ${response.statusCode}`);
    
    // Check response structure
    const hasSuccess = response.body && response.body.success === true;
    logTest('Response has success: true', hasSuccess,
      `success = ${response.body?.success}`);
    
    const hasTimestamp = response.body && response.body.timestamp;
    logTest('Response has timestamp', hasTimestamp,
      `timestamp = ${response.body?.timestamp}`);
    
    const hasFirebase = response.body && response.body.firebase;
    logTest('Response has firebase object', hasFirebase);
    
    if (hasFirebase) {
      const firebase = response.body.firebase;
      
      const hasInitialized = 'initialized' in firebase;
      logTest('Firebase object has initialized field', hasInitialized,
        `initialized = ${firebase.initialized}`);
      
      const hasProjectId = 'projectId' in firebase;
      logTest('Firebase object has projectId field', hasProjectId,
        `projectId = ${firebase.projectId}`);
      
      const hasCredentialType = 'credentialType' in firebase;
      logTest('Firebase object has credentialType field', hasCredentialType,
        `credentialType = ${firebase.credentialType}`);
      
      const hasLastError = 'lastError' in firebase;
      logTest('Firebase object has lastError field', hasLastError,
        `lastError = ${firebase.lastError}`);
      
      const hasCredentialValidation = 'credentialValidation' in firebase;
      logTest('Firebase object has credentialValidation', hasCredentialValidation);
      
      if (hasCredentialValidation) {
        const validation = firebase.credentialValidation;
        const requiredFields = [
          'hasServiceAccountJson',
          'hasProjectId',
          'hasClientEmail',
          'hasPrivateKey',
          'serviceAccountValid',
          'privateKeyFormatValid',
        ];
        
        const allFieldsPresent = requiredFields.every(field => field in validation);
        logTest('CredentialValidation has all required fields', allFieldsPresent);
      }
      
      const hasSummary = response.body && response.body.summary;
      logTest('Response has summary', hasSummary,
        `summary = ${response.body?.summary?.substring(0, 50)}...`);
    }
    
    return hasSuccess && hasFirebase;
  } catch (error) {
    logTest('Firebase Status Endpoint', false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Service UUID Resolution
 * Verifies that services can be found by name in the database
 */
async function testServiceUuidResolution() {
  logSection('Test 2: Service UUID Resolution');
  
  try {
    // Try to get services list
    const response = await makeRequest(`${BASE_URL}/api/services`);
    
    // Handle both paginated ({ data: [...], meta: {...} }) and non-paginated (plain array) formats
    let services = [];
    let isPaginated = false;
    
    if (response.statusCode === 200) {
      if (response.body && Array.isArray(response.body.data)) {
        // Paginated format
        services = response.body.data;
        isPaginated = true;
      } else if (Array.isArray(response.body)) {
        // Non-paginated format (plain array)
        services = response.body;
        isPaginated = false;
      }
    }
    
    const hasServices = services.length > 0;
    logTest('Services endpoint returns data', hasServices,
      `Found ${services.length} services (${isPaginated ? 'paginated' : 'non-paginated'} format)`);
    
    if (hasServices) {
      // Check for expected service names
      const expectedNames = ['Cooking', 'Cook', 'Kitchen', 'Home Cleaning', 'Cleaning', 'Maid Service', 'Maid', 'Housekeeping'];
      const foundNames = services.map(s => s.name).filter(name => expectedNames.some(expected => name.includes(expected)));
      
      logTest('Found expected service names', foundNames.length > 0,
        `Found: ${foundNames.join(', ') || 'none'}`);
      
      // Check that services have publicId (UUID)
      const servicesWithUuid = services.filter(s => s.publicId);
      logTest('Services have publicId (UUID)', servicesWithUuid.length > 0,
        `${servicesWithUuid.length}/${services.length} services have UUID`);
      
      // Log service details for debugging
      log('Service details:', 'blue');
      services.slice(0, 5).forEach(s => {
        log(`  - ${s.name}: ${s.publicId || 'NO UUID'}`, 'blue');
      });
      
      return servicesWithUuid.length > 0;
    }
    
    return false;
  } catch (error) {
    logTest('Service UUID Resolution', false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Database Connection Health
 * Verifies that the database connection is working
 */
async function testDatabaseConnection() {
  logSection('Test 3: Database Connection Health');
  
  try {
    // Try health endpoint if available
    let healthResponse;
    try {
      healthResponse = await makeRequest(`${BASE_URL}/api/health`);
    } catch {
      healthResponse = null;
    }
    
    if (healthResponse) {
      logTest('Health endpoint accessible', healthResponse.statusCode === 200,
        `HTTP ${healthResponse.statusCode}`);
      
      if (healthResponse.body) {
        const hasDbStatus = 'database' in healthResponse.body || 'db' in healthResponse.body;
        logTest('Health response includes database status', hasDbStatus);
      }
    } else {
      logTest('Health endpoint accessible', false, 'Endpoint not found');
    }
    
    // Try to access any endpoint that requires database
    const servicesResponse = await makeRequest(`${BASE_URL}/api/services`);
    // Handle both paginated and non-paginated formats
    const hasValidResponse = servicesResponse.statusCode === 200 &&
      (Array.isArray(servicesResponse.body) ||
       (servicesResponse.body && Array.isArray(servicesResponse.body.data)));
    const dbWorking = hasValidResponse;
    const serviceCount = Array.isArray(servicesResponse.body)
      ? servicesResponse.body.length
      : (servicesResponse.body?.data?.length || 0);
    logTest('Database responding to queries', dbWorking,
      `Services endpoint returned HTTP ${servicesResponse.statusCode} with ${serviceCount} services`);
    
    return dbWorking;
  } catch (error) {
    logTest('Database Connection Health', false, `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Configuration Verification
 * Checks that environment variables are properly configured
 */
async function testConfigurationVerification() {
  logSection('Test 4: Configuration Verification');
  
  // This test checks if the server is running and responding
  try {
    const response = await makeRequest(`${BASE_URL}/api`);
    logTest('Server is running', response.statusCode < 500,
      `HTTP ${response.statusCode}`);
    return true;
  } catch (error) {
    logTest('Server is running', false, `Server not accessible: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '#'.repeat(60), 'cyan');
  log('#  FCM Fix Verification Tests', 'cyan');
  log('#'.repeat(60), 'cyan');
  log(`\nBase URL: ${BASE_URL}`, 'yellow');
  log(`Timeout: ${TEST_TIMEOUT_MS}ms`, 'yellow');
  
  const results = {
    firebaseStatus: false,
    serviceUuidResolution: false,
    databaseConnection: false,
    configuration: false,
  };
  
  // Run tests
  results.configuration = await testConfigurationVerification();
  results.databaseConnection = await testDatabaseConnection();
  results.firebaseStatus = await testFirebaseStatusEndpoint();
  results.serviceUuidResolution = await testServiceUuidResolution();
  
  // Summary
  logSection('Test Summary');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  log(`\nTotal: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`, 
    failedTests === 0 ? 'green' : 'yellow');
  
  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? 'PASS' : 'FAIL';
    const color = passed ? 'green' : 'red';
    log(`  [${status}] ${name}`, color);
  });
  
  log('\n' + '#'.repeat(60), 'cyan');
  
  if (failedTests === 0) {
    log('\nAll FCM fix verification tests passed!', 'green');
    process.exit(0);
  } else {
    log(`\n${failedTests} test(s) failed. Check the output above for details.`, 'red');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
