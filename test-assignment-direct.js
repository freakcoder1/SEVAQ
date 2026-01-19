const { DataSource } = require('typeorm');
const { Worker } = require('./dist/workers/entities/worker.entity');
const { User } = require('./dist/users/entities/user.entity');
const { Service } = require('./dist/services/entities/service.entity');
const { Slot } = require('./dist/slots/entities/slot.entity');
const { Booking } = require('./dist/bookings/entities/booking.entity');
const { SlotService } = require('./dist/slots/slots.service');
const { AvailabilityService } = require('./dist/availability/availability.service');
const { AssignmentsService } = require('./dist/assignments/assignments.service');
const { AppDataSource } = require('./dist/data-source');

async function testAssignment() {
  try {
    await AppDataSource.initialize();
    console.log('=== TESTING ASSIGNMENT SERVICE ===');
    
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
    
    // Test the assignment attempt
    const assignmentRequest = {
      bookingId: '777fac3f-dc1f-40e0-919e-630e192ea1dd',
      serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
      userLat: 28.5805083,
      userLng: 77.4392111,
      startTime: new Date('2026-01-10T08:00:00.000Z'),
      endTime: new Date('2026-01-10T11:00:00.000Z')
    };
    
    console.log('Attempting assignment with request:', assignmentRequest);
    
    const result = await assignmentService.attemptAssignment(assignmentRequest);
    console.log('Assignment result:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAssignment();