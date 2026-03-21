import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('ServiceRequests (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST service-requests (should always succeed)', async () => {
    const createDto = {
      userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Valid UUID from service mapper
      date: '2024-01-15T10:00:00.000Z', // ISO string
      timeWindow: 'morning',
      priceSnapshot: 500.0,
    };

    const response = await request(app.getHttpServer())
      .post('/service-requests')
      .send(createDto);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('requestId');
    expect(response.body.assignmentStatus).toBe('REQUESTED');
  });

  it('/GET service-requests/:id (should return status)', async () => {
    // First create a service request
    const createResponse = await request(app.getHttpServer())
      .post('/service-requests')
      .send({
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        serviceId: '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b', // Valid UUID from service mapper
        date: '2024-01-15T10:00:00.000Z', // ISO string
        timeWindow: 'morning',
        priceSnapshot: 500.0,
      });

    expect(createResponse.status).toBe(201);
    const requestId = createResponse.body.requestId;

    const response = await request(app.getHttpServer()).get(
      `/service-requests/${requestId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('assignmentStatus');
    expect(['REQUESTED', 'ASSIGNED', 'FAILED_TO_ASSIGN']).toContain(
      response.body.assignmentStatus,
    );
  });
});
