import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { Service } from '../../services/entities/service.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

export class SeedWorkers {
  private readonly logger = new Logger(SeedWorkers.name);

  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const workerRepository = dataSource.getRepository(Worker);
    const serviceRepository = dataSource.getRepository(Service);

    this.logger.log('Starting worker seeding...');

    // Check if workers already exist
    const existingWorkers = await workerRepository.count();
    if (existingWorkers > 0) {
      this.logger.log(`${existingWorkers} workers already exist, skipping creation`);
      return;
    }

    // Get existing services
    const services = await serviceRepository.find();
    if (services.length === 0) {
      this.logger.warn('No services found, creating sample services...');
      await this.createSampleServices(serviceRepository);
      const newServices = await serviceRepository.find();
      services.push(...newServices);
    }

    this.logger.log(`Found ${services.length} services`);

    // Create sample workers for 201306 area
    const workers = [
      {
        firstName: 'Amit',
        lastName: 'Kumar',
        email: 'amit.kumar@househelp.com',
        password: 'password123',
        phone: '+919876543210',
        bio: 'Professional cleaner with 5 years of experience. Expert in deep cleaning and sanitization.',
        rating: 4.5,
        reviewCount: 127,
        serviceRadiusKm: 5,
        currentLat: 28.6150,
        currentLng: 77.3650,
        isActive: true,
        services: [services[0], services[1]].filter(Boolean),
        availabilitySchedule: [
          { day: 1, startTime: '09:00', endTime: '18:00' },
          { day: 2, startTime: '09:00', endTime: '18:00' },
          { day: 3, startTime: '09:00', endTime: '18:00' },
          { day: 4, startTime: '09:00', endTime: '18:00' },
          { day: 5, startTime: '09:00', endTime: '18:00' },
        ]
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@househelp.com',
        password: 'password123',
        phone: '+919876543211',
        bio: 'Experienced cook specializing in North Indian and South Indian cuisine. Home chef with passion.',
        rating: 4.8,
        reviewCount: 89,
        serviceRadiusKm: 4,
        currentLat: 28.6200,
        currentLng: 77.3700,
        isActive: true,
        services: [services[2], services[3]].filter(Boolean),
        availabilitySchedule: [
          { day: 1, startTime: '08:00', endTime: '20:00' },
          { day: 2, startTime: '08:00', endTime: '20:00' },
          { day: 3, startTime: '08:00', endTime: '20:00' },
          { day: 4, startTime: '08:00', endTime: '20:00' },
          { day: 5, startTime: '08:00', endTime: '20:00' },
          { day: 6, startTime: '08:00', endTime: '16:00' },
        ]
      },
      {
        firstName: 'Rajesh',
        lastName: 'Verma',
        email: 'rajesh.verma@househelp.com',
        password: 'password123',
        phone: '+919876543212',
        bio: 'Reliable driver and errand runner. Safe driver with clean record.',
        rating: 4.3,
        reviewCount: 64,
        serviceRadiusKm: 8,
        currentLat: 28.6180,
        currentLng: 77.3680,
        isActive: true,
        services: [services[4], services[5]].filter(Boolean),
        availabilitySchedule: [
          { day: 0, startTime: '07:00', endTime: '21:00' },
          { day: 1, startTime: '07:00', endTime: '21:00' },
          { day: 2, startTime: '07:00', endTime: '21:00' },
          { day: 3, startTime: '07:00', endTime: '21:00' },
          { day: 4, startTime: '07:00', endTime: '21:00' },
          { day: 5, startTime: '07:00', endTime: '21:00' },
          { day: 6, startTime: '07:00', endTime: '21:00' },
        ]
      },
      {
        firstName: 'Sunita',
        lastName: ' Devi',
        email: 'sunita.devi@househelp.com',
        password: 'password123',
        phone: '+919876543213',
        bio: 'Expert in laundry and ironing services. Quick and efficient.',
        rating: 4.6,
        reviewCount: 45,
        serviceRadiusKm: 3,
        currentLat: 28.6220,
        currentLng: 77.3720,
        isActive: true,
        services: [services[1], services[6]].filter(Boolean),
        availabilitySchedule: [
          { day: 1, startTime: '10:00', endTime: '19:00' },
          { day: 2, startTime: '10:00', endTime: '19:00' },
          { day: 3, startTime: '10:00', endTime: '19:00' },
          { day: 4, startTime: '10:00', endTime: '19:00' },
          { day: 5, startTime: '10:00', endTime: '19:00' },
        ]
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.singh@househelp.com',
        password: 'password123',
        phone: '+919876543214',
        bio: 'Full-time house help. Expert in all household chores and gardening.',
        rating: 4.4,
        reviewCount: 112,
        serviceRadiusKm: 5,
        currentLat: 28.6160,
        currentLng: 77.3660,
        isActive: true,
        services: services.slice(0, 3),
        availabilitySchedule: [
          { day: 0, startTime: '06:00', endTime: '20:00' },
          { day: 1, startTime: '06:00', endTime: '20:00' },
          { day: 2, startTime: '06:00', endTime: '20:00' },
          { day: 3, startTime: '06:00', endTime: '20:00' },
          { day: 4, startTime: '06:00', endTime: '20:00' },
          { day: 5, startTime: '06:00', endTime: '20:00' },
          { day: 6, startTime: '06:00', endTime: '14:00' },
        ]
      }
    ];

    for (const workerData of workers) {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: workerData.email }
      });

      if (existingUser) {
        this.logger.log(`User ${workerData.email} already exists, skipping...`);
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(workerData.password, 10);
      const user = userRepository.create({
        email: workerData.email,
        password: hashedPassword,
        firstName: workerData.firstName,
        lastName: workerData.lastName,
        phone: workerData.phone,
        role: UserRole.WORKER,
        latitude: workerData.currentLat,
        longitude: workerData.currentLng,
        preferredLat: workerData.currentLat,
        preferredLng: workerData.currentLng,
        hasCompletedLocationSetup: true,
      });

      const savedUser = await userRepository.save(user);
      this.logger.log(`Created user: ${savedUser.email}`);

      // Create worker
      const worker = workerRepository.create({
        user: savedUser,
        bio: workerData.bio,
        rating: workerData.rating,
        reviewCount: workerData.reviewCount,
        serviceRadiusKm: workerData.serviceRadiusKm,
        currentLat: workerData.currentLat,
        currentLng: workerData.currentLng,
        lastLocationUpdate: new Date(),
        isActive: workerData.isActive,
        services: workerData.services,
        availabilitySchedule: workerData.availabilitySchedule,
      });

      await workerRepository.save(worker);
      this.logger.log(`Created worker: ${workerData.firstName} ${workerData.lastName} at (${workerData.currentLat}, ${workerData.currentLng})`);
    }

    this.logger.log('Worker seeding completed');
    await this.verifyWorkerData(workerRepository);
  }

  private async createSampleServices(serviceRepository: Repository<Service>): Promise<void> {
    const sampleServices = [
      { name: 'Home Cleaning', description: 'Complete home cleaning service', category: 'Cleaning', basePrice: 500 },
      { name: 'Deep Cleaning', description: 'Deep cleaning for kitchens and bathrooms', category: 'Cleaning', basePrice: 800 },
      { name: 'Cooking', description: 'Home cooking service', category: 'Cooking', basePrice: 400 },
      { name: 'Meal Preparation', description: 'Daily meal preparation', category: 'Cooking', basePrice: 600 },
      { name: 'Driver', description: 'Personal driver service', category: 'Driving', basePrice: 500 },
      { name: 'Errands', description: 'Running errands and grocery shopping', category: 'Errands', basePrice: 300 },
      { name: 'Laundry', description: 'Washing, drying, and ironing', category: 'Laundry', basePrice: 350 },
    ];

    for (const serviceData of sampleServices) {
      const service = serviceRepository.create(serviceData);
      await serviceRepository.save(service);
      this.logger.log(`Created service: ${serviceData.name}`);
    }
  }

  private async verifyWorkerData(workerRepository: Repository<Worker>): Promise<void> {
    this.logger.log('Verifying seeded worker data...');

    const workers = await workerRepository.find({
      relations: ['user', 'services']
    });

    this.logger.log(`Found ${workers.length} workers in database`);

    for (const worker of workers) {
      this.logger.debug(`Worker: ${worker.user.firstName} ${worker.user.lastName} - Location: (${worker.currentLat}, ${worker.currentLng}), Rating: ${worker.rating}`);
    }

    this.logger.log('Worker data verification completed');
  }
}
