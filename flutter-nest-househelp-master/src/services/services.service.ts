import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
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

  private validateServicePricing(basePrice: number) {
    if (basePrice <= 0) {
      throw new BadRequestException('Service price must be positive');
    }
    if (basePrice > 10000) {
      throw new BadRequestException('Service price cannot exceed 10000');
    }
  }

  async create(createServiceDto: CreateServiceDto) {
    this.validateServicePricing(createServiceDto.basePrice);
    const service = this.servicesRepository.create(createServiceDto);
    return await this.servicesRepository.save(service);
  }

  async findAll() {
    return await this.servicesRepository.find({
      where: [
        { category: 'Cleaning' },
        { category: 'Cooking' }
      ]
    });
  }

  async getCategoryAvailability(): Promise<any[]> {
    const services = await this.servicesRepository.find({
      where: [
        { category: 'Cleaning' },
        { category: 'Cooking' }
      ]
    });
    
    // Group services by category name
    const categoryMap = new Map<string, { servicesCount: number }>();
    
    for (const service of services) {
      const categoryName = service.category || 'Unknown';
      const existing = categoryMap.get(categoryName);
      if (existing) {
        existing.servicesCount++;
      } else {
        categoryMap.set(categoryName, { servicesCount: 1 });
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
    const service = await this.findOne(id);
    if (!service) {
      throw new ForbiddenException('Service not found');
    }
    if (service.category === 'Cleaning' || service.category === 'Cooking') {
      throw new ForbiddenException('Cannot delete critical services');
    }
    await this.servicesRepository.delete(id);
    return { deleted: true };
  }
}
