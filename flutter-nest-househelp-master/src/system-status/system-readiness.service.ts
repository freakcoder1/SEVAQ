import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { SystemReadinessDto } from './dto/system-readiness.dto';

@Injectable()
export class SystemReadinessService {
  constructor(
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async checkSystemReadiness(): Promise<SystemReadinessDto> {
    // Get worker statistics
    const workerCount = await this.workerRepository.count({
      where: { isActive: true },
    });

    const workersWithLocation = await this.workerRepository.count({
      where: {
        isActive: true,
        latitude: Not(IsNull()),
        longitude: Not(IsNull()),
      },
    });

    // Get service statistics
    const serviceCount = await this.serviceRepository.count();

    // Check if workers are properly mapped to services
    const workersWithServices = await this.workerRepository.count({
      where: {
        isActive: true,
      },
      relations: ['services'],
    });

    // Determine readiness status
    const reasons: string[] = [];
    let isReady = true;

    if (workerCount === 0) {
      isReady = false;
      reasons.push('No active workers available');
    } else if (workersWithLocation === 0) {
      isReady = false;
      reasons.push('No workers with location data available');
    }

    if (serviceCount === 0) {
      isReady = false;
      reasons.push('No services available');
    }

    if (workersWithServices === 0) {
      isReady = false;
      reasons.push('No workers are mapped to services');
    }

    return {
      isReady,
      reasons,
      workerCount,
      serviceCount,
      workersWithLocation,
    };
  }
}
