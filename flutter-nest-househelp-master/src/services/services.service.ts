import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) { }

  async create(createServiceDto: CreateServiceDto) {
    const service = this.servicesRepository.create(createServiceDto);
    return await this.servicesRepository.save(service);
  }

  async findAll() {
    return await this.servicesRepository.find();
  }

  async getCategoryAvailability(): Promise<any[]> {
    const services = await this.servicesRepository.find();
    
    // Group services by category
    const categoryMap = new Map<string, { servicesCount: number }>();
    
    for (const service of services) {
      const existing = categoryMap.get(service.category);
      if (existing) {
        existing.servicesCount++;
      } else {
        categoryMap.set(service.category, { servicesCount: 1 });
      }
    }
    
    // Convert to array format expected by frontend
    const result: any[] = [];
    for (const [name, data] of categoryMap) {
      result.push({
        name,
        isAvailable: true,
        availableServicesCount: data.servicesCount,
        availableWorkersCount: Math.ceil(data.servicesCount / 2), // Estimate workers based on services
      });
    }
    
    return result;
  }

  async findOne(id: string) {
    return await this.servicesRepository.findOne({ where: { id } });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.servicesRepository.update(id, updateServiceDto);
    return await this.findOne(id);
  }

  async remove(id: string) {
    await this.servicesRepository.delete(id);
    return { deleted: true };
  }
}
