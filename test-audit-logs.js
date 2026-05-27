const http = require('http');

const BASE_URL = 'http://127.0.0.1:3000/api';
let token = '';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (token && !headers['Authorization']) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function main() {
  console.log('=== Testing Audit Logs ===\n');
  
  // Step 1: Login
  console.log('1. Logging in as admin...');
  const loginRes = await makeRequest('POST', '/auth/login', {
    email: 'admin@sevaq.com',
    password: 'Admin@123456'
  });
  
  if (loginRes.status !== 200 || !loginRes.data || !loginRes.data.access_token) {
    console.error('Login failed:', loginRes.data || loginRes);
    return;
  }
  
  token = loginRes.data.access_token;
  console.log('✅ Logged in successfully\n');
  
  // Step 2: Check current audit logs
  console.log('2. Checking current audit logs...');
  const logsRes = await makeRequest('GET', '/admin/audit-logs');
  console.log('Status:', logsRes.status);
  console.log('Response:', JSON.stringify(logsRes.data, null, 2).substring(0, 500));
  console.log('');
  
  // Step 3: Perform an action that should be audited (PUT request)
  console.log('3. Performing an admin action (updating worker availability)...');
  
  // First get workers to find an ID
  const workersRes = await makeRequest('GET', '/admin/workers');
  if (workersRes.status === 200 && workersRes.data.data && workersRes.data.data.length > 0) {
    const workerId = workersRes.data.data[0].id;
    console.log(`   Updating worker ${workerId}...`);
    
    const updateRes = await makeRequest('PATCH', `/admin/workers/${workerId}/availability`, {
      isAvailable: true
    });
    console.log('   Update status:', updateRes.status);
    console.log('   Update response:', JSON.stringify(updateRes.data).substring(0, 200));
  } else {
    console.log('   No workers found to update');
  }
  console.log('');
  
  // Wait a bit for the audit to be saved
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Check audit logs again
  console.log('4. Checking audit logs after action...');
  const logsRes2 = await makeRequest('GET', '/admin/audit-logs');
  console.log('Status:', logsRes2.status);
  console.log('Total logs:', logsRes2.data.total || 0);
  if (logsRes2.data.data && logsRes2.data.data.length > 0) {
    console.log('Recent logs:');
    logsRes2.data.data.slice(0, 3).forEach(log => {
      console.log(`   - ${log.action} on ${log.entityType} by ${log.adminEmail} at ${log.createdAt}`);
    });
  } else {
    console.log('   No audit logs found!');
  }
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
