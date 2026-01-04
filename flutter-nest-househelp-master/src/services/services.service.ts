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
