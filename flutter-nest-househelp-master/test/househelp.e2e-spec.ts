import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('House Help App E2E', () => {
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

  it('should complete full user flow', async () => {
    // Create a service
    const serviceResponse = await request(app.getHttpServer())
      .post('/services')
      .send({
        name: 'Cleaning',
        description: 'House cleaning service',
        category: 'Home',
        basePrice: 500,
      });
    expect(serviceResponse.status).toBe(201);
    const service = serviceResponse.body;

    // Register worker user
    const workerUserResponse = await request(app.getHttpServer())
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

    // Create worker
    const workerResponse = await request(app.getHttpServer())
      .post('/workers')
      .send({
        userId: workerUser.id,
        bio: 'Experienced cleaner',
        serviceIds: [service.id],
      });
    expect(workerResponse.status).toBe(201);
    const worker = workerResponse.body;

    // Register customer user
    const registerResponse = await request(app.getHttpServer())
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

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(loginResponse.status).toBe(201);
    const token = loginResponse.body.access_token;

    // Browse services
    const servicesResponse = await request(app.getHttpServer()).get(
      '/services',
    );
    expect(servicesResponse.status).toBe(200);
    expect(servicesResponse.body.length).toBeGreaterThan(0);

    // Create booking
    const bookingResponse = await request(app.getHttpServer())
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

    // Create payment order
    const paymentOrderResponse = await request(app.getHttpServer())
      .post('/payments/create-order')
      .send({
        amount: 500,
        currency: 'INR',
      });
    expect(paymentOrderResponse.status).toBe(201);

    // Submit review
    const reviewResponse = await request(app.getHttpServer())
      .post('/reviews')
      .send({
        bookingId: booking.id,
        rating: 5,
        comment: 'Great service',
      });
    expect(reviewResponse.status).toBe(201);

    // Update profile
    const updateProfileResponse = await request(app.getHttpServer())
      .patch('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Updated',
        lastName: 'Test User',
      });
    expect(updateProfileResponse.status).toBe(200);

    // Get profile
    const profileResponse = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.firstName).toBe('Updated');
  });
});
