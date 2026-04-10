import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query('adminId') adminId?: string,
    @Query('adminEmail') adminEmail?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll({
      adminId: adminId ? parseInt(adminId, 10) : undefined,
      adminEmail,
      action,
      entityType,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(parseInt(id, 10));
  }

  @Get('filters/actions')
  async getDistinctActions() {
    const actions = await this.auditService.getDistinctActions();
    return { actions };
  }

  @Get('filters/entity-types')
  async getDistinctEntityTypes() {
    const entityTypes = await this.auditService.getDistinctEntityTypes();
    return { entityTypes };
  }
}
