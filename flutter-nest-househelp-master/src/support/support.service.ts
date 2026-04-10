import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SupportTicket, TicketPriority, TicketStatus } from './entities/support-ticket.entity';
import { CommunicationLog, CommunicationType, CommunicationDirection } from './entities/communication-log.entity';
import { User } from '../users/entities/user.entity';

export interface CreateTicketDto {
  userId: number;
  subject: string;
  description: string;
  priority?: TicketPriority;
}

export interface UpdateTicketDto {
  subject?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
}

export interface CreateCommunicationLogDto {
  type: CommunicationType;
  direction: CommunicationDirection;
  content: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportTicket)
    private ticketsRepository: Repository<SupportTicket>,
    @InjectRepository(CommunicationLog)
    private communicationLogsRepository: Repository<CommunicationLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Ticket methods
  async getTickets(filters?: { status?: TicketStatus; priority?: TicketPriority }): Promise<SupportTicket[]> {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }

    return this.ticketsRepository.find({
      where,
      relations: ['user', 'assignedAdmin'],
      order: { createdAt: 'DESC' },
    });
  }

  async createTicket(dto: CreateTicketDto): Promise<SupportTicket> {
    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const ticket = this.ticketsRepository.create({
      publicId: randomUUID(),
      userId: dto.userId,
      subject: dto.subject,
      description: dto.description,
      priority: dto.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
    });

    return this.ticketsRepository.save(ticket);
  }

  async updateTicket(id: number, dto: UpdateTicketDto): Promise<SupportTicket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    if (dto.subject) ticket.subject = dto.subject;
    if (dto.description) ticket.description = dto.description;
    if (dto.priority) ticket.priority = dto.priority;
    if (dto.status) {
      ticket.status = dto.status;
      if (dto.status === TicketStatus.RESOLVED && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
    }

    return this.ticketsRepository.save(ticket);
  }

  async assignTicket(id: number, adminId: number): Promise<SupportTicket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    ticket.assignedTo = adminId;
    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    return this.ticketsRepository.save(ticket);
  }

  async resolveTicket(id: number): Promise<SupportTicket> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    ticket.status = TicketStatus.RESOLVED;
    ticket.resolvedAt = new Date();

    return this.ticketsRepository.save(ticket);
  }

  async getTicketById(id: number): Promise<SupportTicket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedAdmin'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  // Communication log methods
  async getCommunicationLog(ticketId: number): Promise<CommunicationLog[]> {
    return this.communicationLogsRepository.find({
      where: { ticketId },
      relations: ['user', 'admin'],
      order: { createdAt: 'ASC' },
    });
  }

  async addCommunicationLog(
    ticketId: number,
    userId: number,
    adminId: number | null,
    dto: CreateCommunicationLogDto,
  ): Promise<CommunicationLog> {
    const ticket = await this.ticketsRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const log = this.communicationLogsRepository.create({
      ticketId,
      userId,
      adminId: adminId || undefined,
      type: dto.type,
      direction: dto.direction,
      content: dto.content,
    });

    return this.communicationLogsRepository.save(log);
  }
}
