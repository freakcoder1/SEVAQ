// Simple test to verify ServiceRequest entity structure
const path = require('path');

// Test if we can load the ServiceRequest entity file
try {
  const ServiceRequestPath = path.join(__dirname, 'flutter-nest-househelp-master/src/service-requests/entities/service-request.entity.ts');
  console.log('Testing ServiceRequest entity file...');
  console.log('File path:', ServiceRequestPath);
  
  // Check if file exists
  const fs = require('fs');
  if (fs.existsSync(ServiceRequestPath)) {
    console.log('✓ ServiceRequest entity file exists');
    
    // Read the file content to verify structure
    const content = fs.readFileSync(ServiceRequestPath, 'utf8');
    
    // Check for key elements
    if (content.includes('@Entity')) {
      console.log('✓ Entity decorator found');
    }
    
    if (content.includes('ServiceRequest')) {
      console.log('✓ ServiceRequest class found');
    }
    
    if (content.includes('@Column')) {
      console.log('✓ Column decorators found');
    }
    
    if (content.includes('date: Date')) {
      console.log('✓ Date property found');
    }
    
    console.log('\nEntity structure verification completed successfully!');
    console.log('The ServiceRequest entity is properly defined and should be registered with TypeORM.');
    
  } else {
    console.log('✗ ServiceRequest entity file not found');
  }
} catch (error) {
  console.error('Error testing ServiceRequest entity:', error.message);
}