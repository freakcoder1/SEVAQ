import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemConfigService, CreateNotificationTemplateDto, UpdateNotificationTemplateDto, CreateBusinessHoursDto, CreateServiceAreaDto, UpdateServiceAreaDto, CreatePricingRuleDto, UpdatePricingRuleDto } from './config.service';

@Controller('admin/config')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  // Notification Templates
  @Get('notification-templates')
  async getNotificationTemplates() {
    return this.configService.getNotificationTemplates();
  }

  @Patch('notification-templates/:id')
  async updateNotificationTemplate(@Param('id') id: string, @Body() dto: UpdateNotificationTemplateDto) {
    return this.configService.updateNotificationTemplate(Number(id), dto);
  }

  // Business Hours
  @Get('business-hours')
  async getBusinessHours() {
    return this.configService.getBusinessHours();
  }

  @Patch('business-hours')
  async updateBusinessHours(@Body() hours: CreateBusinessHoursDto[]) {
    return this.configService.updateBusinessHours(hours);
  }

  // Service Areas
  @Get('service-areas')
  async getServiceAreas() {
    return this.configService.getServiceAreas();
  }

  @Post('service-areas')
  async createServiceArea(@Body() dto: CreateServiceAreaDto) {
    return this.configService.createServiceArea(dto);
  }

  @Patch('service-areas/:id')
  async updateServiceArea(@Param('id') id: string, @Body() dto: UpdateServiceAreaDto) {
    return this.configService.updateServiceArea(id, dto);
  }

  @Delete('service-areas/:id')
  async deleteServiceArea(@Param('id') id: string) {
    return this.configService.deleteServiceArea(id);
  }

  // Pricing Rules
  @Get('pricing-rules')
  async getPricingRules() {
    return this.configService.getPricingRules();
  }

  @Post('pricing-rules')
  async createPricingRule(@Body() dto: CreatePricingRuleDto) {
    return this.configService.createPricingRule(dto);
  }

  @Patch('pricing-rules/:id')
  async updatePricingRule(@Param('id') id: string, @Body() dto: UpdatePricingRuleDto) {
    return this.configService.updatePricingRule(Number(id), dto);
  }

  @Delete('pricing-rules/:id')
  async deletePricingRule(@Param('id') id: string) {
    return this.configService.deletePricingRule(Number(id));
  }
}
