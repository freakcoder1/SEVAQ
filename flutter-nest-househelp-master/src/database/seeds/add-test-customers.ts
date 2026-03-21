import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

export class AddTestCustomers {
  private readonly logger = new Logger(AddTestCustomers.name);

  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    this.logger.log('Starting test customer creation...');

    // Create test customers
    const testCustomers = [
      {
        firstName: 'Test',
        lastName: 'User1',
        email: 'test.user1@example.com',
        password: 'password123',
        phone: '+919876543217',
        latitude: 28.6139,
        longitude: 77.209,
        preferredLat: 28.6139,
        preferredLng: 77.209,
        hasCompletedLocationSetup: true,
        role: UserRole.USER,
      },
      {
        firstName: 'Test',
        lastName: 'User2',
        email: 'test.user2@example.com',
        password: 'password123',
        phone: '+919876543218',
        latitude: 28.6149,
        longitude: 77.2095,
        preferredLat: 28.6149,
        preferredLng: 77.2095,
        hasCompletedLocationSetup: true,
        role: UserRole.USER,
      },
      {
        firstName: 'Test',
        lastName: 'User3',
        email: 'test.user3@example.com',
        password: 'password123',
        phone: '+919876543219',
        latitude: 28.6159,
        longitude: 77.21,
        preferredLat: 28.6159,
        preferredLng: 77.21,
        hasCompletedLocationSetup: true,
        role: UserRole.USER,
      },
    ];

    for (const customerData of testCustomers) {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: customerData.email },
      });

      if (existingUser) {
        this.logger.log(
          `User ${customerData.email} already exists, skipping...`,
        );
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(customerData.password, 10);
      const user = userRepository.create({
        email: customerData.email,
        password: hashedPassword,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        role: customerData.role,
        latitude: customerData.latitude,
        longitude: customerData.longitude,
        preferredLat: customerData.preferredLat,
        preferredLng: customerData.preferredLng,
        hasCompletedLocationSetup: customerData.hasCompletedLocationSetup,
      });

      await userRepository.save(user);
      this.logger.log(
        `Created test customer: ${customerData.firstName} ${customerData.lastName} (${customerData.email})`,
      );
    }

    this.logger.log('Test customer creation completed');
    await this.verifyTestCustomerData(userRepository);
  }

  private async verifyTestCustomerData(
    userRepository: Repository<User>,
  ): Promise<void> {
    this.logger.log('Verifying test customer data...');

    const testCustomers = await userRepository.find({
      where: { role: UserRole.USER },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    this.logger.log(`Found ${testCustomers.length} test customers in database`);

    for (const customer of testCustomers) {
      this.logger.debug(
        `Test Customer: ${customer.firstName} ${customer.lastName} - Email: ${customer.email} - Location: (${customer.latitude}, ${customer.longitude})`,
      );
    }

    this.logger.log('Test customer data verification completed');
  }
}
