import { Controller, Get, Post, Delete, Query, Body, Param, Req, UseGuards } from '@nestjs/common';
import { LocationService } from './locations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface LocationAvailabilityDto {
  lat: number;
  lng: number;
  radius?: number;
}

interface WaitlistDto {
  userId: string;
  serviceId: string;
  lat: number;
  lng: number;
  estimatedWaitTime: number;
}

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationService: LocationService) {}

  @Get('availability')
  async checkAvailability(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5.0,
  ) {
    return this.locationService.checkServiceAvailability(lat, lng, radius);
  }

  @Get('services')
  async getAvailableServices(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5.0,
  ) {
    return this.locationService.getAvailableServices(lat, lng, radius);
  }

  @Get('zones/nearby')
  async getNearbyZones(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('maxRadius') maxRadius: number = 2.0,
  ) {
    return this.locationService.findNearbyZones(lat, lng, maxRadius);
  }

  @Get('areas')
  async getServiceAreas(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    return this.locationService.getServiceAreasForLocation(lat, lng);
  }

  @UseGuards(JwtAuthGuard)
  @Post('waitlist')
  async addToWaitlist(
    @Req() req,
    @Body() waitlistDto: WaitlistDto,
  ) {
    // Use authenticated user ID from JWT token
    const userId = req.user.userId || waitlistDto.userId;
    return this.locationService.addToWaitlist(
      userId,
      waitlistDto.serviceId,
      waitlistDto.lat,
      waitlistDto.lng,
      waitlistDto.estimatedWaitTime,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('waitlist/current')
  async removeFromWaitlist(@Req() req) {
    const userId = req.user.userId;
    await this.locationService.removeFromWaitlist(userId);
    return { message: 'Successfully removed from waitlist' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('waitlist/status/:userId')
  async getWaitlistStatus(@Req() req, @Param('userId') userId: string) {
    // Allow users to only check their own waitlist status
    if (req.user.userId !== userId) {
      return { message: 'Access denied' };
    }
    return this.locationService.getWaitlistStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/:userId/location')
  async updatePreferredLocation(
    @Req() req,
    @Param('userId') userId: string,
    @Body() locationDto: LocationAvailabilityDto,
  ) {
    // Allow users to only update their own location
    if (req.user.userId !== userId) {
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
    @Req() req,
    @Param('workerId') workerId: string,
    @Body() locationDto: LocationAvailabilityDto,
  ) {
    // Allow workers to only update their own location
    if (req.user.workerId !== workerId) {
      return { message: 'Access denied' };
    }
    return this.locationService.updateWorkerLocation(
      workerId,
      locationDto.lat,
      locationDto.lng,
    );
  }

}