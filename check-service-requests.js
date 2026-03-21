const { createConnection } = require('typeorm');
const { ServiceRequest } = require('./flutter-nest-househelp-master/src/service-requests/entities/service-request.entity');

async function checkServiceRequest() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'househelp',
      entities: [ServiceRequest],
      synchronize: false,
      logging: false
    });

    console.log('✅ Connection established');
    
    const serviceRequestRepo = connection.getRepository(ServiceRequest);
    
    // Check if there are any service requests
    const allRequests = await serviceRequestRepo.find();
    console.log(`✅ Total service requests: ${allRequests.length}`);
    
    if (allRequests.length > 0) {
      console.log('\n✅ First service request details:');
      console.log('  ID:', allRequests[0].id);
      console.log('  Public ID:', allRequests[0].publicId);
      console.log('  Status:', allRequests[0].assignmentStatus);
    }
    
    // Check for specific public IDs from the error logs
    const publicIds = ['4aaba2fd-c81b-4558-9a9e-6280565e9030', 'fda42da2-1aa1-4dcf-a668-e0e7d6fac3a6'];
    
    for (const publicId of publicIds) {
      const request = await serviceRequestRepo.findOne({ where: { publicId } });
      console.log(`\n🔍 Service request with public ID ${publicId}: ${request ? '✅ FOUND' : '❌ NOT FOUND'}`);
      if (request) {
        console.log('  Status:', request.assignmentStatus);
        console.log('  Worker ID:', request.assignedWorkerId);
        console.log('  Slot ID:', request.assignedSlotId);
      }
    }
    
    await connection.close();
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkServiceRequest();
