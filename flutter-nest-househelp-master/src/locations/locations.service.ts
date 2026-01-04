import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroZone } from './entities/micro_zone.entity';
import { ServiceArea } from './entities/service_area.entity';
import { Waitlist } from './entities/waitlist.entity';
import { Worker } from '../workers/entities/worker.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LocationService {
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
    ) { }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const dLat = this.deg2rad(lat2 - lat1);
        const dLng = this.deg2rad(lng2 - lng1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return this.EARTH_RADIUS_KM * c;
    }

    deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    // Find nearby micro-zones
    async findNearbyZones(lat: number, lng: number, maxRadiusKm: number = 2): Promise<MicroZone[]> {
        const zones = await this.microZoneRepository.find({
            where: { isActive: true },
        });

        return zones.filter(zone => {
            const distance = this.calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
            return distance <= (zone.radiusKm + maxRadiusKm);
        });
    }

    // Check service availability in area
    async checkServiceAvailability(lat: number, lng: number, radiusKm: number = 5): Promise<{
        isAvailable: boolean;
        workerCount: number;
        estimatedWaitTime: number;
        nearbyZones: MicroZone[];
        highDemand: boolean;
    }> {
        const nearbyWorkers = await this.findAvailableWorkers(lat, lng, radiusKm);
        const nearbyZones = await this.findNearbyZones(lat, lng);
        
        const workerCount = nearbyWorkers.length;
        const highDemand = workerCount === 0;
        
        // Calculate estimated wait time based on worker density
        let estimatedWaitTime = 0;
        if (workerCount > 0) {
            estimatedWaitTime = Math.max(15, Math.floor(60 / workerCount)); // 15-60 minutes
        } else {
            estimatedWaitTime = 120; // 2 hours waitlist
        }

        return {
            isAvailable: workerCount > 0,
            workerCount,
            estimatedWaitTime,
            nearbyZones,
            highDemand,
        };
    }

    // Find available workers in radius
    async findAvailableWorkers(lat: number, lng: number, radiusKm: number): Promise<Worker[]> {
        const workers = await this.workerRepository.find({
            where: { isActive: true },
            relations: ['user'],
        });

        return workers.filter(worker => {
            if (!worker.currentLat || !worker.currentLng) return false;
            
            const distance = this.calculateDistance(lat, lng, worker.currentLat!, worker.currentLng!);
            return distance <= Math.min(radiusKm, worker.serviceRadiusKm);
        });
    }

    // Get available services in location
    async getAvailableServices(lat: number, lng: number, radiusKm: number = 5): Promise<any[]> {
        const workers = await this.findAvailableWorkers(lat, lng, radiusKm);
        
        // Get unique services from available workers
        const services = new Set();
        workers.forEach(worker => {
            worker.services?.forEach(service => {
                services.add(service);
            });
        });

        return Array.from(services);
    }

    // Add user to waitlist
    async addToWaitlist(userId: string, serviceId: string, lat: number, lng: number, estimatedWaitTime: number): Promise<Waitlist> {
        const waitlistEntry = this.waitlistRepository.create({
            userId,
            serviceId,
            latitude: lat,
            longitude: lng,
            requestedAt: new Date(),
            status: 'pending',
            estimatedWaitTime,
        });

        return await this.waitlistRepository.save(waitlistEntry);
    }

    // Get waitlist status for user
    async getWaitlistStatus(userId: string): Promise<Waitlist[]> {
        return await this.waitlistRepository.find({
            where: { userId, status: 'pending' },
            order: { requestedAt: 'DESC' },
        });
    }

    // Cancel waitlist entry
    async cancelWaitlist(waitlistId: string): Promise<void> {
        await this.waitlistRepository.update(waitlistId, { status: 'cancelled' });
    }

    // Remove user from waitlist
    async removeFromWaitlist(userId: string): Promise<void> {
        await this.waitlistRepository.update(
            { userId, status: 'pending' },
            { status: 'cancelled' }
        );
    }

    // Update user's preferred location
    async updatePreferredLocation(userId: string, lat: number, lng: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
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

        return await this.userRepository.save(user);
    }

    // Update worker's current location
    async updateWorkerLocation(workerId: string, lat: number, lng: number): Promise<Worker> {
        const worker = await this.workerRepository.findOne({ where: { id: workerId } });
        if (!worker) {
            throw new Error('Worker not found');
        }

        worker.currentLat = lat;
        worker.currentLng = lng;
        worker.lastLocationUpdate = new Date();

        return await this.workerRepository.save(worker);
    }

    // Get service areas covering a location
    async getServiceAreasForLocation(lat: number, lng: number): Promise<ServiceArea[]> {
        const areas = await this.serviceAreaRepository.find({
            where: { isActive: true },
        });

        return areas.filter(area => {
            return lat >= area.minLat && lat <= area.maxLat &&
                   lng >= area.minLng && lng <= area.maxLng;
        });
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
        const zone = this.microZoneRepository.create(data);
        return await this.microZoneRepository.save(zone);
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
        const area = this.serviceAreaRepository.create(data);
        return await this.serviceAreaRepository.save(area);
    }
}