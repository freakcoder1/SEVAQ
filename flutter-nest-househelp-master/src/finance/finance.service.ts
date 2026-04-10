import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { randomUUID } from 'crypto';
import { Payout, PayoutStatus } from './entities/payout.entity';
import { Refund, RefundStatus } from './entities/refund.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';

export interface CreatePayoutDto {
  workerId: number;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}

export interface ProcessPayoutDto {
  status: PayoutStatus;
  transactionId?: string;
}

export interface CreateRefundDto {
  bookingId: number;
  amount: number;
  reason: string;
  requestedBy?: number;
}

export interface ProcessRefundDto {
  status: RefundStatus;
  approvedBy?: number;
}

export interface RevenueReportDto {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  revenueByService: { service: string; revenue: number; count: number }[];
  revenueByWorker: { worker: string; revenue: number; count: number }[];
  totalPayouts: number;
  netRevenue: number;
}

export interface PayoutReportDto {
  startDate: string;
  endDate: string;
  totalPayouts: number;
  totalAmount: number;
  payoutsByStatus: { status: string; count: number; amount: number }[];
  payouts: { id: string; worker: string; amount: number; status: string; processedAt: Date }[];
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(Payout)
    private payoutsRepository: Repository<Payout>,
    @InjectRepository(Refund)
    private refundsRepository: Repository<Refund>,
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Payout methods
  async getPendingPayouts(): Promise<Payout[]> {
    return this.payoutsRepository.find({
      where: { status: PayoutStatus.PENDING },
      relations: ['worker', 'worker.user'],
      order: { requestedAt: 'ASC' },
    });
  }

  async getPayouts(filters?: { status?: PayoutStatus; workerId?: number }): Promise<Payout[]> {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.workerId) {
      where.workerId = filters.workerId;
    }

    return this.payoutsRepository.find({
      where,
      relations: ['worker', 'worker.user'],
      order: { requestedAt: 'DESC' },
    });
  }

  async createPayout(dto: CreatePayoutDto): Promise<Payout> {
    const worker = await this.workersRepository.findOne({ where: { id: dto.workerId } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${dto.workerId} not found`);
    }

    const payout = this.payoutsRepository.create({
      publicId: randomUUID(),
      workerId: dto.workerId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
      status: PayoutStatus.PENDING,
    });

    return this.payoutsRepository.save(payout);
  }

  async processPayout(id: number, dto: ProcessPayoutDto): Promise<Payout> {
    const payout = await this.payoutsRepository.findOne({ where: { id } });
    if (!payout) {
      throw new NotFoundException(`Payout with ID ${id} not found`);
    }

    payout.status = dto.status;
    if (dto.transactionId) {
      payout.transactionId = dto.transactionId;
    }
    payout.processedAt = new Date();

    return this.payoutsRepository.save(payout);
  }

  async getPayoutById(id: number): Promise<Payout> {
    const payout = await this.payoutsRepository.findOne({
      where: { id },
      relations: ['worker', 'worker.user'],
    });
    if (!payout) {
      throw new NotFoundException(`Payout with ID ${id} not found`);
    }
    return payout;
  }

  async getPayoutSummary(): Promise<{ totalPending: number; totalPaidThisMonth: number }> {
    const pendingPayouts = await this.payoutsRepository.find({
      where: { status: PayoutStatus.PENDING },
    });
    const totalPending = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const paidThisMonth = await this.payoutsRepository.find({
      where: {
        status: PayoutStatus.COMPLETED,
        processedAt: Between(startOfMonth, new Date()),
      },
    });
    const totalPaidThisMonth = paidThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);

    return { totalPending, totalPaidThisMonth };
  }

  // Refund methods
  async getRefunds(filters?: { status?: RefundStatus }): Promise<Refund[]> {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.refundsRepository.find({
      where,
      relations: ['booking', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async createRefund(dto: CreateRefundDto): Promise<Refund> {
    const booking = await this.bookingsRepository.findOne({ where: { id: String(dto.bookingId) } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    const refund = this.refundsRepository.create({
      booking: { id: dto.bookingId } as any,
      user: { id: booking.userId } as any,
      amount: dto.amount,
      reason: dto.reason,
      requestedBy: dto.requestedBy,
      status: RefundStatus.PENDING,
    });

    return this.refundsRepository.save(refund);
  }

  async processRefund(id: number, dto: ProcessRefundDto): Promise<Refund> {
    const refund = await this.refundsRepository.findOne({ where: { id } });
    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }

    refund.status = dto.status;
    if (dto.approvedBy !== undefined) {
      refund.approvedBy = dto.approvedBy;
    }
    refund.processedAt = new Date();

    return this.refundsRepository.save(refund);
  }

  async getRefundById(id: number): Promise<Refund> {
    const refund = await this.refundsRepository.findOne({
      where: { id },
      relations: ['booking', 'user'],
    });
    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }
    return refund;
  }

  // Revenue report methods
  async generateRevenueReport(startDate: string, endDate: string): Promise<RevenueReportDto> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get total revenue and bookings
    const bookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.date BETWEEN :startDate AND :endDate', {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['completed', 'confirmed', 'in_progress'],
      })
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.worker', 'worker')
      .leftJoinAndSelect('worker.user', 'workerUser')
      .getMany();

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalBookings = bookings.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Revenue by service
    const revenueByServiceMap = new Map<string, { revenue: number; count: number }>();
    bookings.forEach((b) => {
      const serviceName = b.service?.name || 'Unknown';
      const existing = revenueByServiceMap.get(serviceName) || { revenue: 0, count: 0 };
      existing.revenue += Number(b.amount);
      existing.count += 1;
      revenueByServiceMap.set(serviceName, existing);
    });

    const revenueByService = Array.from(revenueByServiceMap.entries()).map(([service, data]) => ({
      service,
      revenue: data.revenue,
      count: data.count,
    }));

    // Revenue by worker
    const revenueByWorkerMap = new Map<string, { revenue: number; count: number }>();
    bookings.forEach((b) => {
      const workerName = b.worker?.user
        ? `${b.worker.user.firstName} ${b.worker.user.lastName}`.trim()
        : 'Unassigned';
      const existing = revenueByWorkerMap.get(workerName) || { revenue: 0, count: 0 };
      existing.revenue += Number(b.amount);
      existing.count += 1;
      revenueByWorkerMap.set(workerName, existing);
    });

    const revenueByWorker = Array.from(revenueByWorkerMap.entries()).map(([worker, data]) => ({
      worker,
      revenue: data.revenue,
      count: data.count,
    }));

    // Get total payouts
    const payouts = await this.payoutsRepository.find({
      where: {
        status: PayoutStatus.COMPLETED,
        processedAt: Between(start, end),
      },
    });
    const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      startDate,
      endDate,
      totalRevenue,
      totalBookings,
      averageBookingValue,
      revenueByService,
      revenueByWorker,
      totalPayouts,
      netRevenue: totalRevenue - totalPayouts,
    };
  }

  async generatePayoutReport(startDate: string, endDate: string): Promise<PayoutReportDto> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const payouts = await this.payoutsRepository.find({
      where: {
        processedAt: Between(start, end),
      },
      relations: ['worker', 'worker.user'],
      order: { processedAt: 'DESC' },
    });

    const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

    // Payouts by status
    const statusMap = new Map<string, { count: number; amount: number }>();
    payouts.forEach((p) => {
      const existing = statusMap.get(p.status) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += Number(p.amount);
      statusMap.set(p.status, existing);
    });

    const payoutsByStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
    }));

    const payoutList = payouts.map((p) => ({
      id: p.publicId,
      worker: p.worker?.user
        ? `${p.worker.user.firstName} ${p.worker.user.lastName}`.trim()
        : 'Unknown',
      amount: Number(p.amount),
      status: p.status,
      processedAt: p.processedAt,
    }));

    return {
      startDate,
      endDate,
      totalPayouts: payouts.length,
      totalAmount,
      payoutsByStatus,
      payouts: payoutList,
    };
  }
}
