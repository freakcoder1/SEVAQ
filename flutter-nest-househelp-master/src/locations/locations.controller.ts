import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { LocationService } from './locations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { JwtRequest } from '../common/types/jwt-user.type';
import { IsUUID, IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

interface LocationAvailabilityDto {
  lat: number;
  lng: number;
  radius?: number;
}

class WaitlistDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @IsNumber()
  @IsNotEmpty()
  latitude!: number;

  @IsNumber()
  @IsNotEmpty()
  longitude!: number;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsOptional()
  requestedAt?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  estimatedWaitTime?: number;
}

@Controller('locations')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(private readonly locationService: LocationService) {}

  @Get('availability')
  async checkAvailability(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5.0,
  ) {
    this.logger.log(
      `Checking availability at lat=${lat}, lng=${lng}, radius=${radius}km`,
    );

    // Validate coordinates
    this.validateCoordinates(lat, lng);

    if (radius <= 0 || radius > 100) {
      throw new BadRequestException('Radius must be between 0 and 100 km');
    }

    return this.locationService.checkServiceAvailability(lat, lng, radius);
  }

  @Get('services')
  async getAvailableServices(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5.0,
  ) {
    this.logger.log(
      `Getting available services at lat=${lat}, lng=${lng}, radius=${radius}km`,
    );

    // Validate coordinates
    this.validateCoordinates(lat, lng);

    if (radius <= 0 || radius > 100) {
      throw new BadRequestException('Radius must be between 0 and 100 km');
    }

    return this.locationService.getAvailableServices(lat, lng, radius);
  }

  @Get('zones/nearby')
  async getNearbyZones(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('maxRadius') maxRadius: number = 2.0,
  ) {
    this.logger.debug(
      `Getting nearby zones for lat=${lat}, lng=${lng}, maxRadius=${maxRadius}km`,
    );

    // Validate coordinates
    this.validateCoordinates(lat, lng);

    if (maxRadius <= 0 || maxRadius > 50) {
      throw new BadRequestException('Max radius must be between 0 and 50 km');
    }

    return this.locationService.findNearbyZones(lat, lng, maxRadius);
  }

  @Get('areas')
  async getServiceAreas(@Query('lat') lat: number, @Query('lng') lng: number) {
    this.logger.debug(`Getting service areas for lat=${lat}, lng=${lng}`);

    // Validate coordinates
    this.validateCoordinates(lat, lng);

    return this.locationService.getServiceAreasForLocation(lat, lng);
  }

  @UseGuards(JwtAuthGuard)
  @Post('waitlist')
  async addToWaitlist(@Req() req: JwtRequest, @Body() waitlistDto: WaitlistDto) {
    this.logger.log(
      `Adding user to waitlist: userId=${waitlistDto.userId}, serviceId=${waitlistDto.serviceId}`,
    );

    // Validate coordinates
    this.validateCoordinates(waitlistDto.latitude, waitlistDto.longitude);

    if (!waitlistDto.serviceId) {
      throw new BadRequestException('Service ID is required');
    }

    // Use authenticated user ID from JWT token (required since JwtAuthGuard is used)
    const userId: string = req.user.userId;
    return this.locationService.addToWaitlist(
      userId,
      waitlistDto.serviceId,
      waitlistDto.latitude,
      waitlistDto.longitude,
      waitlistDto.estimatedWaitTime ?? 0,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('waitlist/current')
  async removeFromWaitlist(@Req() req: JwtRequest) {
    const userId = req.user.userId;
    this.logger.log(`Removing user ${userId} from waitlist`);
    await this.locationService.removeFromWaitlist(userId);
    return { message: 'Successfully removed from waitlist' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('waitlist/status/:userId')
  async getWaitlistStatus(@Req() req: JwtRequest, @Param('userId') userId: string) {
    this.logger.debug(`Getting waitlist status for user: ${userId}`);

    // Allow users to only check their own waitlist status
    if (req.user.userId !== userId) {
      this.logger.warn(
        `Access denied: user ${req.user.userId} tried to access waitlist for user ${userId}`,
      );
      return { message: 'Access denied' };
    }
    return this.locationService.getWaitlistStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/:userId/location')
  async updatePreferredLocation(
    @Req() req: JwtRequest,
    @Param('userId') userId: string,
    @Body() locationDto: LocationAvailabilityDto,
  ) {
    this.logger.log(
      `Updating preferred location for user ${userId}: lat=${locationDto.lat}, lng=${locationDto.lng}`,
    );

    // Validate coordinates
    this.validateCoordinates(locationDto.lat, locationDto.lng);

    // Allow users to only update their own location
    if (req.user.userId !== userId) {
      this.logger.warn(
        `Access denied: user ${req.user.userId} tried to update location for user ${userId}`,
      );
      return { message: 'Access denied' };
    }
    return this.locationService.updatePreferredLocation(
      userId,
      locationDto.lat,
      locationDto.lng,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('worker/:workerId/location')
  async updateWorkerLocation(
    @Req() req: JwtRequest,
    @Param('workerId') workerId: number,
    @Body() locationDto: LocationAvailabilityDto,
  ) {
    this.logger.log(
      `Updating location for worker ${workerId}: lat=${locationDto.lat}, lng=${locationDto.lng}`,
    );

    // Validate coordinates
    this.validateCoordinates(locationDto.lat, locationDto.lng);

    // Allow workers to only update their own location
    if (req.user.workerId !== workerId) {
      this.logger.warn(
        `Access denied: worker ${req.user.workerId} tried to update location for worker ${workerId}`,
      );
      return { message: 'Access denied' };
    }
    return this.locationService.updateWorkerLocation(
      workerId,
      locationDto.lat,
      locationDto.lng,
    );
  }

  private validateCoordinates(lat: any, lng: any): void {
    if (
      lat === undefined ||
      lat === null ||
      lng === undefined ||
      lng === null
    ) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    // Convert to numbers if they're strings
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;

    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new BadRequestException(
        'Latitude and longitude must be valid numbers',
      );
    }

    if (latNum < -90 || latNum > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }

    if (lngNum < -180 || lngNum > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }
  }

  // Admin endpoint to update all workers to a specific location (only workers without locations)
  @UseGuards(AdminGuard)
  @Post('admin/update-worker-locations')
  async updateAllWorkerLocations(@Body() body: { lat: number; lng: number }) {
    this.logger.log(
      `Admin: Updating all worker locations to lat=${body.lat}, lng=${body.lng} (only workers without existing locations)`,
    );
    return this.locationService.updateAllWorkersToLocation(body.lat, body.lng);
  }

  // Admin endpoint to FORCE update ALL workers to a specific location (overwrites existing locations)
  @UseGuards(AdminGuard)
  @Post('admin/force-update-worker-locations')
  async forceUpdateAllWorkerLocations(
    @Body() body: { lat: number; lng: number },
  ) {
    this.logger.warn(
      `Admin: FORCE updating ALL worker locations to lat=${body.lat}, lng=${body.lng} (WARNING: will overwrite existing locations!)`,
    );
    return this.locationService.forceUpdateAllWorkersToLocation(
      body.lat,
      body.lng,
    );
  }

  // Debug endpoint to log device location
  @Get('debug/location-info')
  async debugLocationInfo(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    this.logger.log(`[DEBUG] Device location received: lat=${lat}, lng=${lng}`);

    // Validate coordinates
    this.validateCoordinates(lat, lng);

    // Get nearby zones
    const nearbyZones = await this.locationService.findNearbyZones(lat, lng, 5);

    // Get service areas
    const serviceAreas = await this.locationService.getServiceAreasForLocation(
      lat,
      lng,
    );

    // Get available workers
    const availableWorkers = await this.locationService.findAvailableWorkers(
      lat,
      lng,
      5,
    );

    return {
      deviceLocation: { lat, lng },
      nearbyZones: nearbyZones.map((z) => ({
        id: z.id,
        name: z.name,
        centerLat: z.centerLat,
        centerLng: z.centerLng,
      })),
      serviceAreas: serviceAreas.map((a) => ({
        id: a.id,
        name: a.name,
        minLat: a.minLat,
        maxLat: a.maxLat,
        minLng: a.minLng,
        maxLng: a.maxLng,
      })),
      availableWorkersCount: availableWorkers.length,
      isInServiceArea: serviceAreas.length > 0,
      message:
        serviceAreas.length > 0
          ? 'Your location is within a service area'
          : 'Your location is OUTSIDE all service areas - no workers available',
    };
  }

  // Admin endpoint to expand service area to cover a location
  @UseGuards(AdminGuard)
  @Post('admin/expand-service-area')
  async expandServiceArea(
    @Body() body: { lat: number; lng: number; paddingKm?: number },
  ) {
    this.logger.log(
      `Admin: Expanding service area to cover lat=${body.lat}, lng=${body.lng} with ${body.paddingKm || 5}km padding`,
    );
    return this.locationService.expandServiceAreaToCoverLocation(
      body.lat,
      body.lng,
      body.paddingKm || 5,
    );
  }
}
