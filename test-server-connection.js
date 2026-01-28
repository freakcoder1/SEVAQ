const net = require('net');

const PORT = 45357;
const HOST = 'localhost';

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log(`✅ Connected to server at ${HOST}:${PORT}`);
  client.destroy(); // kill client after server's response
});

client.on('data', (data) => {
  console.log('📦 Server response:', data.toString());
  client.destroy();
});

client.on('error', (error) => {
  console.error(`❌ Connection error: ${error.message}`);
  if (error.code === 'ECONNREFUSED') {
    console.log('\n🔍 Possible causes:');
    console.log('1. Server is not running');
    console.log('2. Server is running on a different port');
    console.log('3. Firewall is blocking the port');
    console.log('4. Address is incorrect');
  }
  client.destroy();
});

client.on('close', () => {
  console.log('🔌 Connection closed');
});

// Set timeout
setTimeout(() => {
  if (client.writable) {
    console.error('❌ Connection timeout');
    client.destroy();
  }
}, 5000);
