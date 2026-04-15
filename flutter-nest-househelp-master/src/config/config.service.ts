import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { BusinessHours } from './entities/business-hours.entity';
import { PricingRule } from './entities/pricing-rule.entity';
import { ServiceArea } from '../locations/entities/service_area.entity';

export interface CreateNotificationTemplateDto {
  name: string;
  type: string;
  channel: string;
  subject?: string;
  body: string;
  variables?: string[];
  isActive?: boolean;
}

export interface UpdateNotificationTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface CreateBusinessHoursDto {
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  isClosed?: boolean;
}

export interface CreateServiceAreaDto {
  name: string;
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  isActive?: boolean;
}

export interface UpdateServiceAreaDto {
  name?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  isActive?: boolean;
}

export interface CreatePricingRuleDto {
  serviceId?: number;
  dayOfWeek?: number;
  timeSlot?: string;
  multiplier?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export interface UpdatePricingRuleDto {
  serviceId?: number;
  dayOfWeek?: number;
  timeSlot?: string;
  multiplier?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private notificationTemplatesRepository: Repository<NotificationTemplate>,
    @InjectRepository(BusinessHours)
    private businessHoursRepository: Repository<BusinessHours>,
    @InjectRepository(ServiceArea)
    private serviceAreasRepository: Repository<ServiceArea>,
    @InjectRepository(PricingRule)
    private pricingRulesRepository: Repository<PricingRule>,
  ) {}

  // Notification Templates
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    return this.notificationTemplatesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateNotificationTemplate(id: number, dto: UpdateNotificationTemplateDto): Promise<NotificationTemplate> {
    const template = await this.notificationTemplatesRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Notification template with ID ${id} not found`);
    }
    Object.assign(template, dto);
    return this.notificationTemplatesRepository.save(template);
  }

  // Business Hours
  async getBusinessHours(): Promise<BusinessHours[]> {
    return this.businessHoursRepository.find({ order: { dayOfWeek: 'ASC' } });
  }

  async updateBusinessHours(hours: CreateBusinessHoursDto[]): Promise<BusinessHours[]> {
    const results: BusinessHours[] = [];
    for (const hourDto of hours) {
      let hours = await this.businessHoursRepository.findOne({ where: { dayOfWeek: hourDto.dayOfWeek } });
      if (!hours) {
        hours = this.businessHoursRepository.create(hourDto);
      } else {
        Object.assign(hours, hourDto);
      }
      results.push(await this.businessHoursRepository.save(hours));
    }
    return results;
  }

  // Service Areas
  async getServiceAreas(): Promise<ServiceArea[]> {
    return this.serviceAreasRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createServiceArea(dto: CreateServiceAreaDto): Promise<ServiceArea> {
    const area = this.serviceAreasRepository.create(dto);
    return this.serviceAreasRepository.save(area);
  }

  async updateServiceArea(id: string, dto: UpdateServiceAreaDto): Promise<ServiceArea> {
    const area = await this.serviceAreasRepository.findOne({ where: { id } });
    if (!area) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }
    Object.assign(area, dto);
    return this.serviceAreasRepository.save(area);
  }

  async deleteServiceArea(id: string): Promise<void> {
    const area = await this.serviceAreasRepository.findOne({ where: { id } });
    if (!area) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }
    await this.serviceAreasRepository.remove(area);
  }

  // Pricing Rules
  async getPricingRules(): Promise<PricingRule[]> {
    return this.pricingRulesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createPricingRule(dto: CreatePricingRuleDto): Promise<PricingRule> {
    const rule = this.pricingRulesRepository.create(dto);
    return this.pricingRulesRepository.save(rule);
  }

  async updatePricingRule(id: number, dto: UpdatePricingRuleDto): Promise<PricingRule> {
    const rule = await this.pricingRulesRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Pricing rule with ID ${id} not found`);
    }
    Object.assign(rule, dto);
    return this.pricingRulesRepository.save(rule);
  }

  async deletePricingRule(id: number): Promise<void> {
    const rule = await this.pricingRulesRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Pricing rule with ID ${id} not found`);
    }
    await this.pricingRulesRepository.remove(rule);
  }
}
