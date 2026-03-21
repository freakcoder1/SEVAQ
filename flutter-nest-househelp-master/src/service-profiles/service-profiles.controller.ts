import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ServiceProfilesService } from './service-profiles.service';
import { ServiceProfile, ServiceType } from './entities/service-profile.entity';

@Controller('service-profiles')
export class ServiceProfilesController {
  constructor(
    private readonly serviceProfilesService: ServiceProfilesService,
  ) {}

  @Get()
  async getProfilesByServiceType(
    @Query('serviceType') serviceType?: string,
  ): Promise<{ success: boolean; data: any[] }> {
    try {
      let profiles: ServiceProfile[];
      if (serviceType) {
        const parsedType = serviceType.toUpperCase() as ServiceType;
        profiles =
          await this.serviceProfilesService.getProfilesByServiceType(
            parsedType,
          );
      } else {
        profiles = await this.serviceProfilesService.getAllProfiles();
      }

      // Convert monthlyPrice from Decimal to number for JSON serialization
      const serializedProfiles = profiles.map((profile) => ({
        ...profile,
        monthlyPrice: parseFloat(profile.monthlyPrice.toString()),
      }));

      return {
        success: true,
        data: serializedProfiles,
      };
    } catch (error) {
      throw new HttpException('Invalid service type', HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async getProfileById(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: any }> {
    const profile = await this.serviceProfilesService.getProfileById(
      parseInt(id),
    );
    if (!profile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    return {
      success: true,
      data: {
        ...profile,
        monthlyPrice: parseFloat(profile.monthlyPrice.toString()),
      },
    };
  }

  @Get('public/:publicId')
  async getProfileByPublicId(
    @Param('publicId') publicId: string,
  ): Promise<{ success: boolean; data: any }> {
    const profile =
      await this.serviceProfilesService.getProfileByPublicId(publicId);
    if (!profile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }
    return {
      success: true,
      data: {
        ...profile,
        monthlyPrice: parseFloat(profile.monthlyPrice.toString()),
      },
    };
  }
}
