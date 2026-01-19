import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { SlotsService } from '../slots/slots.service';
import { User } from '../users/entities/user.entity';

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  LIMITED = 'limited',
  UNAVAILABLE = 'unavailable'
}

export interface AvailabilityCheckRequest {
  serviceId: string;
  date: string;
  timeWindow: string;
  userLat: number;
  userLng: number;
  radius?: number;
}

export interface AvailabilityCheckResult {
  status: AvailabilityStatus;
  availableCount: number;
  estimatedWaitTime?: number;
  alternativeTimeSlots?: AlternativeTimeSlot[];
}

export interface AlternativeTimeSlot {
  date: string;
  timeWindow: string;
  availableCount: number;
  estimatedWaitTime: number;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private slotsService: SlotsService,
  ) {}

  async checkAvailability(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult> {
    // 1. Find workers who offer this service
    const workers = await this.workersRepository.find({
      where: { services: { id: request.serviceId } },
      relations: ['user', 'services']
    });

    if (workers.length === 0) {
      return {
        status: AvailabilityStatus.UNAVAILABLE,
        availableCount: 0,
        estimatedWaitTime: 1440, // 24 hours in minutes
        alternativeTimeSlots: []
      };
    }

    // 2. Filter workers by location (within radius)
    const nearbyWorkers = await this.filterWorkersByLocation(workers, request.userLat, request.userLng, request.radius || 5);

    if (nearbyWorkers.length === 0) {
      return {
        status: AvailabilityStatus.UNAVAILABLE,
        availableCount: 0,
        estimatedWaitTime: 1440,
        alternativeTimeSlots: []
      };
    }

    // 3. Parse date and time window to get start and end times
    const { startTime, endTime } = this.parseTimeWindow(request.date, request.timeWindow);

    // 4. Check availability for the requested time slot
    const availableWorkers = await this.checkWorkersAvailability(nearbyWorkers, startTime, endTime);

    // 5. Determine availability status
    const availableCount = availableWorkers.length;
    let status: AvailabilityStatus;
    let estimatedWaitTime: number;

    if (availableCount >= 3) {
      status = AvailabilityStatus.AVAILABLE;
      estimatedWaitTime = 0;
    } else if (availableCount >= 1) {
      status = AvailabilityStatus.LIMITED;
      estimatedWaitTime = 15; // 15 minutes wait for limited availability
    } else {
      status = AvailabilityStatus.UNAVAILABLE;
      estimatedWaitTime = 60; // 1 hour wait for no availability
    }

    // 6. If unavailable, suggest alternative time slots
    let alternativeTimeSlots: AlternativeTimeSlot[] = [];
    if (status === AvailabilityStatus.UNAVAILABLE) {
      alternativeTimeSlots = await this.findAlternativeTimeSlots(
        nearbyWorkers,
        request.date,
        request.timeWindow,
        request.userLat,
        request.userLng
      );
    }

    return {
      status,
      availableCount,
      estimatedWaitTime,
      alternativeTimeSlots
    };
  }

  private async filterWorkersByLocation(
    workers: Worker[],
    userLat: number,
    userLng: number,
    radius: number
  ): Promise<Worker[]> {
    const nearbyWorkers: Worker[] = [];

    for (const worker of workers) {
      const user = worker.user;
      if (!user || !user.latitude || !user.longitude) continue;

      const distance = this.calculateDistance(userLat, userLng, user.latitude, user.longitude);
      if (distance <= radius) {
        nearbyWorkers.push(worker);
      }
    }

    return nearbyWorkers;
  }

  private async checkWorkersAvailability(
    workers: Worker[],
    startTime: Date,
    endTime: Date
  ): Promise<Worker[]> {
    const availableWorkers: Worker[] = [];

    for (const worker of workers) {
      const availableSlot = await this.slotsService.findAvailableSlot(worker.id, startTime, endTime);
      if (availableSlot) {
        availableWorkers.push(worker);
      }
    }

    return availableWorkers;
  }

  private parseTimeWindow(dateString: string, timeWindow: string): { startTime: Date; endTime: Date } {
    const date = new Date(dateString);
    
    let startHour: number;
    let endHour: number;

    switch (timeWindow.toLowerCase()) {
      case 'morning':
        startHour = 8;
        endHour = 12;
        break;
      case 'afternoon':
        startHour = 12;
        endHour = 17;
        break;
      case 'evening':
        startHour = 17;
        endHour = 21;
        break;
      default:
        startHour = 8;
        endHour = 12;
    }

    const startTime = new Date(date);
    startTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);

    return { startTime, endTime };
  }

  private async findAlternativeTimeSlots(
    workers: Worker[],
    dateStr: string,
    originalTimeWindow: string,
    userLat: number,
    userLng: number
  ): Promise<AlternativeTimeSlot[]> {
    const alternativeSlots: AlternativeTimeSlot[] = [];
    const date = new Date(dateStr);

    // Check different time windows on the same day
    const timeWindows = ['morning', 'afternoon', 'evening'];
    const currentIndex = timeWindows.indexOf(originalTimeWindow.toLowerCase());

    // Check other time windows in order
    for (let i = 1; i <= timeWindows.length; i++) {
      const nextIndex = (currentIndex + i) % timeWindows.length;
      const timeWindow = timeWindows[nextIndex];

      const { startTime, endTime } = this.parseTimeWindow(dateStr, timeWindow);
      const availableWorkers = await this.checkWorkersAvailability(workers, startTime, endTime);

      if (availableWorkers.length > 0) {
        alternativeSlots.push({
          date: dateStr,
          timeWindow: timeWindow,
          availableCount: availableWorkers.length,
          estimatedWaitTime: availableWorkers.length >= 3 ? 0 : 15
        });
      }

      // Limit to 3 alternatives
      if (alternativeSlots.length >= 3) break;
    }

    return alternativeSlots;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}