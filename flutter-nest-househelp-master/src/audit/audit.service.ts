import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  adminId?: number;
  adminEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilterDto {
  adminId?: number;
  adminEmail?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createDto);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(filters: AuditLogFilterDto): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      adminId,
      adminEmail,
      action,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const query = this.auditLogRepository.createQueryBuilder('audit_log');

    if (adminId) {
      query.andWhere('audit_log.adminId = :adminId', { adminId });
    }

    if (adminEmail) {
      query.andWhere('audit_log.adminEmail ILIKE :adminEmail', {
        adminEmail: `%${adminEmail}%`,
      });
    }

    if (action) {
      query.andWhere('audit_log.action ILIKE :action', {
        action: `%${action}%`,
      });
    }

    if (entityType) {
      query.andWhere('audit_log.entityType = :entityType', { entityType });
    }

    if (startDate) {
      query.andWhere('audit_log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit_log.createdAt <= :endDate', { endDate });
    }

    const [data, total] = await query
      .orderBy('audit_log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({ where: { id } });
  }

  async getDistinctActions(): Promise<string[]> {
    const results = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('DISTINCT audit_log.action', 'action')
      .getRawMany();

    return results.map((r) => r.action);
  }

  async getDistinctEntityTypes(): Promise<string[]> {
    const results = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('DISTINCT audit_log.entityType', 'entityType')
      .getRawMany();

    return results.map((r) => r.entityType);
  }
}
