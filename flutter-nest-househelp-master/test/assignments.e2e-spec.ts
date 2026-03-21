import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AssignmentsModule } from '../src/assignments/assignments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BookingsModule } from '../src/bookings/bookings.module';
import { WorkersModule } from '../src/workers/workers.module';
import { ServicesModule } from '../src/services/services.module';
import { UsersModule } from '../src/users/users.module';
import { SlotsModule } from '../src/slots/slots.module';
import { Booking } from '../src/bookings/entities/booking.entity';
import { Worker } from '../src/workers/entities/worker.entity';
import { Service } from '../src/services/entities/service.entity';
import { User } from '../src/users/entities/user.entity';
import { Slot } from '../src/slots/entities/slot.entity';

describe('Assignments E2E Tests', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'test_user',
          password: 'test_password',
          database: 'test_db',
          entities: [Booking, Worker, Service, User, Slot],
          synchronize: true,
          dropSchema: true,
        }),
        AssignmentsModule,
        BookingsModule,
        WorkersModule,
        ServicesModule,
        UsersModule,
        SlotsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Assignment Flow Integration Tests', () => {
    let testUser: any;
    let testWorker: any;
    let testService: any;
    let testBooking: any;

    beforeEach(async () => {
      // Create test user
      const userResponse = await request(httpServer).post('/users').send({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        location: 'Noida',
        latitude: 28.5355,
        longitude: 77.391,
      });

      testUser = userResponse.body;

      // Create test worker
      const workerResponse = await request(httpServer).post('/workers').send({
        name: 'Test Worker',
        email: 'worker@example.com',
        phone: '0987654321',
        location: 'Noida',
        isActive: true,
        isAvailable: true,
        rating: 4.5,
        totalBookings: 10,
        completedBookings: 9,
        yearsOfExperience: 5,
      });

      testWorker = workerResponse.body;

      // Create test service
      const serviceResponse = await request(httpServer).post('/services').send({
        name: 'Home Cleaning',
        description: 'Complete home cleaning service',
        price: 500.0,
        duration: 120,
        isActive: true,
      });

      testService = serviceResponse.body;

      // Create test booking
      const bookingResponse = await request(httpServer)
        .post('/bookings')
        .send({
          userId: testUser.id,
          serviceId: testService.id,
          slotId: 'slot1',
          startTime: new Date(Date.now() + 600000), // 10 minutes from now
          endTime: new Date(Date.now() + 7200000), // 20 minutes from now
          status: 'confirmed',
          amount: 500.0,
        });

      testBooking = bookingResponse.body;
    });

    it('should create a booking with PENDING assignment state', async () => {
      expect(testBooking.assignmentState).toBe('PENDING');
      expect(testBooking.assignedWorkerId).toBeNull();
    });

    it('should assign a professional to a booking', async () => {
      const response = await request(httpServer)
        .post('/assignments/assign')
        .send({
          bookingId: testBooking.id,
          serviceId: testService.id,
          userLat: testUser.latitude,
          userLng: testUser.longitude,
          startTime: testBooking.startTime,
          endTime: testBooking.endTime,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.worker).toBeDefined();
      expect(response.body.worker.id).toBe(testWorker.id);
    });

    it('should get assignment status', async () => {
      // First assign a professional
      await request(httpServer).post('/assignments/assign').send({
        bookingId: testBooking.id,
        serviceId: testService.id,
        userLat: testUser.latitude,
        userLng: testUser.longitude,
        startTime: testBooking.startTime,
        endTime: testBooking.endTime,
      });

      const response = await request(httpServer).get(
        `/assignments/status/${testBooking.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.assignmentState).toBe('ASSIGNED');
      expect(response.body.assignedWorkerId).toBeDefined();
    });

    it('should handle assignment failure', async () => {
      // Try to assign to a non-existent booking
      const response = await request(httpServer)
        .post('/assignments/failure/test-id')
        .send({
          reason: 'Worker not available',
        });

      expect(response.status).toBe(404);
    });

    it('should handle assignment timeout', async () => {
      // Try to handle timeout for a non-existent booking
      const response = await request(httpServer).post(
        '/assignments/timeout/test-id',
      );

      expect(response.status).toBe(404);
    });

    it('should get assignment analytics', async () => {
      const response = await request(httpServer).get('/assignments/analytics');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(typeof response.body.totalAssignments).toBe('number');
      expect(typeof response.body.successfulAssignments).toBe('number');
      expect(typeof response.body.failedAssignments).toBe('number');
      expect(typeof response.body.successRate).toBe('number');
    });

    it('should reassign a professional', async () => {
      // First assign a professional
      await request(httpServer).post('/assignments/assign').send({
        bookingId: testBooking.id,
        serviceId: testService.id,
        userLat: testUser.latitude,
        userLng: testUser.longitude,
        startTime: testBooking.startTime,
        endTime: testBooking.endTime,
      });

      // Then reassign
      const response = await request(httpServer).post(
        `/assignments/reassign/${testBooking.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow duplicate assignment', async () => {
      // First assign a professional
      await request(httpServer).post('/assignments/assign').send({
        bookingId: testBooking.id,
        serviceId: testService.id,
        userLat: testUser.latitude,
        userLng: testUser.longitude,
        startTime: testBooking.startTime,
        endTime: testBooking.endTime,
      });

      // Try to assign again
      const response = await request(httpServer)
        .post('/assignments/assign')
        .send({
          bookingId: testBooking.id,
          serviceId: testService.id,
          userLat: testUser.latitude,
          userLng: testUser.longitude,
          startTime: testBooking.startTime,
          endTime: testBooking.endTime,
        });

      expect(response.status).toBe(409);
    });

    it('should handle invalid booking state for assignment', async () => {
      // Update booking to a non-pending state
      await request(httpServer).patch(`/bookings/${testBooking.id}`).send({
        assignmentState: 'ASSIGNED',
      });

      const response = await request(httpServer)
        .post('/assignments/assign')
        .send({
          bookingId: testBooking.id,
          serviceId: testService.id,
          userLat: testUser.latitude,
          userLng: testUser.longitude,
          startTime: testBooking.startTime,
          endTime: testBooking.endTime,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Assignment Edge Cases', () => {
    it('should handle assignment with no available workers', async () => {
      // Create a booking without any workers
      const userResponse = await request(httpServer).post('/users').send({
        name: 'Test User 2',
        email: 'test2@example.com',
        phone: '1234567891',
        location: 'Noida',
        latitude: 28.5355,
        longitude: 77.391,
      });

      const serviceResponse = await request(httpServer).post('/services').send({
        name: 'Deep Cleaning',
        description: 'Deep cleaning service',
        price: 800.0,
        duration: 180,
        isActive: true,
      });

      const bookingResponse = await request(httpServer)
        .post('/bookings')
        .send({
          userId: userResponse.body.id,
          serviceId: serviceResponse.body.id,
          slotId: 'slot2',
          startTime: new Date(Date.now() + 600000),
          endTime: new Date(Date.now() + 7200000),
          status: 'confirmed',
          amount: 800.0,
        });

      const response = await request(httpServer)
        .post('/assignments/assign')
        .send({
          bookingId: bookingResponse.body.id,
          serviceId: serviceResponse.body.id,
          userLat: userResponse.body.latitude,
          userLng: userResponse.body.longitude,
          startTime: bookingResponse.body.startTime,
          endTime: bookingResponse.body.endTime,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(false);
      expect(response.body.reason).toBe('No professional available');
    });

    it('should handle assignment with no available slots', async () => {
      // Create a worker and book all their slots
      const userResponse = await request(httpServer).post('/users').send({
        name: 'Test User 3',
        email: 'test3@example.com',
        phone: '1234567892',
        location: 'Noida',
        latitude: 28.5355,
        longitude: 77.391,
      });

      const workerResponse = await request(httpServer).post('/workers').send({
        name: 'Test Worker 2',
        email: 'worker2@example.com',
        phone: '0987654322',
        location: 'Noida',
        isActive: true,
        isAvailable: true,
        rating: 4.0,
        totalBookings: 5,
        completedBookings: 5,
        yearsOfExperience: 3,
      });

      const serviceResponse = await request(httpServer).post('/services').send({
        name: 'Office Cleaning',
        description: 'Office cleaning service',
        price: 600.0,
        duration: 120,
        isActive: true,
      });

      // Create a booking that conflicts with worker availability
      const bookingResponse = await request(httpServer)
        .post('/bookings')
        .send({
          userId: userResponse.body.id,
          serviceId: serviceResponse.body.id,
          slotId: 'slot3',
          startTime: new Date(Date.now() + 600000),
          endTime: new Date(Date.now() + 7200000),
          status: 'confirmed',
          amount: 600.0,
        });

      const response = await request(httpServer)
        .post('/assignments/assign')
        .send({
          bookingId: bookingResponse.body.id,
          serviceId: serviceResponse.body.id,
          userLat: userResponse.body.latitude,
          userLng: userResponse.body.longitude,
          startTime: bookingResponse.body.startTime,
          endTime: bookingResponse.body.endTime,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(false);
      expect(response.body.reason).toBe('No professional available');
    });
  });
});
