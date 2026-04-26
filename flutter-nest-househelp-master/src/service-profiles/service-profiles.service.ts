import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServiceProfile,
  ServiceType,
} from './entities/service-profile.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ServiceProfilesService {
  constructor(
    @InjectRepository(ServiceProfile)
    private serviceProfileRepository: Repository<ServiceProfile>,
  ) {}

  // Predefined profiles method commented out - system now uses custom plans
  // getPredefinedProfiles() {
  //   return [
  //     // Cooking Profiles
  //     ...
  //   ];
  // }

  // async predefinedProfiles() {
  //   const profiles = this.getPredefinedProfiles();
  //   for (const profileData of profiles) {
  //     const existingProfile = await this.serviceProfileRepository.findOne({
  //       where: {
  //         serviceType: profileData.serviceType,
  //         profileName: profileData.profileName,
  //       },
  //     });

  //     if (!existingProfile) {
  //       const profile = this.serviceProfileRepository.create({
  //         publicId: uuidv4(),
  //         ...profileData,
  //         isActive: true,
  //       });
  //       await this.serviceProfileRepository.save(profile);
  //     }
  //   }
  // }

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
