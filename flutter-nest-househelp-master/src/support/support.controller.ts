import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupportService, CreateTicketDto, UpdateTicketDto, CreateCommunicationLogDto } from './support.service';
import { TicketPriority, TicketStatus } from './entities/support-ticket.entity';
import { CommunicationType, CommunicationDirection } from './entities/communication-log.entity';

@Controller('admin/support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Ticket endpoints
  @Get('tickets')
  async getTickets(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
  ) {
    const filters: { status?: TicketStatus; priority?: TicketPriority } = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    return this.supportService.getTickets(filters);
  }

  @Get('tickets/:id')
  async getTicketById(@Param('id') id: string) {
    return this.supportService.getTicketById(Number(id));
  }

  @Post('tickets')
  async createTicket(@Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(dto);
  }

  @Patch('tickets/:id')
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateTicket(Number(id), dto);
  }

  @Post('tickets/:id/assign')
  async assignTicket(@Param('id') id: string, @Body('adminId') adminId: number) {
    return this.supportService.assignTicket(Number(id), adminId);
  }

  @Post('tickets/:id/resolve')
  async resolveTicket(@Param('id') id: string) {
    return this.supportService.resolveTicket(Number(id));
  }

  // Communication log endpoints
  @Get('tickets/:ticketId/communications')
  async getCommunicationLog(@Param('ticketId') ticketId: string) {
    return this.supportService.getCommunicationLog(Number(ticketId));
  }

  @Post('tickets/:ticketId/communications')
  async addCommunicationLog(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommunicationLogDto,
  ) {
    return this.supportService.addCommunicationLog(
      Number(ticketId),
      dto.direction === CommunicationDirection.INBOUND ? 1 : 1, // Default userId, should be passed in body
      null, // adminId should be passed in body
      dto,
    );
  }
}
