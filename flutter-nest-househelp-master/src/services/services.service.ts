import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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
  ) {}

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
      where: [{ category: 'Cleaning' }, { category: 'Cooking' }],
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[Service[], number]> {
    const order: any = {};
    order[sortBy || 'createdAt'] = sortOrder;

    return this.servicesRepository.findAndCount({
      where: [{ category: 'Cleaning' }, { category: 'Cooking' }],
      skip,
      take,
      order,
    });
  }

  async getCategoryAvailability(): Promise<any[]> {
    const services = await this.servicesRepository.find({
      where: [{ category: 'Cleaning' }, { category: 'Cooking' }],
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
    // Check if id is a UUID (publicId) or numeric id
    const isUUID = id.includes('-');
    return await this.servicesRepository.findOne({
      where: isUUID ? { publicId: id } : { id: parseInt(id) },
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    // Check if id is a UUID (publicId) or numeric id
    const isUUID = id.includes('-');
    const whereClause = isUUID ? { publicId: id } : { id: parseInt(id) };
    
    await this.servicesRepository.update(whereClause, updateServiceDto);
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
    // Handle both UUID (publicId) and numeric id
    const isUUID = id.includes('-');
    const whereClause = isUUID ? { publicId: id } : { id: parseInt(id) };
    await this.servicesRepository.delete(whereClause);
    return { deleted: true };
  }

  /**
   * Find a service by its category name (e.g., 'CLEANING', 'COOKING', 'MAID')
   */
  async findByCategory(category: string): Promise<Service | null> {
    // Map frontend category names to database categories
    const categoryMap: Record<string, string> = {
      'CLEANING': 'Cleaning',
      'COOKING': 'Cooking',
      'MAID': 'Cleaning', // Maid is part of cleaning
      'HOME_CLEANING': 'Cleaning',
      'COOK': 'Cooking',
    };

    const dbCategory = categoryMap[category.toUpperCase()] || category;
    
    return this.servicesRepository.findOne({
      where: { category: dbCategory },
    });
  }
}
