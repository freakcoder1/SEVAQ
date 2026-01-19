const axios = require('axios');
const bcrypt = require('bcrypt');
const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'househelp'
};

// API base URL
const API_BASE = 'http://127.0.0.1:45357';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message = '') {
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
  results.tests.push({ testName, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function createAdminUser() {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('AdminPass123!', salt);

    // Use a fixed UUID for testing
    const fixedId = '550e8400-e29b-41d4-a716-446655440000';

    // Insert admin user
    const query = `
      INSERT INTO "user" (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
      VALUES ($1, 'admin@test.com', $2, 'Admin', 'User', 'admin', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role
    `;

    const result = await client.query(query, [fixedId, hashedPassword]);
    if (result.rows.length > 0) {
      console.log('Admin user created:', result.rows[0]);
      return result.rows[0];
    } else {
      // User already exists, fetch it
      const existing = await client.query('SELECT id, email, role FROM "user" WHERE email = $1', ['admin@test.com']);
      console.log('Admin user already exists:', existing.rows[0]);
      return existing.rows[0];
    }
  } finally {
    await client.end();
  }
}

async function createRegularUser() {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('UserPass123!', salt);

    // Use a fixed UUID for testing
    const fixedId = '550e8400-e29b-41d4-a716-446655440001';

    // Insert regular user
    const query = `
      INSERT INTO "user" (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
      VALUES ($1, 'user@test.com', $2, 'Regular', 'User', 'user', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role
    `;

    const result = await client.query(query, [fixedId, hashedPassword]);
    if (result.rows.length > 0) {
      console.log('Regular user created:', result.rows[0]);
      return result.rows[0];
    } else {
      // User already exists, fetch it
      const existing = await client.query('SELECT id, email, role FROM "user" WHERE email = $1', ['user@test.com']);
      console.log('Regular user already exists:', existing.rows[0]);
      return existing.rows[0];
    }
  } finally {
    await client.end();
  }
}

async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
}

async function testAdminGuardRestrictions() {
  console.log('\n=== Testing AdminGuard Restrictions ===');

  // Create users
  const adminUser = await createAdminUser();
  const regularUser = await createRegularUser();

  // Login as regular user
  const userToken = await loginUser('user@test.com', 'UserPass123!');

  // Test accessing admin endpoints with regular user
  const adminEndpoints = [
    { method: 'GET', url: '/users' },
    { method: 'POST', url: '/users', data: {} },
    { method: 'GET', url: '/services' }, // Wait, services GET is not guarded
    { method: 'POST', url: '/services', data: {} },
    { method: 'GET', url: '/metrics/system' },
    { method: 'GET', url: '/system/readiness' }
  ];

  for (const endpoint of adminEndpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${API_BASE}${endpoint.url}`,
        headers: { Authorization: `Bearer ${userToken}` },
        data: endpoint.data
      };

      await axios(config);
      // If we get here, the guard didn't work
      if (endpoint.url === '/services' && endpoint.method === 'GET') {
        logTest(`AdminGuard on ${endpoint.method} ${endpoint.url}`, true, 'GET services is not guarded (expected)');
      } else {
        logTest(`AdminGuard on ${endpoint.method} ${endpoint.url}`, false, 'Should have been blocked');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        if (endpoint.url === '/services' && endpoint.method === 'GET') {
          logTest(`AdminGuard on ${endpoint.method} ${endpoint.url}`, false, 'Unexpectedly blocked GET services');
        } else {
          logTest(`AdminGuard on ${endpoint.method} ${endpoint.url}`, true, 'Correctly blocked non-admin');
        }
      } else {
        logTest(`AdminGuard on ${endpoint.method} ${endpoint.url}`, false, `Unexpected error: ${error.response?.status} ${error.response?.data?.message}`);
      }
    }
  }

  // Test accessing admin endpoints with admin user
  const adminToken = await loginUser('admin@test.com', 'AdminPass123!');

  for (const endpoint of adminEndpoints) {
    if (endpoint.url === '/services' && endpoint.method === 'GET') continue; // Skip GET services

    try {
      const config = {
        method: endpoint.method,
        url: `${API_BASE}${endpoint.url}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        data: endpoint.data || {}
      };

      const response = await axios(config);
      if (response.status === 200 || response.status === 201) {
        logTest(`Admin access to ${endpoint.method} ${endpoint.url}`, true);
      } else {
        logTest(`Admin access to ${endpoint.method} ${endpoint.url}`, false, `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logTest(`Admin access to ${endpoint.method} ${endpoint.url}`, false, `Error: ${error.response?.status} ${error.response?.data?.message}`);
    }
  }
}

async function testInputValidation() {
  console.log('\n=== Testing Input Validation ===');

  const adminToken = await loginUser('admin@test.com', 'AdminPass123!');

  // Test invalid user creation
  const invalidUserData = [
    { data: {}, expectedError: 'Email is required' },
    { data: { email: 'invalid-email' }, expectedError: 'valid email' },
    { data: { email: 'test@example.com', password: '123' }, expectedError: 'at least 8 characters' },
    { data: { email: 'test@example.com', password: 'password123', firstName: '', lastName: 'Doe' }, expectedError: 'First name is required' },
    { data: { email: 'test@example.com', password: 'Password123!', firstName: 'John123', lastName: 'Doe' }, expectedError: 'letters, spaces, hyphens' },
    { data: { email: 'test@example.com', password: 'Password123!', firstName: 'John', lastName: 'Doe', role: 'invalid' }, expectedError: 'valid user role' }
  ];

  for (const testCase of invalidUserData) {
    try {
      await axios.post(`${API_BASE}/users`, testCase.data, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest('User creation validation', false, `Should have failed: ${testCase.expectedError}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes(testCase.expectedError)) {
        logTest('User creation validation', true, `Correctly rejected: ${testCase.expectedError}`);
      } else {
        logTest('User creation validation', false, `Wrong error: ${error.response?.data?.message}`);
      }
    }
  }

  // Test valid user creation
  try {
    const validUser = {
      email: 'validuser@example.com',
      password: 'ValidPass123!',
      firstName: 'Valid',
      lastName: 'User',
      role: 'user'
    };

    const response = await axios.post(`${API_BASE}/users`, validUser, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.status === 201) {
      logTest('Valid user creation', true);
    } else {
      logTest('Valid user creation', false, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Valid user creation', false, `Error: ${error.response?.data?.message}`);
  }
}

async function testBusinessLogicValidations() {
  console.log('\n=== Testing Business Logic Validations ===');

  const adminToken = await loginUser('admin@test.com', 'AdminPass123!');

  // Test admin user deletion prevention
  try {
    // First get admin user ID
    const usersResponse = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const adminUser = usersResponse.data.find(u => u.role === 'admin');
    if (adminUser) {
      await axios.delete(`${API_BASE}/users/${adminUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest('Admin user deletion prevention', false, 'Should have been blocked');
    } else {
      logTest('Admin user deletion prevention', false, 'No admin user found');
    }
  } catch (error) {
    if (error.response?.status === 403 && error.response.data.message.includes('Cannot delete admin users')) {
      logTest('Admin user deletion prevention', true);
    } else {
      logTest('Admin user deletion prevention', false, `Wrong error: ${error.response?.data?.message}`);
    }
  }

  // Test service pricing validation
  const invalidServicePrices = [-100, 0, 15000];

  for (const price of invalidServicePrices) {
    try {
      const serviceData = {
        name: 'Test Service',
        description: 'Test description',
        category: 'Test',
        basePrice: price
      };

      await axios.post(`${API_BASE}/services`, serviceData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest(`Service pricing validation (${price})`, false, 'Should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        logTest(`Service pricing validation (${price})`, true, `Correctly rejected: ${error.response.data.message}`);
      } else {
        logTest(`Service pricing validation (${price})`, false, `Wrong error: ${error.response?.data?.message}`);
      }
    }
  }

  // Test valid service creation
  try {
    const validService = {
      name: 'Valid Test Service',
      description: 'Valid test description',
      category: 'Test',
      basePrice: 1000
    };

    const response = await axios.post(`${API_BASE}/services`, validService, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.status === 201) {
      logTest('Valid service creation', true);
    } else {
      logTest('Valid service creation', false, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Valid service creation', false, `Error: ${error.response?.data?.message}`);
  }
}

async function testSystemMonitoringAccess() {
  console.log('\n=== Testing System Monitoring Access ===');

  const adminToken = await loginUser('admin@test.com', 'AdminPass123!');
  const userToken = await loginUser('user@test.com', 'UserPass123!');

  const monitoringEndpoints = [
    '/metrics/system',
    '/metrics/assignments',
    '/system/readiness'
  ];

  // Test admin access
  for (const endpoint of monitoringEndpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (response.status === 200) {
        logTest(`Admin access to ${endpoint}`, true);
      } else {
        logTest(`Admin access to ${endpoint}`, false, `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logTest(`Admin access to ${endpoint}`, false, `Error: ${error.response?.data?.message}`);
    }
  }

  // Test non-admin access (should be blocked)
  for (const endpoint of monitoringEndpoints) {
    try {
      await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      logTest(`Non-admin access to ${endpoint}`, false, 'Should have been blocked');
    } catch (error) {
      if (error.response?.status === 403) {
        logTest(`Non-admin access to ${endpoint}`, true, 'Correctly blocked');
      } else {
        logTest(`Non-admin access to ${endpoint}`, false, `Wrong error: ${error.response?.status}`);
      }
    }
  }
}

async function runTests() {
  console.log('Starting Admin Panel Validation Tests...\n');

  try {
    await testAdminGuardRestrictions();
    await testInputValidation();
    await testBusinessLogicValidations();
    await testSystemMonitoringAccess();

    console.log('\n=== Test Results Summary ===');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);

    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      results.tests.filter(t => !t.passed).forEach(test => {
        console.log(`- ${test.testName}: ${test.message}`);
      });
    }

  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, createAdminUser, createRegularUser };