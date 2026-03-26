import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroZone } from './entities/micro_zone.entity';
import { ServiceArea } from './entities/service_area.entity';
import { Waitlist } from './entities/waitlist.entity';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly DEFAULT_RADIUS_KM = 5;

  constructor(
    @InjectRepository(MicroZone)
    private readonly microZoneRepository: Repository<MicroZone>,
    @InjectRepository(ServiceArea)
    private readonly serviceAreaRepository: Repository<ServiceArea>,
    @InjectRepository(Waitlist)
    private readonly waitlistRepository: Repository<Waitlist>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Find nearby micro-zones
  async findNearbyZones(
    lat: number,
    lng: number,
    maxRadiusKm: number = 2,
  ): Promise<MicroZone[]> {
    this.logger.debug(
      `Finding nearby zones for coordinates: lat=${lat}, lng=${lng}, maxRadius=${maxRadiusKm}km`,
    );

    try {
      const zones = await this.microZoneRepository.find({
        where: { isActive: true },
      });

      this.logger.debug(`Found ${zones.length} total active zones`);

      const nearbyZones = zones.filter((zone) => {
        const distance = this.calculateDistance(
          lat,
          lng,
          zone.centerLat,
          zone.centerLng,
        );
        const isNearby = distance <= zone.radiusKm + maxRadiusKm;
        this.logger.debug(
          `Zone ${zone.name}: distance=${distance.toFixed(2)}km, isNearby=${isNearby}`,
        );
        return isNearby;
      });

      this.logger.log(
        `Returning ${nearbyZones.length} nearby zones for lat=${lat}, lng=${lng}`,
      );
      return nearbyZones;
    } catch (error) {
      this.logger.error(
        `Error finding nearby zones: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Check service availability in area
  async checkServiceAvailability(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ): Promise<{
    isAvailable: boolean;
    workerCount: number;
    estimatedWaitTime: number;
    nearbyZones: MicroZone[];
    highDemand: boolean;
  }> {
    this.logger.log(
      `Checking service availability for lat=${lat}, lng=${lng}, radius=${radiusKm}km`,
    );

    try {
      const nearbyWorkers = await this.findAvailableWorkers(lat, lng, radiusKm);
      const nearbyZones = await this.findNearbyZones(lat, lng);

      this.logger.debug(
        `Found ${nearbyWorkers.length} workers and ${nearbyZones.length} zones`,
      );

      const workerCount = nearbyWorkers.length;
      const highDemand = workerCount === 0;

      // Calculate estimated wait time based on worker density
      let estimatedWaitTime = 0;
      if (workerCount > 0) {
        estimatedWaitTime = Math.max(15, Math.floor(60 / workerCount)); // 15-60 minutes
      } else {
        estimatedWaitTime = 120; // 2 hours waitlist
      }

      const result = {
        isAvailable: workerCount > 0,
        workerCount,
        estimatedWaitTime,
        nearbyZones,
        highDemand,
      };

      this.logger.log(
        `Service availability result: isAvailable=${result.isAvailable}, workerCount=${workerCount}, estimatedWaitTime=${estimatedWaitTime}min`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error checking service availability: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Find available workers in radius
  async findAvailableWorkers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<Worker[]> {
    this.logger.debug(
      `Finding available workers for lat=${lat}, lng=${lng}, radius=${radiusKm}km`,
    );

    try {
      const workers = await this.workerRepository.find({
        where: { isActive: true },
        relations: ['user', 'services'],
      });

      this.logger.debug(`Found ${workers.length} total active workers`);

      const availableWorkers = workers.filter((worker) => {
        // Fallback to user location if worker current location is not set
        const workerLat = worker.currentLat || worker.latitude;
        const workerLng = worker.currentLng || worker.longitude;

        if (!workerLat || !workerLng) {
          this.logger.debug(
            `Worker ${worker.id}: no location data available (neither current nor base location)`,
          );
          return false;
        }

        const distance = this.calculateDistance(lat, lng, workerLat, workerLng);
        const effectiveRadius = Math.min(
          radiusKm,
          worker.serviceRadiusKm || 10,
        ); // Default 10km if not set
        const isAvailable = distance <= effectiveRadius;

        this.logger.debug(
          `Worker ${worker.id}: distance=${distance.toFixed(2)}km, effectiveRadius=${effectiveRadius}km, available=${isAvailable}`,
        );
        return isAvailable;
      });

      this.logger.log(`Returning ${availableWorkers.length} available workers`);
      return availableWorkers;
    } catch (error) {
      this.logger.error(
        `Error finding available workers: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Get available services in location
  async getAvailableServices(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ): Promise<any[]> {
    this.logger.log(
      `Getting available services for lat=${lat}, lng=${lng}, radius=${radiusKm}km`,
    );

    try {
      const workers = await this.findAvailableWorkers(lat, lng, radiusKm);
      this.logger.debug(`Found ${workers.length} workers in area`);

      // Get unique services from available workers (only Cleaning and Cooking categories)
      const services = new Map();
      workers.forEach((worker) => {
        worker.services?.forEach((service) => {
          if (
            !services.has(service.id) &&
            (service.category === 'Cleaning' || service.category === 'Cooking')
          ) {
            services.set(service.id, service);
            this.logger.debug(`Found service: ${service.id} - ${service.name}`);
          }
        });
      });

      const result = Array.from(services.values());
      this.logger.log(`Returning ${result.length} unique services`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting available services: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Add user to waitlist
  async addToWaitlist(
    userId: string,
    serviceId: string,
    lat: number,
    lng: number,
    estimatedWaitTime: number,
  ): Promise<Waitlist> {
    this.logger.log(
      `Adding user ${userId} to waitlist for service ${serviceId} at lat=${lat}, lng=${lng}`,
    );

    try {
      const waitlistEntry = this.waitlistRepository.create({
        userId,
        serviceId,
        latitude: lat,
        longitude: lng,
        requestedAt: new Date(),
        status: 'pending',
        estimatedWaitTime,
      });

      const saved = await this.waitlistRepository.save(waitlistEntry);
      this.logger.log(`Successfully added to waitlist with ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `Error adding to waitlist: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Get waitlist status for user
  async getWaitlistStatus(userId: string): Promise<Waitlist[]> {
    this.logger.debug(`Getting waitlist status for user: ${userId}`);

    try {
      const entries = await this.waitlistRepository.find({
        where: { userId, status: 'pending' },
        order: { requestedAt: 'DESC' },
      });

      this.logger.debug(
        `Found ${entries.length} pending waitlist entries for user ${userId}`,
      );
      return entries;
    } catch (error) {
      this.logger.error(
        `Error getting waitlist status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Cancel waitlist entry
  async cancelWaitlist(waitlistId: string): Promise<void> {
    this.logger.log(`Cancelling waitlist entry: ${waitlistId}`);

    try {
      await this.waitlistRepository.update(waitlistId, { status: 'cancelled' });
      this.logger.log(`Successfully cancelled waitlist entry: ${waitlistId}`);
    } catch (error) {
      this.logger.error(
        `Error cancelling waitlist entry: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Remove user from waitlist
  async removeFromWaitlist(userId: string): Promise<void> {
    this.logger.log(`Removing user ${userId} from waitlist`);

    try {
      const result = await this.waitlistRepository.update(
        { userId, status: 'pending' },
        { status: 'cancelled' },
      );

      this.logger.log(
        `Removed ${result.affected || 0} waitlist entries for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error removing from waitlist: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Update user's preferred location
  async updatePreferredLocation(
    userId: string,
    lat: number,
    lng: number,
  ): Promise<User> {
    this.logger.log(
      `Updating preferred location for user ${userId}: lat=${lat}, lng=${lng}`,
    );

    try {
      const user = await this.userRepository.findOne({ where: { publicId: userId } });
      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Update location history
      const locationHistory = user.locationHistory || [];
      locationHistory.push({
        lat,
        lng,
        timestamp: new Date(),
        accuracy: 10, // Default accuracy
      });

      // Keep only last 10 location entries
      if (locationHistory.length > 10) {
        locationHistory.splice(0, locationHistory.length - 10);
      }

      user.preferredLat = lat;
      user.preferredLng = lng;
      user.hasCompletedLocationSetup = true;
      user.locationHistory = locationHistory;

      const saved = await this.userRepository.save(user);
      this.logger.log(
        `Successfully updated preferred location for user ${userId}`,
      );
      return saved;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error updating preferred location: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Update worker's current location
  async updateWorkerLocation(
    workerId: number,
    lat: number,
    lng: number,
  ): Promise<Worker> {
    this.logger.log(
      `Updating current location for worker ${workerId}: lat=${lat}, lng=${lng}`,
    );

    try {
      const worker = await this.workerRepository.findOne({
        where: { id: workerId },
      });
      if (!worker) {
        this.logger.warn(`Worker not found: ${workerId}`);
        throw new NotFoundException(`Worker with ID ${workerId} not found`);
      }

      // Validate coordinates
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        this.logger.warn(
          `Invalid coordinates received: lat=${lat}, lng=${lng}`,
        );
        throw new BadRequestException(
          'Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180',
        );
      }

      worker.currentLat = lat;
      worker.currentLng = lng;
      worker.lastLocationUpdate = new Date();

      const saved = await this.workerRepository.save(worker);
      this.logger.log(
        `Successfully updated current location for worker ${workerId}`,
      );
      return saved;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      this.logger.error(
        `Error updating worker location: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Get service areas covering a location
  async getServiceAreasForLocation(
    lat: number,
    lng: number,
  ): Promise<ServiceArea[]> {
    this.logger.debug(
      `Getting service areas for location: lat=${lat}, lng=${lng}`,
    );

    try {
      const areas = await this.serviceAreaRepository.find({
        where: { isActive: true },
      });

      // First try to find exact covering areas
      const coveringAreas = areas.filter((area) => {
        const covers =
          lat >= area.minLat &&
          lat <= area.maxLat &&
          lng >= area.minLng &&
          lng <= area.maxLng;
        this.logger.debug(
          `Area ${area.name}: minLat=${area.minLat}, maxLat=${area.maxLat}, minLng=${area.minLng}, maxLng=${area.maxLng}, covers=${covers}`,
        );
        return covers;
      });

      // If no exact coverage, find nearest areas as fallback
      if (coveringAreas.length === 0) {
        this.logger.warn(
          `No exact service area coverage found for lat=${lat}, lng=${lng}. Finding nearest areas...`,
        );

        const nearestAreas = areas
          .map((area) => {
            const centerLat = (area.minLat + area.maxLat) / 2;
            const centerLng = (area.minLng + area.maxLng) / 2;
            const distance = this.calculateDistance(
              lat,
              lng,
              centerLat,
              centerLng,
            );
            return { area, distance };
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3); // Get 3 nearest areas

        this.logger.log(
          `Found ${nearestAreas.length} nearest service areas as fallback`,
        );
        return nearestAreas.map((item) => item.area);
      }

      this.logger.log(
        `Found ${coveringAreas.length} service areas covering lat=${lat}, lng=${lng}`,
      );
      return coveringAreas;
    } catch (error) {
      this.logger.error(
        `Error getting service areas: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Create a micro-zone
  async createMicroZone(data: {
    name: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    zoneType: string;
    boundaries?: any;
  }): Promise<MicroZone> {
    this.logger.log(`Creating micro-zone: ${data.name}`);

    try {
      // Validate zone data
      if (data.centerLat < -90 || data.centerLat > 90) {
        throw new BadRequestException('Invalid center latitude');
      }
      if (data.centerLng < -180 || data.centerLng > 180) {
        throw new BadRequestException('Invalid center longitude');
      }
      if (data.radiusKm <= 0 || data.radiusKm > 100) {
        throw new BadRequestException(
          'Invalid radius: must be between 0 and 100 km',
        );
      }

      const zone = this.microZoneRepository.create(data);
      const saved = await this.microZoneRepository.save(zone);
      this.logger.log(
        `Successfully created micro-zone: ${saved.id} - ${data.name}`,
      );
      return saved;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Error creating micro-zone: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Create a service area
  async createServiceArea(data: {
    name: string;
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    coverageMap?: any;
  }): Promise<ServiceArea> {
    this.logger.log(`Creating service area: ${data.name}`);

    try {
      // Validate area bounds
      if (data.minLat > data.maxLat || data.minLng > data.maxLng) {
        throw new BadRequestException(
          'Invalid bounds: min values must be less than max values',
        );
      }

      const area = this.serviceAreaRepository.create(data);
      const saved = await this.serviceAreaRepository.save(area);
      this.logger.log(
        `Successfully created service area: ${saved.id} - ${data.name}`,
      );
      return saved;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Error creating service area: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Set default location for all workers (useful for seeding/testing)
  // Only updates workers WITHOUT existing locations
  async updateAllWorkersToLocation(
    lat: number,
    lng: number,
  ): Promise<{ updated: number; errors: number }> {
    this.logger.log(
      `Setting default location (lat=${lat}, lng=${lng}) for all workers without location`,
    );

    let updated = 0;
    let errors = 0;

    try {
      const workers = await this.workerRepository.find({
        where: { isActive: true },
      });

      this.logger.debug(`Found ${workers.length} active workers to check`);

      for (const worker of workers) {
        if (!worker.currentLat || !worker.currentLng) {
          try {
            worker.currentLat = lat;
            worker.currentLng = lng;
            worker.lastLocationUpdate = new Date();
            await this.workerRepository.save(worker);
            updated++;
            this.logger.debug(
              `Updated worker ${worker.id} to default location`,
            );
          } catch (error) {
            errors++;
            this.logger.error(
              `Failed to update worker ${worker.id}: ${error.message}`,
            );
          }
        }
      }

      this.logger.log(
        `Worker location update complete: ${updated} updated, ${errors} errors`,
      );
      return { updated, errors };
    } catch (error) {
      this.logger.error(
        `Error updating all workers: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Force update ALL workers to a specific location (ignores existing locations)
  async forceUpdateAllWorkersToLocation(
    lat: number,
    lng: number,
  ): Promise<{ updated: number; errors: number }> {
    this.logger.warn(
      `FORCE updating ALL workers to location (lat=${lat}, lng=${lng}) - existing locations will be overwritten!`,
    );

    let updated = 0;
    let errors = 0;

    try {
      const workers = await this.workerRepository.find({
        where: { isActive: true },
      });

      this.logger.debug(
        `Found ${workers.length} active workers to forcefully update`,
      );

      for (const worker of workers) {
        try {
          const oldLat = worker.currentLat;
          const oldLng = worker.currentLng;
          worker.currentLat = lat;
          worker.currentLng = lng;
          worker.lastLocationUpdate = new Date();
          await this.workerRepository.save(worker);
          updated++;
          this.logger.log(
            `Force updated worker ${worker.id}: (${oldLat}, ${oldLng}) -> (${lat}, ${lng})`,
          );
        } catch (error) {
          errors++;
          this.logger.error(
            `Failed to force update worker ${worker.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `FORCE worker location update complete: ${updated} updated, ${errors} errors`,
      );
      return { updated, errors };
    } catch (error) {
      this.logger.error(
        `Error force updating all workers: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Update service area bounds
  async updateServiceAreaBounds(
    areaId: string,
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
  ): Promise<ServiceArea> {
    this.logger.log(
      `Updating service area ${areaId} bounds: minLat=${minLat}, maxLat=${maxLat}, minLng=${minLng}, maxLng=${maxLng}`,
    );

    try {
      const area = await this.serviceAreaRepository.findOne({
        where: { id: areaId },
      });
      if (!area) {
        this.logger.warn(`Service area not found: ${areaId}`);
        throw new NotFoundException(`Service area with ID ${areaId} not found`);
      }

      // Validate area bounds
      if (minLat > maxLat || minLng > maxLng) {
        throw new BadRequestException(
          'Invalid bounds: min values must be less than max values',
        );
      }

      area.minLat = minLat;
      area.maxLat = maxLat;
      area.minLng = minLng;
      area.maxLng = maxLng;

      const saved = await this.serviceAreaRepository.save(area);
      this.logger.log(`Successfully updated service area ${areaId} bounds`);
      return saved;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      this.logger.error(
        `Error updating service area bounds: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Expand service area to cover a specific location
  async expandServiceAreaToCoverLocation(
    lat: number,
    lng: number,
    paddingKm: number = 5,
  ): Promise<ServiceArea> {
    this.logger.log(
      `Expanding service area to cover location (${lat}, ${lng}) with ${paddingKm}km padding`,
    );

    try {
      // Find the service area (or create one if none exists)
      let area = await this.serviceAreaRepository.findOne({
        where: { isActive: true },
      });

      if (!area) {
        this.logger.log('No active service area found, creating one');
        area = await this.createServiceArea({
          name: 'Auto-expanded Area',
          minLat: lat - 0.1,
          maxLat: lat + 0.1,
          minLng: lng - 0.1,
          maxLng: lng + 0.1,
        });
        this.logger.log(`Created new service area: ${area.id}`);
        return area;
      }

      // Calculate padding in degrees (approximate)
      const latPadding = paddingKm / 111; // ~111km per degree latitude
      const lngPadding = paddingKm / (111 * Math.cos(this.deg2rad(lat)));

      const newMinLat = Math.min(area.minLat, lat - latPadding);
      const newMaxLat = Math.max(area.maxLat, lat + latPadding);
      const newMinLng = Math.min(area.minLng, lng - lngPadding);
      const newMaxLng = Math.max(area.maxLng, lng + lngPadding);

      area.minLat = newMinLat;
      area.maxLat = newMaxLat;
      area.minLng = newMinLng;
      area.maxLng = newMaxLng;

      const saved = await this.serviceAreaRepository.save(area);
      this.logger.log(
        `Expanded service area ${area.id} to cover (${lat}, ${lng}). New bounds: minLat=${newMinLat}, maxLat=${newMaxLat}, minLng=${newMinLng}, maxLng=${newMaxLng}`,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `Error expanding service area: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
