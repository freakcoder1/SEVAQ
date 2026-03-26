"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = __importStar(require("supertest"));
const assignments_module_1 = require("../src/assignments/assignments.module");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const bookings_module_1 = require("../src/bookings/bookings.module");
const workers_module_1 = require("../src/workers/workers.module");
const services_module_1 = require("../src/services/services.module");
const users_module_1 = require("../src/users/users.module");
const slots_module_1 = require("../src/slots/slots.module");
const booking_entity_1 = require("../src/bookings/entities/booking.entity");
const worker_entity_1 = require("../src/workers/entities/worker.entity");
const service_entity_1 = require("../src/services/entities/service.entity");
const user_entity_1 = require("../src/users/entities/user.entity");
const slot_entity_1 = require("../src/slots/entities/slot.entity");
describe('Assignments E2E Tests', () => {
    let app;
    let httpServer;
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
                    entities: [booking_entity_1.Booking, worker_entity_1.Worker, service_entity_1.Service, user_entity_1.User, slot_entity_1.Slot],
                    synchronize: true,
                    dropSchema: true,
                }),
                assignments_module_1.AssignmentsModule,
                bookings_module_1.BookingsModule,
                workers_module_1.WorkersModule,
                services_module_1.ServicesModule,
                users_module_1.UsersModule,
                slots_module_1.SlotsModule,
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
        let testUser;
        let testWorker;
        let testService;
        let testBooking;
        beforeEach(async () => {
            const userResponse = await request(httpServer).post('/users').send({
                name: 'Test User',
                email: 'test@example.com',
                phone: '1234567890',
                location: 'Noida',
                latitude: 28.5355,
                longitude: 77.391,
            });
            testUser = userResponse.body;
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
            const serviceResponse = await request(httpServer).post('/services').send({
                name: 'Home Cleaning',
                description: 'Complete home cleaning service',
                price: 500.0,
                duration: 120,
                isActive: true,
            });
            testService = serviceResponse.body;
            const bookingResponse = await request(httpServer)
                .post('/bookings')
                .send({
                userId: testUser.id,
                serviceId: testService.id,
                slotId: 'slot1',
                startTime: new Date(Date.now() + 600000),
                endTime: new Date(Date.now() + 7200000),
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
            await request(httpServer).post('/assignments/assign').send({
                bookingId: testBooking.id,
                serviceId: testService.id,
                userLat: testUser.latitude,
                userLng: testUser.longitude,
                startTime: testBooking.startTime,
                endTime: testBooking.endTime,
            });
            const response = await request(httpServer).get(`/assignments/status/${testBooking.id}`);
            expect(response.status).toBe(200);
            expect(response.body.assignmentState).toBe('ASSIGNED');
            expect(response.body.assignedWorkerId).toBeDefined();
        });
        it('should handle assignment failure', async () => {
            const response = await request(httpServer)
                .post('/assignments/failure/test-id')
                .send({
                reason: 'Worker not available',
            });
            expect(response.status).toBe(404);
        });
        it('should handle assignment timeout', async () => {
            const response = await request(httpServer).post('/assignments/timeout/test-id');
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
            await request(httpServer).post('/assignments/assign').send({
                bookingId: testBooking.id,
                serviceId: testService.id,
                userLat: testUser.latitude,
                userLng: testUser.longitude,
                startTime: testBooking.startTime,
                endTime: testBooking.endTime,
            });
            const response = await request(httpServer).post(`/assignments/reassign/${testBooking.id}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should not allow duplicate assignment', async () => {
            await request(httpServer).post('/assignments/assign').send({
                bookingId: testBooking.id,
                serviceId: testService.id,
                userLat: testUser.latitude,
                userLng: testUser.longitude,
                startTime: testBooking.startTime,
                endTime: testBooking.endTime,
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
            expect(response.status).toBe(409);
        });
        it('should handle invalid booking state for assignment', async () => {
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
//# sourceMappingURL=assignments.e2e-spec.js.map