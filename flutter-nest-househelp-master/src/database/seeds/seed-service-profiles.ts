import { DataSource, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ServiceProfile, ServiceType } from '../../service-profiles/entities/service-profile.entity';

export class SeedServiceProfiles {
  private readonly logger = new Logger(SeedServiceProfiles.name);

  async run(dataSource: DataSource): Promise<void> {
    const serviceProfileRepository = dataSource.getRepository(ServiceProfile);

    // Check if service profiles already exist
    const existingProfiles = await serviceProfileRepository.count();
    if (existingProfiles > 0) {
      this.logger.log(`Found ${existingProfiles} existing service profiles, skipping seed`);
      return;
    }

    this.logger.log('Seeding service profiles...');

    // Predefined tier profiles commented out - system now uses custom plans
    // const serviceProfiles = [
    //   // Cleaning Services
    //   {
    //     serviceType: ServiceType.CLEANING,
    //     profileName: 'BASIC', // ProfileName enum removed
    //     description: 'Basic home cleaning - dusting, sweeping, mopping',
    //     scopeDefinition: 'Living areas and bedrooms',
    //     maxCapacityHint: '2 visits per day',
    //     monthlyPrice: 3000,
    //     visitpattern: 'DAILY',
    //     maxvisitsperday: 1,
    //     defaulttimewindows: ['morning', 'afternoon'],
    //     isActive: true,
    //   },
    //   ... (other profiles commented out)
    // ];

    // for (const profileData of serviceProfiles) {
    //   const profile = serviceProfileRepository.create({
    //     ...profileData,
    //     publicId: require('crypto').randomUUID(),
    //   });
    //   await serviceProfileRepository.save(profile);
    //   this.logger.log(`Created service profile: ${profile.serviceType} - ${profile.profileName}`);
    // }

    // this.logger.log(`Seeded ${serviceProfiles.length} service profiles`);
    this.logger.log('Skipping service profile seeding - system now uses custom plans');
    await this.verifySeedData(serviceProfileRepository);
  }

  private async verifySeedData(
    serviceProfileRepository: Repository<ServiceProfile>,
  ): Promise<void> {
    const profiles = await serviceProfileRepository.find();
    this.logger.log(`Verification: Found ${profiles.length} service profiles in database`);
    
    if (profiles.length === 0) {
      this.logger.error('WARNING: No service profiles found after seeding!');
    } else {
      this.logger.log('Service profile seeding completed successfully');
    }
  }
}
