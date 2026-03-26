import { DataSource, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ServiceProfile, ServiceType, ProfileName } from '../../service-profiles/entities/service-profile.entity';

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

    const serviceProfiles = [
      // Cleaning Services
      {
        serviceType: ServiceType.CLEANING,
        profileName: ProfileName.BASIC,
        description: 'Basic home cleaning - dusting, sweeping, mopping',
        scopeDefinition: 'Living areas and bedrooms',
        maxCapacityHint: '2 visits per day',
        monthlyPrice: 3000,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'afternoon'],
        isActive: true,
      },
      {
        serviceType: ServiceType.CLEANING,
        profileName: ProfileName.STANDARD,
        description: 'Standard cleaning with bathroom and kitchen',
        scopeDefinition: 'Full home except deep cleaning',
        maxCapacityHint: '1 visit per day',
        monthlyPrice: 5000,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'afternoon'],
        isActive: true,
      },
      {
        serviceType: ServiceType.CLEANING,
        profileName: ProfileName.EXTENDED,
        description: 'Extended cleaning with weekly deep clean',
        scopeDefinition: 'Full home with weekly deep cleaning',
        maxCapacityHint: '2 visits per day',
        monthlyPrice: 8000,
        visitpattern: 'DAILY',
        maxvisitsperday: 2,
        defaulttimewindows: ['morning', 'afternoon', 'evening'],
        isActive: true,
      },
      // Cooking Services
      {
        serviceType: ServiceType.COOK,
        profileName: ProfileName.BASIC,
        description: 'Basic cooking - 2 meals per day',
        scopeDefinition: 'Breakfast and lunch OR lunch and dinner',
        maxCapacityHint: '2 meals daily',
        monthlyPrice: 4000,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'evening'],
        isActive: true,
      },
      {
        serviceType: ServiceType.COOK,
        profileName: ProfileName.STANDARD,
        description: 'Standard cooking - 3 meals per day',
        scopeDefinition: 'Breakfast, lunch and dinner',
        maxCapacityHint: '3 meals daily',
        monthlyPrice: 6000,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'afternoon', 'evening'],
        isActive: true,
      },
      {
        serviceType: ServiceType.COOK,
        profileName: ProfileName.COMPACT,
        description: 'Compact cooking - weekend only',
        scopeDefinition: 'Saturday and Sunday meal preparation',
        maxCapacityHint: 'Weekends only',
        monthlyPrice: 2000,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'afternoon'],
        isActive: true,
      },
      // Maid Services
      {
        serviceType: ServiceType.MAID,
        profileName: ProfileName.BASIC,
        description: 'Basic maid service - 4 hours daily',
        scopeDefinition: 'Light household chores',
        maxCapacityHint: '4 hours per day',
        monthlyPrice: 3500,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'afternoon'],
        isActive: true,
      },
      {
        serviceType: ServiceType.MAID,
        profileName: ProfileName.STANDARD,
        description: 'Standard maid service - 8 hours daily',
        scopeDefinition: 'Full household management',
        maxCapacityHint: '8 hours per day',
        monthlyPrice: 6000,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'afternoon'],
        isActive: true,
      },
      {
        serviceType: ServiceType.MAID,
        profileName: ProfileName.EXTENDED,
        description: 'Extended maid service with cooking',
        scopeDefinition: 'Full household + cooking duties',
        maxCapacityHint: '10 hours per day',
        monthlyPrice: 9000,
        visitpattern: 'DAILY',
        maxvisitsperday: 1,
        defaulttimewindows: ['morning', 'afternoon', 'evening'],
        isActive: true,
      },
    ];

    for (const profileData of serviceProfiles) {
      const profile = serviceProfileRepository.create({
        ...profileData,
        publicId: require('crypto').randomUUID(),
      });
      await serviceProfileRepository.save(profile);
      this.logger.log(`Created service profile: ${profile.serviceType} - ${profile.profileName}`);
    }

    this.logger.log(`Seeded ${serviceProfiles.length} service profiles`);
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
