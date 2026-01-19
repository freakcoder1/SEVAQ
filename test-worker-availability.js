const { DataSource } = require('typeorm');
const { Worker } = require('./flutter-nest-househelp-master/dist/workers/entities/worker.entity');
const { User } = require('./flutter-nest-househelp-master/dist/users/entities/user.entity');
const { Service } = require('./flutter-nest-househelp-master/dist/services/entities/service.entity');
const { Slot } = require('./flutter-nest-househelp-master/dist/slots/entities/slot.entity');
const { Booking } = require('./flutter-nest-househelp-master/dist/bookings/entities/booking.entity');
const { SlotService } = require('./flutter-nest-househelp-master/dist/slots/slots.service');
const { AvailabilityService } = require('./flutter-nest-househelp-master/dist/availability/availability.service');
const { AssignmentsService } = require('./flutter-nest-househelp-master/dist/assignments/assignments.service');
const { AppDataSource } = require('./flutter-nest-househelp-master/dist/data-source');

async function test() {
  try {
    await AppDataSource.initialize();
    console.log('=== TESTING WORKER AVAILABILITY ===');
    
    const workers = await AppDataSource.getRepository(Worker).find({
      relations: ['user', 'services']
    });
    
    console.log('Total workers:', workers.length);
    workers.forEach((worker, i) => {
      console.log(`Worker ${i+1}: ID=${worker.id}, Rating=${worker.rating}, Services=${worker.services.map(s => s.name).join(', ')}`);
    });
    
    console.log('\n=== TESTING SLOTS ===');
    const slots = await AppDataSource.getRepository(Slot).find({
      relations: ['worker']
    });
    
    console.log('Total slots:', slots.length);
    slots.forEach((slot, i) => {
      console.log(`Slot ${i+1}: ID=${slot.id}, Worker=${slot.workerId}, Status=${slot.status}, Time=${slot.startTime} to ${slot.endTime}`);
    });
    
    console.log('\n=== TESTING ASSIGNMENT SERVICE ===');
    const assignmentService = new AssignmentsService(
      AppDataSource.getRepository(Booking),
      AppDataSource.getRepository(Worker),
      AppDataSource.getRepository(Service),
      AppDataSource.getRepository(User),
      new SlotService(AppDataSource.getRepository(Slot)),
      new AvailabilityService(
        AppDataSource.getRepository(Booking),
        AppDataSource.getRepository(Worker),
        AppDataSource.getRepository(Slot),
        AppDataSource.getRepository(User)
      )
    );
    
    const testResult = await assignmentService.findBestWorker(
      '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
      28.5805083,
      77.4392111,
      new Date('2026-01-10T08:00:00.000Z'),
      new Date('2026-01-10T11:00:00.000Z')
    );
    
    console.log('Best worker result:', testResult ? 'FOUND' : 'NOT FOUND');
    if (testResult) {
      console.log('Worker details:', {
        id: testResult.worker.id,
        rating: testResult.worker.rating,
        distance: testResult.distance
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();