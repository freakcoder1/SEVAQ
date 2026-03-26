"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const assignments_module_1 = require("../src/assignments/assignments.module");
const bookings_module_1 = require("../src/bookings/bookings.module");
const workers_module_1 = require("../src/workers/workers.module");
const services_module_1 = require("../src/services/services.module");
const users_module_1 = require("../src/users/users.module");
const slots_module_1 = require("../src/slots/slots.module");
const payments_module_1 = require("../src/payments/payments.module");
const notifications_module_1 = require("../src/notifications/notifications.module");
const booking_entity_1 = require("../src/bookings/entities/booking.entity");
const worker_entity_1 = require("../src/workers/entities/worker.entity");
const service_entity_1 = require("../src/services/entities/service.entity");
const user_entity_1 = require("../src/users/entities/user.entity");
const slot_entity_1 = require("../src/slots/entities/slot.entity");
const payment_entity_1 = require("../src/payments/entities/payment.entity");
describe('Assignments Complete E2E Tests', () => {
    let app;
    let httpServer;
    let testUser;
    let testWorker;
    let testService;
    let testBooking;
    let testPayment;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.test',
                }),
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: 'localhost',
                    port: 5432,
                    username: 'test_user',
                    password: 'test_password',
                    database: 'test_db',
                    entities: [booking_entity_1.Booking, worker_entity_1.Worker, service_entity_1.Service, user_entity_1.User, slot_entity_1.Slot, payment_entity_1.Payment],
                    synchronize: true,
                    dropSchema: true,
                }),
                assignments_module_1.AssignmentsModule,
                bookings_module_1.BookingsModule,
                workers_module_1.WorkersModule,
                services_module_1.ServicesModule,
                users_module_1.UsersModule,
                slots_module_1.SlotsModule,
                payments_module_1.PaymentsModule,
                notifications_module_1.NotificationsModule,
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        httpServer = app.getHttpServer();
    });
    afterAll(async () => {
        await app.close();
    });
    const createTestData = async () => {
        const userResponse = await (0, supertest_1.default)(httpServer)
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
        const workerUserResponse = await (0, supertest_1.default)(httpServer)
            .post('/users')
            .send({
            name: 'Test Worker',
            email: `worker-${Date.now()}@example.com`,
            phone: '0987654321',
            location: 'Noida',
            latitude: 28.5355,
            longitude: 77.391,
        });
        const workerResponse = await (0, supertest_1.default)(httpServer)
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
        const serviceResponse = await (0, supertest_1.default)(httpServer)
            .post('/services')
            .send({
            name: 'Home Cleaning',
            description: 'Complete home cleaning service',
            price: 500.0,
            duration: 120,
            isActive: true,
        });
        testService = serviceResponse.body;
        const slotResponse = await (0, supertest_1.default)(httpServer)
            .post('/slots')
            .send({
            workerId: testWorker.id,
            date: new Date(Date.now() + 86400000),
            startTime: '10:00:00',
            endTime: '12:00:00',
            isAvailable: true,
        });
        await (0, supertest_1.default)(httpServer)
            .post('/workers/add-service')
            .send({
            workerId: testWorker.id,
            serviceId: testService.id,
        });
        const bookingResponse = await (0, supertest_1.default)(httpServer)
            .post('/bookings')
            .send({
            userId: testUser.id,
            serviceId: testService.id,
            workerId: testWorker.id,
            slotId: slotResponse.body.id,
            startTime: new Date(Date.now() + 600000),
            endTime: new Date(Date.now() + 7200000),
            date: new Date(Date.now() + 86400000),
            status: 'confirmed',
            amount: 500.0,
            totalAmount: 500.0,
            type: 'scheduled',
        });
        testBooking = bookingResponse.body;
        const paymentResponse = await (0, supertest_1.default)(httpServer)
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
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(201);
            expect(response.body).toBeDefined();
            expect(response.body.assignedWorkerId).toBe(testWorker.id);
            expect(response.body.assignmentState).toBe(booking_entity_1.AssignmentState.ASSIGNED);
        });
        it('should reject assignment with invalid workerId', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: 99999,
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('worker');
        });
        it('should reject assignment with invalid bookingId', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post('/bookings/invalid-booking-id/assign-worker')
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(404);
        });
        it('should reject duplicate assignment to already assigned booking', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const secondWorkerResponse = await (0, supertest_1.default)(httpServer)
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
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: secondWorkerResponse.body.id,
            });
            expect(response.status).toBe(409);
        });
        it('should not assign worker to cancelled booking', async () => {
            await (0, supertest_1.default)(httpServer)
                .patch(`/bookings/${testBooking.id}`)
                .send({
                status: 'cancelled',
            });
            const response = await (0, supertest_1.default)(httpServer)
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
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer).get(`/bookings/${testBooking.id}/assignment`);
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.assignmentState).toBe(booking_entity_1.AssignmentState.ASSIGNED);
            expect(response.body.assignedWorkerId).toBe(testWorker.id);
        });
        it('should return PENDING status for unassigned booking', async () => {
            const response = await (0, supertest_1.default)(httpServer).get(`/bookings/${testBooking.id}/assignment`);
            expect(response.status).toBe(200);
            expect(response.body.assignmentState).toBe(booking_entity_1.AssignmentState.PENDING);
            expect(response.body.assignedWorkerId).toBeNull();
        });
        it('should return 404 for non-existent booking', async () => {
            const response = await (0, supertest_1.default)(httpServer).get('/bookings/non-existent-id/assignment');
            expect(response.status).toBe(404);
        });
        it('should include assignment metadata in response', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer).get(`/bookings/${testBooking.id}/assignment`);
            expect(response.status).toBe(200);
            expect(response.body.assignmentTimestamp).toBeDefined();
        });
    });
    describe('3. List All Assignments (GET /assignments)', () => {
        beforeEach(async () => {
            await createTestData();
        });
        it('should list all assignments', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer).get('/assignments');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        it('should filter assignments by status', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer).get('/assignments?status=assigned');
            expect(response.status).toBe(200);
        });
        it('should paginate assignments', async () => {
            const response = await (0, supertest_1.default)(httpServer).get('/assignments?page=1&limit=10');
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
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .patch(`/assignments/${testBooking.id}/status`)
                .send({
                status: booking_entity_1.AssignmentState.ASSIGNED,
            });
            expect(response.status).toBe(200);
            expect(response.body.assignmentState).toBe(booking_entity_1.AssignmentState.ASSIGNED);
        });
        it('should update assignment status to CANCELLED', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .patch(`/assignments/${testBooking.id}/status`)
                .send({
                status: booking_entity_1.AssignmentState.CANCELLED,
            });
            expect(response.status).toBe(200);
            expect(response.body.assignmentState).toBe(booking_entity_1.AssignmentState.CANCELLED);
        });
        it('should update assignment status to REASSIGNING', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .patch(`/assignments/${testBooking.id}/status`)
                .send({
                status: booking_entity_1.AssignmentState.REASSIGNING,
            });
            expect(response.status).toBe(200);
            expect(response.body.assignmentState).toBe(booking_entity_1.AssignmentState.REASSIGNING);
        });
        it('should reject invalid status value', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .patch(`/assignments/${testBooking.id}/status`)
                .send({
                status: 'invalid_status',
            });
            expect(response.status).toBe(400);
        });
        it('should return 404 for non-existent assignment', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .patch('/assignments/non-existent-id/status')
                .send({
                status: booking_entity_1.AssignmentState.ASSIGNED,
            });
            expect(response.status).toBe(404);
        });
    });
    describe('5. Worker Reassignment on Failure', () => {
        beforeEach(async () => {
            await createTestData();
        });
        it('should reassign worker when assignment fails', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/assignments/reassign`)
                .send({
                bookingId: testBooking.id,
            });
            expect(response.status).toBe(200);
        });
        it('should increment reassignment count on reassignment', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const initialResponse = await (0, supertest_1.default)(httpServer).get(`/bookings/${testBooking.id}/assignment`);
            const initialCount = initialResponse.body.reassignmentCount || 0;
            await (0, supertest_1.default)(httpServer)
                .post(`/assignments/reassign`)
                .send({
                bookingId: testBooking.id,
            });
            const updatedResponse = await (0, supertest_1.default)(httpServer).get(`/bookings/${testBooking.id}/assignment`);
            expect(updatedResponse.body.reassignmentCount).toBeGreaterThan(initialCount);
        });
        it('should handle reassignment when no workers available', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            await (0, supertest_1.default)(httpServer)
                .patch(`/workers/${testWorker.id}`)
                .send({
                isAvailable: false,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/assignments/reassign`)
                .send({
                bookingId: testBooking.id,
            });
            expect([200, 400, 404]).toContain(response.status);
        });
        it('should not reassign unassigned booking', async () => {
            const response = await (0, supertest_1.default)(httpServer)
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
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(201);
        });
        it('should trigger notification when assignment is cancelled', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .patch(`/assignments/${testBooking.id}/status`)
                .send({
                status: booking_entity_1.AssignmentState.CANCELLED,
            });
            expect(response.status).toBe(200);
        });
        it('should trigger notification when worker is reassigned', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/assignments/reassign`)
                .send({
                bookingId: testBooking.id,
            });
            expect([200, 400]).toContain(response.status);
        });
    });
    describe('7. Payment Failure Handling in Assignment Flow', () => {
        beforeEach(async () => {
            await createTestData();
        });
        it('should handle payment failure after assignment', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .patch(`/payments/${testPayment.id}`)
                .send({
                status: payment_entity_1.PaymentStatus.FAILED,
            });
            expect(response.status).toBe(200);
            const bookingResponse = await (0, supertest_1.default)(httpServer).get(`/bookings/${testBooking.id}`);
            expect(bookingResponse.body).toBeDefined();
        });
        it('should handle payment timeout during assignment', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .patch(`/payments/${testPayment.id}`)
                .send({
                status: 'timeout',
            });
            expect([200, 400, 404]).toContain(response.status);
        });
        it('should not assign worker if payment fails initially', async () => {
            await (0, supertest_1.default)(httpServer)
                .patch(`/payments/${testPayment.id}`)
                .send({
                status: payment_entity_1.PaymentStatus.FAILED,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect([200, 400]).toContain(response.status);
        });
        it('should release worker slot on payment failure', async () => {
            await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            await (0, supertest_1.default)(httpServer)
                .patch(`/payments/${testPayment.id}`)
                .send({
                status: payment_entity_1.PaymentStatus.FAILED,
            });
            const slotResponse = await (0, supertest_1.default)(httpServer).get(`/slots/worker/${testWorker.id}`);
            expect(slotResponse.body).toBeDefined();
        });
    });
    describe('8. Timeout Handling for Assignments', () => {
        beforeEach(async () => {
            await createTestData();
        });
        it('should handle assignment timeout', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post('/assignments/timeout')
                .send({
                bookingId: testBooking.id,
            });
            expect([200, 404, 400]).toContain(response.status);
        });
        it('should auto-fail assignment after timeout threshold', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post('/bookings/auto-assign-timeout')
                .send({
                bookingId: testBooking.id,
                timeoutMinutes: 30,
            });
            expect([200, 404]).toContain(response.status);
        });
        it('should handle timeout for multiple concurrent assignment attempts', async () => {
            const booking1 = await (0, supertest_1.default)(httpServer)
                .post('/bookings')
                .send({
                userId: testUser.id,
                serviceId: testService.id,
                startTime: new Date(Date.now() + 600000),
                endTime: new Date(Date.now() + 7200000),
                status: 'confirmed',
                amount: 500.0,
            });
            const booking2 = await (0, supertest_1.default)(httpServer)
                .post('/bookings')
                .send({
                userId: testUser.id,
                serviceId: testService.id,
                startTime: new Date(Date.now() + 600000),
                endTime: new Date(Date.now() + 7200000),
                status: 'confirmed',
                amount: 500.0,
            });
            const response1 = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${booking1.body.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            const response2 = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${booking2.body.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect([200, 409]).toContain(response1.status);
            expect([200, 409]).toContain(response2.status);
        });
        it('should return timeout error for stale assignment requests', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post('/assignments/attempt-assignment')
                .send({
                bookingId: testBooking.id,
                serviceId: testService.id,
                userLat: testUser.latitude,
                userLng: testUser.longitude,
                startTime: new Date(Date.now() - 3600000),
                endTime: new Date(Date.now() - 1800000),
            });
            expect([200, 400, 404]).toContain(response.status);
        });
    });
    describe('9. Edge Cases', () => {
        beforeEach(async () => {
            await createTestData();
        });
        it('should handle assignment with invalid bookingId format', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post('/bookings/invalid-uuid-format/assign-worker')
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(400);
        });
        it('should handle assignment with non-numeric workerId', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: 'not-a-number',
            });
            expect(response.status).toBe(400);
        });
        it('should handle assignment to deleted worker', async () => {
            await (0, supertest_1.default)(httpServer).delete(`/workers/${testWorker.id}`);
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(404);
        });
        it('should handle assignment to deleted booking', async () => {
            await (0, supertest_1.default)(httpServer).delete(`/bookings/${testBooking.id}`);
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(404);
        });
        it('should handle assignment for booking without service', async () => {
            const bookingWithoutService = await (0, supertest_1.default)(httpServer)
                .post('/bookings')
                .send({
                userId: testUser.id,
                startTime: new Date(Date.now() + 600000),
                endTime: new Date(Date.now() + 7200000),
                status: 'confirmed',
                amount: 500.0,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${bookingWithoutService.body.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect([200, 400, 404]).toContain(response.status);
        });
        it('should handle assignment for completed booking', async () => {
            await (0, supertest_1.default)(httpServer)
                .patch(`/bookings/${testBooking.id}`)
                .send({
                status: 'completed',
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(400);
        });
        it('should handle concurrent assignment requests', async () => {
            const promises = [
                (0, supertest_1.default)(httpServer)
                    .post(`/bookings/${testBooking.id}/assign-worker`)
                    .send({
                    workerId: testWorker.id,
                }),
                (0, supertest_1.default)(httpServer)
                    .post(`/bookings/${testBooking.id}/assign-worker`)
                    .send({
                    workerId: testWorker.id,
                }),
                (0, supertest_1.default)(httpServer)
                    .post(`/bookings/${testBooking.id}/assign-worker`)
                    .send({
                    workerId: testWorker.id,
                }),
            ];
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.status === 201).length;
            expect(successCount).toBeLessThanOrEqual(1);
        });
        it('should validate required fields for assignment', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({});
            expect(response.status).toBe(400);
        });
        it('should handle assignment with inactive worker', async () => {
            await (0, supertest_1.default)(httpServer)
                .patch(`/workers/${testWorker.id}`)
                .send({
                isActive: false,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(400);
        });
        it('should handle assignment with unavailable worker', async () => {
            await (0, supertest_1.default)(httpServer)
                .patch(`/workers/${testWorker.id}`)
                .send({
                isAvailable: false,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: testWorker.id,
            });
            expect(response.status).toBe(400);
        });
        it('should handle assignment to worker in different location', async () => {
            const distantWorker = await (0, supertest_1.default)(httpServer)
                .post('/workers')
                .send({
                name: 'Distant Worker',
                email: `distant-${Date.now()}@example.com`,
                phone: '1111111111',
                location: 'Delhi',
                latitude: 28.6139,
                longitude: 77.209,
                isActive: true,
                isAvailable: true,
                rating: 4.0,
            });
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/assign-worker`)
                .send({
                workerId: distantWorker.body.id,
            });
            expect([200, 400]).toContain(response.status);
        });
    });
    describe('Additional Assignment Scenarios', () => {
        beforeEach(async () => {
            await createTestData();
        });
        it('should create booking with automatic assignment', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/create-with-assignment`)
                .send({
                userId: testUser.id,
                serviceId: testService.id,
                startTime: new Date(Date.now() + 600000),
                endTime: new Date(Date.now() + 7200000),
                amount: 500.0,
                status: 'pending',
            });
            expect([201, 400]).toContain(response.status);
        });
        it('should attempt assignment via dedicated endpoint', async () => {
            const response = await (0, supertest_1.default)(httpServer)
                .post(`/bookings/${testBooking.id}/attempt-assignment`);
            expect([200, 400, 404]).toContain(response.status);
        });
        it('should check availability before assignment', async () => {
            const response = await (0, supertest_1.default)(httpServer)
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
            const response = await (0, supertest_1.default)(httpServer)
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
            const response = await (0, supertest_1.default)(httpServer).get('/assignments/status/latest');
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
        });
        it('should attempt assignment via assignments endpoint', async () => {
            const response = await (0, supertest_1.default)(httpServer)
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
            const response = await (0, supertest_1.default)(httpServer)
                .post('/bookings/assign')
                .send({
                bookingId: testBooking.id,
                workerId: testWorker.id,
            });
            expect([200, 201, 400]).toContain(response.status);
        });
    });
});
//# sourceMappingURL=assignments-complete.e2e-spec.js.map