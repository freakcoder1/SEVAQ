const axios = require('axios');
const http = require('http');

async function testConnections() {
    console.log('=== Testing server connectivity ===');
    
    // Test localhost:3000
    try {
        console.log('1. Testing http://localhost:3000/');
        const response = await axios.get('http://localhost:3000/');
        console.log('✅ Success - Status:', response.status);
        console.log('   Data:', response.data);
    } catch (error) {
        console.log('❌ Error connecting to localhost:3000');
        console.log('   Message:', error.message);
    }
    
    // Test 127.0.0.1:3000
    try {
        console.log('\n2. Testing http://127.0.0.1:3000/');
        const response = await axios.get('http://127.0.0.1:3000/');
        console.log('✅ Success - Status:', response.status);
        console.log('   Data:', response.data);
    } catch (error) {
        console.log('❌ Error connecting to 127.0.0.1:3000');
        console.log('   Message:', error.message);
    }
    
    // Check what ports are actually open
    console.log('\n3. Checking active connections on port 3000');
    try {
        // Attempt to connect directly to port 3000
        const socket = new http.ClientRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
        });
        
        socket.on('response', (res) => {
            console.log('✅ Server is listening on port 3000');
        });
        
        socket.on('error', (err) => {
            console.log('❌ No server responding on port 3000');
            console.log('   Error:', err.message);
        });
        
        socket.end();
    } catch (error) {
        console.log('❌ Error checking port 3000');
        console.log('   Error:', error.message);
    }
}

testConnections();
