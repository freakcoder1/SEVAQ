"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
describe('House Help App E2E', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('should complete full user flow', async () => {
        const serviceResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/services')
            .send({
            name: 'Cleaning',
            description: 'House cleaning service',
            category: 'Home',
            basePrice: 500,
        });
        expect(serviceResponse.status).toBe(201);
        const service = serviceResponse.body;
        const workerUserResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/signup')
            .send({
            email: 'worker@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            phone: '9876543210',
        });
        expect(workerUserResponse.status).toBe(201);
        const workerUser = workerUserResponse.body;
        const workerResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/workers')
            .send({
            userId: workerUser.id,
            bio: 'Experienced cleaner',
            serviceIds: [service.id],
        });
        expect(workerResponse.status).toBe(201);
        const worker = workerResponse.body;
        const registerResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/signup')
            .send({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
        });
        expect(registerResponse.status).toBe(201);
        const user = registerResponse.body;
        const loginResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/login')
            .send({
            email: 'test@example.com',
            password: 'password123',
        });
        expect(loginResponse.status).toBe(201);
        const token = loginResponse.body.access_token;
        const servicesResponse = await (0, supertest_1.default)(app.getHttpServer())
            .get('/services');
        expect(servicesResponse.status).toBe(200);
        expect(servicesResponse.body.length).toBeGreaterThan(0);
        const bookingResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/bookings')
            .send({
            userId: user.id,
            serviceId: service.id,
            workerId: worker.id,
            startTime: new Date('2023-12-01T10:00:00Z'),
            endTime: new Date('2023-12-01T12:00:00Z'),
        });
        expect(bookingResponse.status).toBe(201);
        const booking = bookingResponse.body;
        const paymentOrderResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/payments/create-order')
            .send({
            amount: 500,
            currency: 'INR',
        });
        expect(paymentOrderResponse.status).toBe(201);
        const reviewResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/reviews')
            .send({
            bookingId: booking.id,
            rating: 5,
            comment: 'Great service',
        });
        expect(reviewResponse.status).toBe(201);
        const updateProfileResponse = await (0, supertest_1.default)(app.getHttpServer())
            .patch('/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({
            firstName: 'Updated',
            lastName: 'Test User',
        });
        expect(updateProfileResponse.status).toBe(200);
        const profileResponse = await (0, supertest_1.default)(app.getHttpServer())
            .get('/auth/profile')
            .set('Authorization', `Bearer ${token}`);
        expect(profileResponse.status).toBe(200);
        expect(profileResponse.body.firstName).toBe('Updated');
    });
});
//# sourceMappingURL=househelp.e2e-spec.js.map