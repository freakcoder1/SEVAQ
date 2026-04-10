import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService, CreatePayoutDto, ProcessPayoutDto, CreateRefundDto, ProcessRefundDto } from './finance.service';
import { PayoutStatus } from './entities/payout.entity';
import { RefundStatus } from './entities/refund.entity';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Payout endpoints
  @Get('payouts')
  async getPayouts(
    @Query('status') status?: PayoutStatus,
    @Query('workerId') workerId?: number,
  ) {
    const filters: { status?: PayoutStatus; workerId?: number } = {};
    if (status) filters.status = status;
    if (workerId) filters.workerId = workerId;
    return this.financeService.getPayouts(filters);
  }

  @Get('payouts/pending')
  async getPendingPayouts() {
    return this.financeService.getPendingPayouts();
  }

  @Get('payouts/summary')
  async getPayoutSummary() {
    return this.financeService.getPayoutSummary();
  }

  @Get('payouts/:id')
  async getPayoutById(@Param('id') id: string) {
    return this.financeService.getPayoutById(Number(id));
  }

  @Post('payouts')
  async createPayout(@Body() dto: CreatePayoutDto) {
    return this.financeService.createPayout(dto);
  }

  @Patch('payouts/:id')
  async processPayout(@Param('id') id: string, @Body() dto: ProcessPayoutDto) {
    return this.financeService.processPayout(Number(id), dto);
  }

  // Refund endpoints
  @Get('refunds')
  async getRefunds(@Query('status') status?: RefundStatus) {
    const filters: { status?: RefundStatus } = {};
    if (status) filters.status = status;
    return this.financeService.getRefunds(filters);
  }

  @Get('refunds/:id')
  async getRefundById(@Param('id') id: string) {
    return this.financeService.getRefundById(Number(id));
  }

  @Post('refunds')
  async createRefund(@Body() dto: CreateRefundDto) {
    return this.financeService.createRefund(dto);
  }

  @Patch('refunds/:id')
  async processRefund(@Param('id') id: string, @Body() dto: ProcessRefundDto) {
    return this.financeService.processRefund(Number(id), dto);
  }

  // Revenue report endpoints
  @Get('reports/revenue')
  async getRevenueReport(
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    return this.financeService.generateRevenueReport(start, end);
  }

  @Get('reports/payouts')
  async getPayoutReport(
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    return this.financeService.generatePayoutReport(start, end);
  }
}
