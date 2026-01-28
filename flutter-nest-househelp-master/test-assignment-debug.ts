import { createConnection } from 'typeorm';
import { Worker } from './src/workers/entities/worker.entity';
import { Service } from './src/services/entities/service.entity';
import { Slot } from './src/slots/entities/slot.entity';

async function debugAssignment() {
  try {
    // Connect to database
    const connection = await createConnection();
    console.log('🔍 Database connected successfully');

    // Get repositories
    const workerRepo = connection.getRepository(Worker);
    const serviceRepo = connection.getRepository(Service);
    const slotRepo = connection.getRepository(Slot);

    // 1. Check available workers
    console.log('\n👷 Checking available workers...');
    const availableWorkers = await workerRepo.find({
      where: { isActive: true, isAvailable: true },
      relations: ['services']
    });
    console.log(`Found ${availableWorkers.length} available workers`);

    // 2. Check workers with specific service
    const serviceId = '7f8e4b5c-a883-4c6c-b348-f966508fd49d'; // From logs
    console.log(`\n🔍 Checking workers for service ${serviceId}...`);
    const workersForService = await workerRepo.find({
      where: { services: { id: parseInt(serviceId) }, isActive: true, isAvailable: true },
      relations: ['services']
    });
    console.log(`Found ${workersForService.length} workers for this service`);

    // 3. Check slots for these workers
    for (const worker of workersForService) {
      console.log(`\n📅 Checking slots for worker ${worker.id}...`);
      const slots = await slotRepo.find({
        where: { worker: { id: worker.id }, isBooked: false }
      });
      console.log(`Worker ${worker.id} has ${slots.length} available slots`);
      
      if (slots.length > 0) {
        console.log('Slot details:');
        slots.forEach(slot => {
          console.log(`  - Slot ${slot.id}: ${slot.startTime} to ${slot.endTime}`);
        });
      }
    }

    // 4. Check service details
    console.log('\n📋 Checking service details...');
    const service = await serviceRepo.findOne({
      where: { id: parseInt(serviceId) },
      relations: ['workers']
    });
    console.log('Service:', service?.name);
    console.log('Workers associated with service:', service?.workers?.length || 0);

    await connection.close();
  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugAssignment();
