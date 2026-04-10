import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Worker } from '../workers/entities/worker.entity';
import { randomUUID } from 'crypto';

async function registerWorker() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);
  const workerRepository = dataSource.getRepository(Worker);

  const email = 'sumitjaiwal7870@gmail.com';
  
  console.log(`Looking for user with email: ${email}`);

  // Find the user
  let user = await userRepository.findOne({
    where: { email },
  });

  if (!user) {
    console.log(`❌ User not found: ${email}`);
    console.log('Creating new user...');
    
    // Create new user using insert to avoid ID issues
    await userRepository.insert({
      email,
      password: '$2b$10$dummy', // placeholder - user already has auth
      firstName: 'Sumit',
      lastName: 'Jaiswal',
      phone: '+919999999999',
      role: UserRole.USER,
      latitude: 28.6139,
      longitude: 77.209,
      preferredLat: 28.6139,
      preferredLng: 77.209,
      hasCompletedLocationSetup: true,
    });
    
    user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Failed to create user');
    }
    console.log(`✅ User created: ${user.id}`);
  } else {
    console.log(`✅ User found: ${user.id}`);
  }

  // Check if worker profile exists
  const existingWorker = await workerRepository.findOne({
    where: { userId: user.id },
  });

  if (existingWorker) {
    console.log(`✅ Worker profile already exists: ${existingWorker.id}`);
  } else {
    console.log(`Creating worker profile for user...`);
    
    // Create worker profile
    await workerRepository.insert({
      publicId: randomUUID(),
      userId: user.id,
      isActive: true,
      isAvailable: true,
      rating: 5.0,
      reviewCount: 0,
      serviceRadiusKm: 10,
      latitude: user.latitude ?? 28.6139,
      longitude: user.longitude ?? 77.209,
    });
    
    const newWorker = await workerRepository.findOne({ where: { userId: user.id } });
    if (!newWorker) {
      throw new Error('Failed to create worker profile');
    }
    console.log(`✅ Worker profile created: ${newWorker.id}`);
  }

  console.log('\n🎉 Registration complete!');
  console.log(`User: ${email}`);
  console.log('Now the user can use the worker app!');
  
  await app.close();
}

registerWorker().catch(console.error);
