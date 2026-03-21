import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServiceProfile,
  ServiceType,
  ProfileName,
} from './entities/service-profile.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ServiceProfilesService implements OnModuleInit {
  constructor(
    @InjectRepository(ServiceProfile)
    private serviceProfileRepository: Repository<ServiceProfile>,
  ) {}

  async onModuleInit() {
    // Predefine service profiles if they don't exist
    await this.predefinedProfiles();
  }

  private getPredefinedProfiles() {
    return [
      // Cooking Profiles
      {
        serviceType: ServiceType.COOK,
        profileName: ProfileName.BASIC,
        description: 'Cooking - Basic',
        scopeDefinition:
          'Daily breakfast and dinner preparation for small family',
        maxCapacityHint: '1–2 people',
        internalRules: {
          mealsPerDay: 2,
          cuisines: ['North Indian', 'South Indian'],
          preparationTime: '30-45 mins per meal',
        },
        monthlyPrice: 3500,
      },
      {
        serviceType: ServiceType.COOK,
        profileName: ProfileName.STANDARD,
        description: 'Cooking - Standard',
        scopeDefinition: 'Three meals daily including snacks for medium family',
        maxCapacityHint: '2–4 people',
        internalRules: {
          mealsPerDay: 3,
          cuisines: ['North Indian', 'South Indian', 'Chinese'],
          preparationTime: '45-60 mins per meal',
          includesSnacks: true,
        },
        monthlyPrice: 5500,
      },
      {
        serviceType: ServiceType.COOK,
        profileName: ProfileName.EXTENDED,
        description: 'Cooking - Extended',
        scopeDefinition:
          'Full-day meals including snacks and special dishes for large family',
        maxCapacityHint: '4+ people',
        internalRules: {
          mealsPerDay: 4,
          cuisines: ['North Indian', 'South Indian', 'Chinese', 'Continental'],
          preparationTime: '60-90 mins per meal',
          includesSnacks: true,
          specialDishes: true,
        },
        monthlyPrice: 7500,
      },
      // Cleaning Profiles
      {
        serviceType: ServiceType.CLEANING,
        profileName: ProfileName.COMPACT,
        description: 'Cleaning - Compact',
        scopeDefinition: 'Basic cleaning for small homes',
        maxCapacityHint: '1 BHK',
        internalRules: {
          rooms: 2,
          bathrooms: 1,
          cleaningTime: '60 mins',
          frequency: 'Daily',
        },
        monthlyPrice: 2500,
      },
      {
        serviceType: ServiceType.CLEANING,
        profileName: ProfileName.STANDARD,
        description: 'Cleaning - Standard',
        scopeDefinition: 'Comprehensive cleaning for medium homes',
        maxCapacityHint: '2 BHK',
        internalRules: {
          rooms: 3,
          bathrooms: 2,
          cleaningTime: '90 mins',
          frequency: 'Daily',
          includesDeepCleaning: true,
        },
        monthlyPrice: 4000,
      },
      {
        serviceType: ServiceType.CLEANING,
        profileName: ProfileName.EXTENDED,
        description: 'Cleaning - Extended',
        scopeDefinition: 'Premium cleaning for large homes',
        maxCapacityHint: '3+ BHK',
        internalRules: {
          rooms: 4,
          bathrooms: 3,
          cleaningTime: '120 mins',
          frequency: 'Daily',
          includesDeepCleaning: true,
          includesOrganizing: true,
        },
        monthlyPrice: 6000,
      },
      // Maid Profiles
      {
        serviceType: ServiceType.MAID,
        profileName: ProfileName.COMPACT,
        description: 'Maid - Compact',
        scopeDefinition: 'Basic household assistance for small homes',
        maxCapacityHint: '1 BHK',
        internalRules: {
          tasks: ['Cleaning', 'Utensils', 'Kitchen Upkeep'],
          workingHours: '4 hours/day',
          frequency: 'Daily',
        },
        monthlyPrice: 3000,
      },
      {
        serviceType: ServiceType.MAID,
        profileName: ProfileName.STANDARD,
        description: 'Maid - Standard',
        scopeDefinition: 'Comprehensive household assistance for medium homes',
        maxCapacityHint: '2 BHK',
        internalRules: {
          tasks: ['Cleaning', 'Utensils', 'Kitchen Upkeep', 'Laundry'],
          workingHours: '6 hours/day',
          frequency: 'Daily',
          includesIroning: true,
        },
        monthlyPrice: 5000,
      },
      {
        serviceType: ServiceType.MAID,
        profileName: ProfileName.EXTENDED,
        description: 'Maid - Extended',
        scopeDefinition: 'Premium household assistance for large homes',
        maxCapacityHint: '3+ BHK',
        internalRules: {
          tasks: [
            'Cleaning',
            'Utensils',
            'Kitchen Upkeep',
            'Laundry',
            'Organizing',
          ],
          workingHours: '8 hours/day',
          frequency: 'Daily',
          includesIroning: true,
          includesOrganizing: true,
        },
        monthlyPrice: 8000,
      },
    ];
  }

  async predefinedProfiles() {
    const profiles = this.getPredefinedProfiles();
    for (const profileData of profiles) {
      const existingProfile = await this.serviceProfileRepository.findOne({
        where: {
          serviceType: profileData.serviceType,
          profileName: profileData.profileName,
        },
      });

      if (!existingProfile) {
        const profile = this.serviceProfileRepository.create({
          publicId: uuidv4(),
          ...profileData,
          isActive: true,
        });
        await this.serviceProfileRepository.save(profile);
      }
    }
  }

  async getProfilesByServiceType(
    serviceType: ServiceType,
  ): Promise<ServiceProfile[]> {
    return this.serviceProfileRepository.find({
      where: {
        serviceType,
        isActive: true,
      },
      order: {
        monthlyPrice: 'ASC',
      },
    });
  }

  async getAllProfiles(): Promise<ServiceProfile[]> {
    return this.serviceProfileRepository.find({
      where: { isActive: true },
      order: {
        serviceType: 'ASC',
        monthlyPrice: 'ASC',
      },
    });
  }

  async getProfileById(id: number): Promise<ServiceProfile | null> {
    return this.serviceProfileRepository.findOne({ where: { id } });
  }

  async getProfileByPublicId(publicId: string): Promise<ServiceProfile | null> {
    return this.serviceProfileRepository.findOne({ where: { publicId } });
  }
}
