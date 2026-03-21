import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

export class SeedCustomers {
  private readonly logger = new Logger(SeedCustomers.name);

  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    this.logger.log('Starting customer seeding...');

    // Check if customers already exist
    const existingCustomers = await userRepository.count({
      where: { role: UserRole.USER },
    });

    if (existingCustomers > 0) {
      this.logger.log(
        `${existingCustomers} customers already exist, skipping creation`,
      );
      return;
    }

    // Create sample customers
    const customers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+919876543215',
        latitude: 28.6139,
        longitude: 77.209,
        preferredLat: 28.6139,
        preferredLng: 77.209,
        hasCompletedLocationSetup: true,
        role: UserRole.USER,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        phone: '+919876543216',
        latitude: 28.6149,
        longitude: 77.2095,
        preferredLat: 28.6149,
        preferredLng: 77.2095,
        hasCompletedLocationSetup: true,
        role: UserRole.USER,
      },
    ];

    for (const customerData of customers) {
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
        `Created customer: ${customerData.firstName} ${customerData.lastName} (${customerData.email})`,
      );
    }

    this.logger.log('Customer seeding completed');
    await this.verifyCustomerData(userRepository);
  }

  private async verifyCustomerData(
    userRepository: Repository<User>,
  ): Promise<void> {
    this.logger.log('Verifying seeded customer data...');

    const customers = await userRepository.find({
      where: { role: UserRole.USER },
    });

    this.logger.log(`Found ${customers.length} customers in database`);

    for (const customer of customers) {
      this.logger.debug(
        `Customer: ${customer.firstName} ${customer.lastName} - Email: ${customer.email} - Location: (${customer.latitude}, ${customer.longitude})`,
      );
    }

    this.logger.log('Customer data verification completed');
  }
}
