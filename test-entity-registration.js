const { TypeOrmModule } = require('@nestjs/typeorm');
const { ServiceRequest } = require('./flutter-nest-househelp-master/src/service-requests/entities/service-request.entity');

console.log('Testing ServiceRequest entity registration...');
console.log('ServiceRequest entity:', ServiceRequest);
console.log('ServiceRequest name:', ServiceRequest.name);
console.log('ServiceRequest columns:', ServiceRequest.prototype);

// Test if the entity can be instantiated
try {
  const instance = new ServiceRequest();
  console.log('ServiceRequest instance created successfully');
  console.log('Instance properties:', Object.getOwnPropertyNames(instance));
} catch (error) {
  console.error('Error creating ServiceRequest instance:', error.message);
}

console.log('Entity registration test completed');