"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
describe('ServiceRequests (e2e)', () => {
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
    it('/POST service-requests (should always succeed)', async () => {
        const createDto = {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
            date: '2024-01-15T10:00:00.000Z',
            timeWindow: 'morning',
            priceSnapshot: 500.0,
        };
        const response = await (0, supertest_1.default)(app.getHttpServer())
            .post('/service-requests')
            .send(createDto);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('requestId');
        expect(response.body.assignmentStatus).toBe('REQUESTED');
    });
    it('/GET service-requests/:id (should return status)', async () => {
        const createResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/service-requests')
            .send({
            userId: '550e8400-e29b-41d4-a716-446655440000',
            serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
            date: '2024-01-15T10:00:00.000Z',
            timeWindow: 'morning',
            priceSnapshot: 500.0,
        });
        expect(createResponse.status).toBe(201);
        const requestId = createResponse.body.requestId;
        const response = await (0, supertest_1.default)(app.getHttpServer()).get(`/service-requests/${requestId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('assignmentStatus');
        expect(['REQUESTED', 'ASSIGNED', 'FAILED_TO_ASSIGN']).toContain(response.body.assignmentStatus);
    });
});
//# sourceMappingURL=service-requests.e2e-spec.js.map