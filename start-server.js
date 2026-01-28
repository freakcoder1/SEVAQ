const { spawn } = require('child_process');

console.log('=== Starting NestJS server ===');
console.log('Directory:', __dirname);

// Start the NestJS server
const server = spawn('npm', ['run', 'start:dev'], {
    cwd: 'c:/Users/user/Desktop/newsevaq/flutter-nest-househelp-master',
    stdio: 'pipe',
    shell: true
});

let output = '';

server.stdout.on('data', (data) => {
    output += data.toString();
    process.stdout.write(data);
});

server.stderr.on('data', (data) => {
    output += data.toString();
    process.stderr.write(data);
});

server.on('close', (code) => {
    console.log(`\n=== Server process exited with code ${code} ===`);
});

// Wait for server to start and check for errors
setTimeout(() => {
    console.log('\n=== Server startup log ===');
    console.log(output);
    
    // Check if server started successfully
    if (!output.includes('Application is listening')) {
        console.log('\n❌ Server failed to start');
        
        // Kill process
        server.kill('SIGTERM');
    }
}, 10000);
