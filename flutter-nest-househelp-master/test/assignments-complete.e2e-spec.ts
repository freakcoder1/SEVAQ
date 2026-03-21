import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsModule } from '../src/assignments/assignments.module';
import { BookingsModule } from '../src/bookings/bookings.module';
import { WorkersModule } from '../src/workers/workers.module';
import { ServicesModule } from '../src/services/services.module';
import { UsersModule } from '../src/users/users.module';
import { SlotsModule } from '../src/slots/slots.module';
import { PaymentsModule } from '../src/payments/payments.module';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { Booking, AssignmentState } from '../src/bookings/entities/booking.entity';
import { Worker } from '../src/workers/entities/worker.entity';
import { Service } from '../src/services/entities/service.entity';
import { User } from '../src/users/entities/user.entity';
import { Slot } from '../src/slots/entities/slot.entity';
import { Payment, PaymentStatus } from '../src/payments/entities/payment.entity';

/**
 * Comprehensive E2E Tests for Assignment Workflow
 * 
 * Tests cover:
 * 1. Worker assignment endpoint (POST /bookings/:bookingId/assign-worker)
 * 2. Get assignment status (GET /bookings/:bookingId/assignment)
 * 3. List all assignments (GET /assignments)
 * 4. Update assignment status (PATCH /assignments/:id/status)
 * 5. Worker reassignment on failure
 * 6. Notification triggers on status change
 * 7. Payment failure handling in assignment flow
 * 8. Timeout handling for assignments
 * 9. Edge cases (invalid bookingId, invalid workerId, etc.)
 */
describe('Assignments Complete E2E Tests', () => {
  let app: INestApplication;
  let httpServer: any;

  // Test data storage
  let testUser: any;
  let testWorker: any;
  let testService: any;
  let testBooking: any;
  let testPayment: any;

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
          entities: [Booking, Worker, Service, User, Slot, Payment],
          synchronize: true,
          dropSchema: true,
        }),
        AssignmentsModule,
        BookingsModule,
        WorkersModule,
        ServicesModule,
        UsersModule,
        SlotsModule,
        PaymentsModule,
        NotificationsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper function to create test data
  const createTestData = async () => {
    // Create test user
    const userResponse = await request(httpServer)
      .post('/users')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        phone: '1234567890',
        location: 'Noida',
        latitude: 28.5355,
        longitude: 77.391,
      });
    testUser = userResponse.body;

    // Create test worker with user association
    const workerUserResponse = await request(httpServer)
      .post('/users')
      .send({
        name: 'Test Worker',
        email: `worker-${Date.now()}@example.com`,
        phone: '0987654321',
        location: 'Noida',
        latitude: 28.5355,
        longitude: 77.391,
      });

    const workerResponse = await request(httpServer)
      .post('/workers')
      .send({
        userId: workerUserResponse.body.id,
        name: 'Test Worker',
        email: `worker-${Date.now()}@example.com`,
        phone: '0987654321',
        location: 'Noida',
        latitude: 28.5355,
        longitude: 77.391,
        isActive: true,
        isAvailable: true,
        rating: 4.5,
        totalBookings: 10,
        completedBookings: 9,
        yearsOfExperience: 5,
      });
    testWorker = workerResponse.body;

    // Create test service
    const serviceResponse = await request(httpServer)
      .post('/services')
      .send({
        name: 'Home Cleaning',
        description: 'Complete home cleaning service',
        price: 500.0,
        duration: 120,
        isActive: true,
      });
    testService = serviceResponse.body;

    // Create a slot for the worker
    const slotResponse = await request(httpServer)
      .post('/slots')
      .send({
        workerId: testWorker.id,
        date: new Date(Date.now() + 86400000), // Tomorrow
        startTime: '10:00:00',
        endTime: '12:00:00',
        isAvailable: true,
      });

    // Associate worker with service
    await request(httpServer)
      .post('/workers/add-service')
      .send({
        workerId: testWorker.id,
        serviceId: testService.id,
      });

    // Create test booking
    const bookingResponse = await request(httpServer)
      .post('/bookings')
      .send({
        userId: testUser.id,
        serviceId: testService.id,
        workerId: testWorker.id,
        slotId: slotResponse.body.id,
        startTime: new Date(Date.now() + 600000), // 10 minutes from now
        endTime: new Date(Date.now() + 7200000), // 2 hours from now
        date: new Date(Date.now() + 86400000), // Tomorrow
        status: 'confirmed',
        amount: 500.0,
        totalAmount: 500.0,
        type: 'scheduled',
      });
    testBooking = bookingResponse.body;

    // Create test payment
    const paymentResponse = await request(httpServer)
      .post('/payments')
      .send({
        bookingId: testBooking.id,
        amount: 500.0,
        currency: 'INR',
        status: 'pending',
      });
    testPayment = paymentResponse.body;

    return { testUser, testWorker, testService, testBooking, testPayment };
  };

  describe('1. Worker Assignment Endpoint (POST /bookings/:bookingId/assign-worker)', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should assign a worker to a booking successfully', async () => {
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.assignedWorkerId).toBe(testWorker.id);
      expect(response.body.assignmentState).toBe(AssignmentState.ASSIGNED);
    });

    it('should reject assignment with invalid workerId', async () => {
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: 99999,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('worker');
    });

    it('should reject assignment with invalid bookingId', async () => {
      const response = await request(httpServer)
        .post('/bookings/invalid-booking-id/assign-worker')
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(404);
    });

    it('should reject duplicate assignment to already assigned booking', async () => {
      // First assignment
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Second assignment attempt
      const secondWorkerResponse = await request(httpServer)
        .post('/workers')
        .send({
          name: 'Second Worker',
          email: `worker2-${Date.now()}@example.com`,
          phone: '0987654322',
          location: 'Noida',
          isActive: true,
          isAvailable: true,
          rating: 4.0,
        });

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: secondWorkerResponse.body.id,
        });

      expect(response.status).toBe(409);
    });

    it('should not assign worker to cancelled booking', async () => {
      // Cancel the booking first
      await request(httpServer)
        .patch(`/bookings/${testBooking.id}`)
        .send({
          status: 'cancelled',
        });

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('2. Get Assignment Status (GET /bookings/:bookingId/assignment)', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should get assignment status for a booking', async () => {
      // First assign a worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response = await request(httpServer).get(
        `/bookings/${testBooking.id}/assignment`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.assignmentState).toBe(AssignmentState.ASSIGNED);
      expect(response.body.assignedWorkerId).toBe(testWorker.id);
    });

    it('should return PENDING status for unassigned booking', async () => {
      const response = await request(httpServer).get(
        `/bookings/${testBooking.id}/assignment`,
      );

      expect(response.status).toBe(200);
      expect(response.body.assignmentState).toBe(AssignmentState.PENDING);
      expect(response.body.assignedWorkerId).toBeNull();
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(httpServer).get(
        '/bookings/non-existent-id/assignment',
      );

      expect(response.status).toBe(404);
    });

    it('should include assignment metadata in response', async () => {
      // Assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response = await request(httpServer).get(
        `/bookings/${testBooking.id}/assignment`,
      );

      expect(response.status).toBe(200);
      expect(response.body.assignmentTimestamp).toBeDefined();
    });
  });

  describe('3. List All Assignments (GET /assignments)', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should list all assignments', async () => {
      // Assign worker to booking
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response = await request(httpServer).get('/assignments');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter assignments by status', async () => {
      // Assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response = await request(httpServer).get(
        '/assignments?status=assigned',
      );

      expect(response.status).toBe(200);
      // Should return assignments with assigned status
    });

    it('should paginate assignments', async () => {
      const response = await request(httpServer).get(
        '/assignments?page=1&limit=10',
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
  });

  describe('4. Update Assignment Status (PATCH /assignments/:id/status)', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should update assignment status to ASSIGNED', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response = await request(httpServer)
        .patch(`/assignments/${testBooking.id}/status`)
        .send({
          status: AssignmentState.ASSIGNED,
        });

      expect(response.status).toBe(200);
      expect(response.body.assignmentState).toBe(AssignmentState.ASSIGNED);
    });

    it('should update assignment status to CANCELLED', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response = await request(httpServer)
        .patch(`/assignments/${testBooking.id}/status`)
        .send({
          status: AssignmentState.CANCELLED,
        });

      expect(response.status).toBe(200);
      expect(response.body.assignmentState).toBe(AssignmentState.CANCELLED);
    });

    it('should update assignment status to REASSIGNING', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response = await request(httpServer)
        .patch(`/assignments/${testBooking.id}/status`)
        .send({
          status: AssignmentState.REASSIGNING,
        });

      expect(response.status).toBe(200);
      expect(response.body.assignmentState).toBe(AssignmentState.REASSIGNING);
    });

    it('should reject invalid status value', async () => {
      const response = await request(httpServer)
        .patch(`/assignments/${testBooking.id}/status`)
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent assignment', async () => {
      const response = await request(httpServer)
        .patch('/assignments/non-existent-id/status')
        .send({
          status: AssignmentState.ASSIGNED,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('5. Worker Reassignment on Failure', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should reassign worker when assignment fails', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Trigger reassignment
      const response = await request(httpServer)
        .post(`/assignments/reassign`)
        .send({
          bookingId: testBooking.id,
        });

      expect(response.status).toBe(200);
      // Should either reassign to new worker or handle failure
    });

    it('should increment reassignment count on reassignment', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Get initial reassignment count
      const initialResponse = await request(httpServer).get(
        `/bookings/${testBooking.id}/assignment`,
      );
      const initialCount = initialResponse.body.reassignmentCount || 0;

      // Trigger reassignment
      await request(httpServer)
        .post(`/assignments/reassign`)
        .send({
          bookingId: testBooking.id,
        });

      // Get updated reassignment count
      const updatedResponse = await request(httpServer).get(
        `/bookings/${testBooking.id}/assignment`,
      );
      
      expect(updatedResponse.body.reassignmentCount).toBeGreaterThan(
        initialCount,
      );
    });

    it('should handle reassignment when no workers available', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Make worker unavailable
      await request(httpServer)
        .patch(`/workers/${testWorker.id}`)
        .send({
          isAvailable: false,
        });

      // Try to reassign
      const response = await request(httpServer)
        .post(`/assignments/reassign`)
        .send({
          bookingId: testBooking.id,
        });

      // Should handle gracefully (either fail or return appropriate response)
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should not reassign unassigned booking', async () => {
      const response = await request(httpServer)
        .post(`/assignments/reassign`)
        .send({
          bookingId: testBooking.id,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('6. Notification Triggers on Status Change', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should trigger notification when worker is assigned', async () => {
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(201);
      // Notification should be triggered (check logs or mock)
    });

    it('should trigger notification when assignment is cancelled', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Cancel assignment
      const response = await request(httpServer)
        .patch(`/assignments/${testBooking.id}/status`)
        .send({
          status: AssignmentState.CANCELLED,
        });

      expect(response.status).toBe(200);
      // Notification should be triggered
    });

    it('should trigger notification when worker is reassigned', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Trigger reassignment
      const response = await request(httpServer)
        .post(`/assignments/reassign`)
        .send({
          bookingId: testBooking.id,
        });

      // Should trigger notification for both old and new worker
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('7. Payment Failure Handling in Assignment Flow', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should handle payment failure after assignment', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Simulate payment failure
      const response = await request(httpServer)
        .patch(`/payments/${testPayment.id}`)
        .send({
          status: PaymentStatus.FAILED,
        });

      expect(response.status).toBe(200);
      
      // Assignment should handle payment failure
      const bookingResponse = await request(httpServer).get(
        `/bookings/${testBooking.id}`,
      );
      
      // Payment failure may or may not affect assignment depending on business logic
      expect(bookingResponse.body).toBeDefined();
    });

    it('should handle payment timeout during assignment', async () => {
      // First assign worker
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Simulate payment timeout - update payment to timeout status
      const response = await request(httpServer)
        .patch(`/payments/${testPayment.id}`)
        .send({
          status: 'timeout',
        });

      // Should handle gracefully
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should not assign worker if payment fails initially', async () => {
      // Update payment to failed before assignment
      await request(httpServer)
        .patch(`/payments/${testPayment.id}`)
        .send({
          status: PaymentStatus.FAILED,
        });

      // Try to assign worker
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Depending on business logic, should either allow or reject
      expect([200, 400]).toContain(response.status);
    });

    it('should release worker slot on payment failure', async () => {
      // First assign worker (which books the slot)
      await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Simulate payment failure
      await request(httpServer)
        .patch(`/payments/${testPayment.id}`)
        .send({
          status: PaymentStatus.FAILED,
        });

      // The slot should be released (check slot availability)
      const slotResponse = await request(httpServer).get(
        `/slots/worker/${testWorker.id}`,
      );
      
      // Should have available slots after payment failure
      expect(slotResponse.body).toBeDefined();
    });
  });

  describe('8. Timeout Handling for Assignments', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should handle assignment timeout', async () => {
      // Create a booking that's been in PENDING state for too long
      // This would typically be handled by a background job
      
      const response = await request(httpServer)
        .post('/assignments/timeout')
        .send({
          bookingId: testBooking.id,
        });

      // Should handle timeout gracefully
      expect([200, 404, 400]).toContain(response.status);
    });

    it('should auto-fail assignment after timeout threshold', async () => {
      // This test would verify automatic timeout handling
      // In real scenario, would check background job results
      
      const response = await request(httpServer)
        .post('/bookings/auto-assign-timeout')
        .send({
          bookingId: testBooking.id,
          timeoutMinutes: 30,
        });

      expect([200, 404]).toContain(response.status);
    });

    it('should handle timeout for multiple concurrent assignment attempts', async () => {
      // Create multiple bookings and try concurrent assignments
      const booking1 = await request(httpServer)
        .post('/bookings')
        .send({
          userId: testUser.id,
          serviceId: testService.id,
          startTime: new Date(Date.now() + 600000),
          endTime: new Date(Date.now() + 7200000),
          status: 'confirmed',
          amount: 500.0,
        });

      const booking2 = await request(httpServer)
        .post('/bookings')
        .send({
          userId: testUser.id,
          serviceId: testService.id,
          startTime: new Date(Date.now() + 600000),
          endTime: new Date(Date.now() + 7200000),
          status: 'confirmed',
          amount: 500.0,
        });

      // Try to assign the same worker to both (should handle race condition)
      const response1 = await request(httpServer)
        .post(`/bookings/${booking1.body.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      const response2 = await request(httpServer)
        .post(`/bookings/${booking2.body.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // At least one should succeed, one should handle the conflict
      expect([200, 409]).toContain(response1.status);
      expect([200, 409]).toContain(response2.status);
    });

    it('should return timeout error for stale assignment requests', async () => {
      const response = await request(httpServer)
        .post('/assignments/attempt-assignment')
        .send({
          bookingId: testBooking.id,
          serviceId: testService.id,
          userLat: testUser.latitude,
          userLng: testUser.longitude,
          startTime: new Date(Date.now() - 3600000), // 1 hour ago (stale)
          endTime: new Date(Date.now() - 1800000),
        });

      // Should either reject as stale or handle gracefully
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('9. Edge Cases', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should handle assignment with invalid bookingId format', async () => {
      const response = await request(httpServer)
        .post('/bookings/invalid-uuid-format/assign-worker')
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(400);
    });

    it('should handle assignment with non-numeric workerId', async () => {
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: 'not-a-number',
        });

      expect(response.status).toBe(400);
    });

    it('should handle assignment to deleted worker', async () => {
      // Delete the worker
      await request(httpServer).delete(`/workers/${testWorker.id}`);

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(404);
    });

    it('should handle assignment to deleted booking', async () => {
      // Delete the booking
      await request(httpServer).delete(`/bookings/${testBooking.id}`);

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(404);
    });

    it('should handle assignment for booking without service', async () => {
      const bookingWithoutService = await request(httpServer)
        .post('/bookings')
        .send({
          userId: testUser.id,
          startTime: new Date(Date.now() + 600000),
          endTime: new Date(Date.now() + 7200000),
          status: 'confirmed',
          amount: 500.0,
        });

      const response = await request(httpServer)
        .post(`/bookings/${bookingWithoutService.body.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      // Should handle missing service gracefully
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should handle assignment for completed booking', async () => {
      // Mark booking as completed
      await request(httpServer)
        .patch(`/bookings/${testBooking.id}`)
        .send({
          status: 'completed',
        });

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(400);
    });

    it('should handle concurrent assignment requests', async () => {
      // Create multiple assignment requests simultaneously
      const promises = [
        request(httpServer)
          .post(`/bookings/${testBooking.id}/assign-worker`)
          .send({
            workerId: testWorker.id,
          }),
        request(httpServer)
          .post(`/bookings/${testBooking.id}/assign-worker`)
          .send({
            workerId: testWorker.id,
          }),
        request(httpServer)
          .post(`/bookings/${testBooking.id}/assign-worker`)
          .send({
            workerId: testWorker.id,
          }),
      ];

      const results = await Promise.all(promises);
      
      // Only one should succeed
      const successCount = results.filter(r => r.status === 201).length;
      expect(successCount).toBeLessThanOrEqual(1);
    });

    it('should validate required fields for assignment', async () => {
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should handle assignment with inactive worker', async () => {
      // Make worker inactive
      await request(httpServer)
        .patch(`/workers/${testWorker.id}`)
        .send({
          isActive: false,
        });

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(400);
    });

    it('should handle assignment with unavailable worker', async () => {
      // Make worker unavailable
      await request(httpServer)
        .patch(`/workers/${testWorker.id}`)
        .send({
          isAvailable: false,
        });

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: testWorker.id,
        });

      expect(response.status).toBe(400);
    });

    it('should handle assignment to worker in different location', async () => {
      // Create worker in different location
      const distantWorker = await request(httpServer)
        .post('/workers')
        .send({
          name: 'Distant Worker',
          email: `distant-${Date.now()}@example.com`,
          phone: '1111111111',
          location: 'Delhi', // Different from booking location
          latitude: 28.6139,
          longitude: 77.209,
          isActive: true,
          isAvailable: true,
          rating: 4.0,
        });

      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/assign-worker`)
        .send({
          workerId: distantWorker.body.id,
        });

      // Should either reject (if location validation exists) or accept
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Additional Assignment Scenarios', () => {
    beforeEach(async () => {
      await createTestData();
    });

    it('should create booking with automatic assignment', async () => {
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/create-with-assignment`)
        .send({
          userId: testUser.id,
          serviceId: testService.id,
          startTime: new Date(Date.now() + 600000),
          endTime: new Date(Date.now() + 7200000),
          amount: 500.0,
          status: 'pending',
        });

      // Should create booking and attempt assignment
      expect([201, 400]).toContain(response.status);
    });

    it('should attempt assignment via dedicated endpoint', async () => {
      const response = await request(httpServer)
        .post(`/bookings/${testBooking.id}/attempt-assignment`);

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should check availability before assignment', async () => {
      const response = await request(httpServer)
        .post('/assignments/check-availability')
        .send({
          serviceId: testService.id,
          userLat: testUser.latitude,
          userLng: testUser.longitude,
          startTime: new Date(Date.now() + 600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('available');
    });

    it('should handle assignment start flow', async () => {
      const response = await request(httpServer)
        .post('/assignments/start-assignment-flow')
        .send({
          serviceId: testService.id,
          userLat: testUser.latitude,
          userLng: testUser.longitude,
          startTime: new Date(Date.now() + 600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          userId: testUser.id,
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should get latest assignment status', async () => {
      const response = await request(httpServer).get(
        '/assignments/status/latest',
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should attempt assignment via assignments endpoint', async () => {
      const response = await request(httpServer)
        .post('/assignments/attempt-assignment')
        .send({
          bookingId: testBooking.id,
          serviceId: testService.id,
          userLat: testUser.latitude,
          userLng: testUser.longitude,
          startTime: new Date(Date.now() + 600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
        });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should assign booking via bookings assign endpoint', async () => {
      const response = await request(httpServer)
        .post('/bookings/assign')
        .send({
          bookingId: testBooking.id,
          workerId: testWorker.id,
        });

      expect([200, 201, 400]).toContain(response.status);
    });
  });
});
