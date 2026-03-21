import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function createTestCustomer() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  console.log('Creating test customer...');

  // Check if customer already exists
  const existingUser = await userRepository.findOne({
    where: { email: 'test.customer@example.com' },
  });

  if (existingUser) {
    console.log('Test customer already exists:', existingUser.email);
    await app.close();
    return;
  }

  // Create test customer
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = userRepository.create({
    email: 'test.customer@example.com',
    password: hashedPassword,
    firstName: 'Test',
    lastName: 'Customer',
    phone: '+919876543215',
    role: UserRole.USER,
    latitude: 28.6139,
    longitude: 77.209,
    preferredLat: 28.6139,
    preferredLng: 77.209,
    hasCompletedLocationSetup: true,
  });

  await userRepository.save(user);
  console.log('✅ Test customer created successfully!');
  console.log('Email: test.customer@example.com');
  console.log('Password: password123');

  await app.close();
}

createTestCustomer().catch(console.error);
