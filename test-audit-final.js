const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
      req.write(data);
    }
    req.end();
  });
}

async function main() {
  console.log('=== Testing Audit Logs ===\n');
  
  // Step 1: Login
  console.log('1. Logging in...');
  const loginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify({email: 'admin@sevaq.com', password: 'Admin@123456'}).length
    }
  }, JSON.stringify({email: 'admin@sevaq.com', password: 'Admin@123456'}));
  
  if (!loginRes.data || !loginRes.data.access_token) {
    console.error('Login failed:', loginRes.data);
    return;
  }
  
  const token = loginRes.data.access_token;
  console.log('✅ Got token\n');
  
  // Step 2: Get workers
  console.log('2. Getting workers...');
  const workersRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/workers',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!workersRes.data || !workersRes.data.data || workersRes.data.data.length === 0) {
    console.log('No workers found');
    return;
  }
  
  const workerId = workersRes.data.data[0].id;
  console.log(`✅ Found worker ID: ${workerId}\n`);
  
  // Step 3: Update worker availability (this should trigger audit)
  console.log('3. Updating worker availability...');
  const updateRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/admin/workers/${workerId}/availability`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': JSON.stringify({isAvailable: true}).length
    }
  }, JSON.stringify({isAvailable: true}));
  
  console.log('Update status:', updateRes.status);
  
  // Wait a bit for audit to be saved
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Check audit logs
  console.log('\n4. Checking audit logs...');
  const logsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/audit-logs',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Audit logs status:', logsRes.status);
  console.log('Total logs:', logsRes.data?.total || 0);
  
  if (logsRes.data?.data && logsRes.data.data.length > 0) {
    console.log('\n✅ Audit logging is working!');
    console.log('Recent logs:');
    logsRes.data.data.slice(0, 3).forEach(log => {
      console.log(`  - ${log.action} on ${log.entityType} by ${log.adminEmail}`);
    });
  } else {
    console.log('\n❌ No audit logs found!');
    console.log('Response:', JSON.stringify(logsRes.data).substring(0, 500));
  }
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
