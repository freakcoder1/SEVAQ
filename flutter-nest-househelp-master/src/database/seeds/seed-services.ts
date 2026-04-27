import { DataSource, Repository } from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export class SeedServices {
  private readonly logger = new Logger(SeedServices.name);

  async run(dataSource: DataSource): Promise<void> {
    const serviceRepository = dataSource.getRepository(Service);

    this.logger.log('Starting service seeding...');

    // Check if services already exist
    const existingCount = await serviceRepository.count();
    if (existingCount > 0) {
      this.logger.log(`Found ${existingCount} existing services, skipping seed`);
      return;
    }

    this.logger.log('Creating default services...');

    const services = [
      {
        publicId: randomUUID(),
        name: 'Home Cleaning',
        description: 'Complete home cleaning service',
        basePrice: 49,
        reassuranceText: 'A safe choice for most homes',
        whatWillHappen: [
          'Helper will arrive and confirm task',
          'Work done with standard tools',
          'Final inspection before leaving',
        ],
        whatWillNotHappen: [
          'No upselling without approval',
          'No extra work added silently',
        ],
        ifSomethingGoesWrong: 'Sevaq will replace or refund immediately',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: true,
        estimatedWaitTime: 30,
        workerCount: 10,
      },
      {
        publicId: randomUUID(),
        name: 'Deep Cleaning',
        description: 'Thorough deep cleaning for your home',
        basePrice: 1500,
        reassuranceText: 'Comprehensive cleaning for dirty homes',
        whatWillHappen: [
          'Helper will arrive with extra equipment',
          'Clean every corner including under furniture',
          'Use industrial-grade cleaners',
        ],
        whatWillNotHappen: [
          'No shortcuts on cleaning',
          'No areas left untreated',
        ],
        ifSomethingGoesWrong: 'Sevaq will send another helper or refund',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: false,
        estimatedWaitTime: 120,
        workerCount: 5,
      },
      {
        publicId: randomUUID(),
        name: 'Kitchen Cleaning',
        description: 'Deep cleaning for kitchen appliances and surfaces',
        basePrice: 800,
        reassuranceText: 'Make your kitchen sparkle',
        whatWillHappen: [
          'Clean all appliances inside and out',
          'Clean counters, cabinets, and sinks',
          'Remove grease and stains',
        ],
        whatWillNotHappen: [
          'No appliance dismantling without approval',
          'No use of harsh chemicals on surfaces',
        ],
        ifSomethingGoesWrong: 'We will re-clean for free',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: true,
        estimatedWaitTime: 60,
        workerCount: 8,
      },
      {
        publicId: randomUUID(),
        name: 'Bathroom Cleaning',
        description: 'Professional bathroom sanitization',
        basePrice: 600,
        reassuranceText: 'Hygienic and fresh bathroom',
        whatWillHappen: [
          'Clean and sanitize all fixtures',
          'Remove limescale and mold',
          'Freshen up the entire bathroom',
        ],
        whatWillNotHappen: [
          'No use of abrasive materials on fixtures',
          'No leaving wet surfaces',
        ],
        ifSomethingGoesWrong: 'Free re-cleaning service',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: true,
        estimatedWaitTime: 45,
        workerCount: 8,
      },
      {
        publicId: randomUUID(),
        name: 'Sofa Cleaning',
        description: 'Professional sofa and furniture cleaning',
        basePrice: 700,
        reassuranceText: 'Restore your sofa to like new',
        whatWillHappen: [
          'Vacuum all surfaces',
          'Treat stains with appropriate solutions',
          'Dry clean or steam clean as needed',
        ],
        whatWillNotHappen: [
          'No harsh chemicals that damage fabric',
          'No over-wetting of furniture',
        ],
        ifSomethingGoesWrong: 'We will pay for professional repair if needed',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: true,
        estimatedWaitTime: 45,
        workerCount: 6,
      },
      {
        publicId: randomUUID(),
        name: 'Carpet Cleaning',
        description: 'Deep carpet cleaning service',
        basePrice: 900,
        reassuranceText: 'Remove deep stains and odors',
        whatWillHappen: [
          'Vacuum thoroughly before treatment',
          'Apply stain treatment for spots',
          'Steam clean entire carpet',
        ],
        whatWillNotHappen: [
          'No using wrong cleaning solutions for carpet type',
          'No leaving carpet wet',
        ],
        ifSomethingGoesWrong: 'Free re-cleaning or refund',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: false,
        estimatedWaitTime: 90,
        workerCount: 5,
      },
      {
        name: 'Window Cleaning',
        description: 'Interior and exterior window cleaning',
        basePrice: 400,
        reassuranceText: 'Crystal clear windows',
        whatWillHappen: [
          'Clean all accessible windows',
          'Remove streaks and water marks',
          'Clean window frames and sills',
        ],
        whatWillNotHappen: [
          'No using abrasive materials on glass',
          'No leaving soap residue',
        ],
        ifSomethingGoesWrong: 'Free touch-up service',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: true,
        estimatedWaitTime: 30,
        workerCount: 7,
      },
      {
        name: 'Appliance Cleaning',
        description: 'Clean refrigerators, microwaves, and more',
        basePrice: 350,
        reassuranceText: 'Sparkling clean appliances',
        whatWillHappen: [
          'Clean inside and outside of appliances',
          'Remove food residues and odors',
          'Sanitize all touch points',
        ],
        whatWillNotHappen: [
          'No moving or unplugging appliances without approval',
          'No using harsh chemicals inside fridges',
        ],
        ifSomethingGoesWrong: 'We will re-clean for free',
        category: 'Cleaning',
        isAvailable: true,
        isFastBooking: true,
        estimatedWaitTime: 25,
        workerCount: 9,
      },
      {
        publicId: '7f8e4b5c-a883-4c6c-b348-f966508fd49d',
        name: 'Cooking Service',
        description: 'Home cooking service',
        basePrice: 149,
        reassuranceText: 'Professional home cooked meals',
        whatWillHappen: [
          'Cook will arrive with required ingredients',
          'Prepare fresh healthy meals',
          'Clean up kitchen after cooking',
        ],
        whatWillNotHappen: [
          'No extra items without approval',
          'No unhygienic food preparation',
        ],
        ifSomethingGoesWrong: 'Sevaq will replace cook or refund immediately',
        category: 'Cooking',
        isAvailable: true,
        isFastBooking: false,
        estimatedWaitTime: 120,
        workerCount: 6,
      },
    ];

    // Create services with publicId
    for (const serviceData of services) {
      const service = serviceRepository.create(serviceData);
      await serviceRepository.save(service);
    }

    const savedServices = await serviceRepository.find();
    if (savedServices.length === 0) {
      this.logger.error('WARNING: No services found after seeding!');
    } else {
      this.logger.log(`Service seeding completed: ${savedServices.length} services created`);
    }

    await this.verifySeedData(serviceRepository);
  }

  private async verifySeedData(serviceRepository: Repository<Service>): Promise<void> {
    this.logger.log('Verifying seeded service data...');
    const count = await serviceRepository.count();
    this.logger.log(`Total services in database: ${count}`);
    
    const services = await serviceRepository.find({ take: 5 });
    services.forEach((service, index) => {
      this.logger.log(`Service ${index + 1}: ${service.name} (publicId: ${service.publicId})`);
    });
  }
}
