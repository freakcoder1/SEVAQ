import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AddressesModule } from '../src/addresses/addresses.module';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { Address } from '../src/addresses/entities/address.entity';
import { User } from '../src/users/entities/user.entity';

const VALID_PASSWORD = 'Password123!';

async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [Address, User],
        synchronize: true,
      }),
      JwtModule.register({
        secret: 'test-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      UsersModule,
      AuthModule,
      AddressesModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

describe('Addresses API E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Create user once for all tests
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'address-test@example.com',
        password: VALID_PASSWORD,
        firstName: 'Address',
        lastName: 'Test',
        phone: '1111111111',
        role: 'user',
      });
    authToken = response.body.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Authentication Flow', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app.getHttpServer()).get('/addresses');
      expect(response.status).toBe(401);
    });
  });

  describe('Address CRUD Operations', () => {
    it('should create an address successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          societyName: 'Test Society',
          flatNumber: 'A-101',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.societyName).toBe('Test Society');
    });

    it('should get all addresses for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/addresses')
        .set('Authorization', 'Bearer ' + authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get default address', async () => {
      const response = await request(app.getHttpServer())
        .get('/addresses/default')
        .set('Authorization', 'Bearer ' + authToken);

      expect([200, 404]).toContain(response.status);
    });

    it('should get address by ID', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', 'Bearer ' + authToken)
        .send({ societyName: 'Get Test', flatNumber: 'G-1' });

      expect(createResponse.status).toBe(201);

      const getResponse = await request(app.getHttpServer())
        .get('/addresses/' + createResponse.body.id)
        .set('Authorization', 'Bearer ' + authToken);

      expect(getResponse.status).toBe(200);
    });

    it('should update address', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', 'Bearer ' + authToken)
        .send({ societyName: 'Update Test', flatNumber: 'U-1' });

      expect(createResponse.status).toBe(201);

      const response = await request(app.getHttpServer())
        .patch('/addresses/' + createResponse.body.id)
        .set('Authorization', 'Bearer ' + authToken)
        .send({ flatNumber: 'U-1-UPDATED' });

      expect(response.status).toBe(200);
      expect(response.body.flatNumber).toBe('U-1-UPDATED');
    });

    it('should delete address', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/addresses')
        .set('Authorization', 'Bearer ' + authToken)
        .send({ societyName: 'Delete Test', flatNumber: 'X-1' });

      expect(createResponse.status).toBe(201);

      await request(app.getHttpServer())
        .delete('/addresses/' + createResponse.body.id)
        .set('Authorization', 'Bearer ' + authToken);

      const getResponse = await request(app.getHttpServer())
        .get('/addresses/' + createResponse.body.id)
        .set('Authorization', 'Bearer ' + authToken);

      expect(getResponse.status).toBe(404);
    });
  });
});

describe('Address Model Frontend Compatibility', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'flutter-compat@example.com',
        password: VALID_PASSWORD,
        firstName: 'Flutter',
        lastName: 'Test',
        phone: '3333333333',
        role: 'user',
      });

    authToken = response.body.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return address data with correct types for Flutter model', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/addresses')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        societyName: 'Flutter Society',
        flatNumber: 'F-1',
        latitude: 28.5355,
        longitude: 77.391,
        isDefault: true,
      });

    expect(createResponse.status).toBe(201);

    const address = createResponse.body;

    expect(address.id).toBeDefined();
    expect(typeof address.id).toBe('string');
    expect(address.userId).toBeDefined();
    expect(address.societyName).toBeDefined();
    expect(typeof address.flatNumber).toBe('string');
    expect(typeof address.latitude).toBe('number');
    expect(typeof address.longitude).toBe('number');
    expect(address.isDefault).toBeDefined();
    expect(typeof address.isDefault).toBe('boolean');
  });
});
