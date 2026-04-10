import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { LoginRequest, LoginResponse, DashboardStats, Worker, Booking, RevenueAnalytics, BookingAnalytics, Service, ServiceFormData, AdminUser, AdminUserFormData, AuditLog, PaginatedResponse, CustomerUser, SystemMetrics, AssignmentMetrics, RevenueTrendPoint, BookingTrendPoint, ServicePopularity, WorkerPerformance, CustomerRetention, WorkerLocation, BookingTimelineItem } from '../types';

// New types for Phase 2.3, 2.4, 2.5
export interface Payout {
  id: number;
  publicId: string;
  workerId: number;
  workerName?: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: string;
  transactionId?: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface Refund {
  id: number;
  publicId: string;
  bookingId: number;
  userId: number;
  userName?: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: number;
  approvedBy?: number;
  processedAt?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  publicId: string;
  userId: number;
  userName?: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CommunicationLog {
  id: number;
  ticketId: number;
  userId: number;
  adminId: number;
  type: 'email' | 'sms' | 'push' | 'note';
  direction: 'inbound' | 'outbound';
  content: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  type: string;
  channel: string;
  subject?: string;
  body: string;
  variables?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface BusinessHours {
  id: number;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceArea {
  id: number;
  name: string;
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  isActive: boolean;
  createdAt: string;
}

export interface PricingRule {
  id: number;
  serviceId?: number;
  serviceName?: string;
  dayOfWeek?: number;
  timeSlot?: string;
  multiplier?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBookingData {
  userId: number;
  workerId: number;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  notes?: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle 401 errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', data);
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get('/admin/dashboard');
    return response.data;
  }

  // Workers
  async getWorkers(): Promise<Worker[]> {
    const response = await this.api.get('/admin/workers');
    return response.data;
  }

  async getWorker(id: string): Promise<Worker> {
    const response = await this.api.get(`/admin/workers/${id}`);
    return response.data;
  }

  async updateWorker(id: string, data: Partial<Worker>): Promise<Worker> {
    const response = await this.api.put(`/admin/workers/${id}`, data);
    return response.data;
  }

  async toggleWorkerAvailability(id: string): Promise<Worker> {
    // Get current worker state to toggle
    const workers = await this.getWorkers();
    const worker = workers.find((w) => String(w.id) === String(id));
    if (!worker) throw new Error('Worker not found');
    const response = await this.api.patch(`/admin/workers/${id}/availability`, {
      isAvailable: !worker.isAvailable,
    });
    return response.data;
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const response = await this.api.get('/admin/bookings');
    return response.data;
  }

  async getBooking(id: string): Promise<Booking> {
    const response = await this.api.get(`/admin/bookings/${id}`);
    return response.data;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const response = await this.api.patch(`/admin/bookings/${id}/status`, { status });
    return response.data;
  }

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const response = await this.api.post(`/admin/bookings/${id}/cancel`, { reason });
    return response.data;
  }

  // Analytics
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const response = await this.api.get('/admin/analytics/revenue');
    return response.data;
  }

  async getBookingAnalytics(): Promise<BookingAnalytics> {
    const response = await this.api.get('/admin/analytics/bookings');
    return response.data;
  }

  // Users
  async getUsers(): Promise<CustomerUser[]> {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  // Metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await this.api.get('/metrics/system');
    return response.data;
  }

  async getAssignmentMetrics(): Promise<AssignmentMetrics> {
    const response = await this.api.get('/metrics/assignments');
    return response.data;
  }

  // Services
  async getServices(): Promise<Service[]> {
    const response = await this.api.get('/services');
    return response.data.data || response.data;
  }

  async createService(data: ServiceFormData): Promise<Service> {
    const response = await this.api.post('/services', data);
    return response.data;
  }

  async updateService(id: string, data: Partial<ServiceFormData>): Promise<Service> {
    const response = await this.api.patch(`/services/${id}`, data);
    return response.data;
  }

  async deleteService(id: string): Promise<void> {
    await this.api.delete(`/services/${id}`);
  }

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  async createAdminUser(data: AdminUserFormData): Promise<AdminUser> {
    const response = await this.api.post('/admin/users', data);
    return response.data;
  }

  async updateAdminUser(id: string, data: Partial<AdminUserFormData>): Promise<AdminUser> {
    const response = await this.api.patch(`/admin/users/${id}`, data);
    return response.data;
  }

  async deleteAdminUser(id: string): Promise<void> {
    await this.api.delete(`/admin/users/${id}`);
  }

  // Audit Logs
  async getAuditLogs(params?: {
    adminId?: number;
    adminEmail?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.api.get('/admin/audit-logs', { params });
    return response.data;
  }

  async getAuditLog(id: number): Promise<AuditLog> {
    const response = await this.api.get(`/admin/audit-logs/${id}`);
    return response.data;
  }

  async getAuditLogActions(): Promise<string[]> {
    const response = await this.api.get('/admin/audit-logs/filters/actions');
    return response.data.actions || [];
  }

  async getAuditLogEntityTypes(): Promise<string[]> {
    const response = await this.api.get('/admin/audit-logs/filters/entity-types');
    return response.data.entityTypes || [];
  }

  // Advanced Analytics
  async getRevenueTrend(days: number): Promise<RevenueTrendPoint[]> {
    const response = await this.api.get(`/admin/analytics/revenue-trend?days=${days}`);
    return response.data;
  }

  async getBookingTrend(days: number): Promise<BookingTrendPoint[]> {
    const response = await this.api.get(`/admin/analytics/booking-trend?days=${days}`);
    return response.data;
  }

  async getServicePopularity(): Promise<ServicePopularity[]> {
    const response = await this.api.get('/admin/analytics/service-popularity');
    return response.data;
  }

  async getWorkerPerformance(): Promise<WorkerPerformance[]> {
    const response = await this.api.get('/admin/analytics/worker-performance');
    return response.data;
  }

  async getCustomerRetention(): Promise<CustomerRetention> {
    const response = await this.api.get('/admin/analytics/customer-retention');
    return response.data;
  }

  // Monitoring
  async getWorkerLocations(): Promise<WorkerLocation[]> {
    const response = await this.api.get('/admin/monitoring/workers/locations');
    return response.data;
  }

  async getActiveBookings(): Promise<Booking[]> {
    const response = await this.api.get('/admin/monitoring/bookings/active');
    return response.data;
  }

  async getBookingTimeline(): Promise<BookingTimelineItem[]> {
    const response = await this.api.get('/admin/monitoring/bookings/timeline');
    return response.data;
  }

  // Finance - Payouts
  async getPayouts(status?: string): Promise<Payout[]> {
    const response = await this.api.get('/admin/finance/payouts', { params: { status } });
    return response.data;
  }

  async getPendingPayouts(): Promise<Payout[]> {
    const response = await this.api.get('/admin/finance/payouts/pending');
    return response.data;
  }

  async getPayoutSummary(): Promise<{ totalPending: number; totalPaidThisMonth: number }> {
    const response = await this.api.get('/admin/finance/payouts/summary');
    return response.data;
  }

  async getPayout(id: number): Promise<Payout> {
    const response = await this.api.get(`/admin/finance/payouts/${id}`);
    return response.data;
  }

  async createPayout(data: { workerId: number; amount: number; paymentMethod: string; notes?: string }): Promise<Payout> {
    const response = await this.api.post('/admin/finance/payouts', data);
    return response.data;
  }

  async processPayout(id: number, data: { status: string; transactionId?: string }): Promise<Payout> {
    const response = await this.api.patch(`/admin/finance/payouts/${id}`, data);
    return response.data;
  }

  // Finance - Refunds
  async getRefunds(status?: string): Promise<Refund[]> {
    const response = await this.api.get('/admin/finance/refunds', { params: { status } });
    return response.data;
  }

  async getRefund(id: number): Promise<Refund> {
    const response = await this.api.get(`/admin/finance/refunds/${id}`);
    return response.data;
  }

  async createRefund(data: { bookingId: number; amount: number; reason: string }): Promise<Refund> {
    const response = await this.api.post('/admin/finance/refunds', data);
    return response.data;
  }

  async processRefund(id: number, data: { status: string }): Promise<Refund> {
    const response = await this.api.patch(`/admin/finance/refunds/${id}`, data);
    return response.data;
  }

  // Finance - Reports
  async getRevenueReport(startDate: string, endDate: string): Promise<any> {
    const response = await this.api.get('/admin/finance/reports/revenue', { params: { startDate, endDate } });
    return response.data;
  }

  async getPayoutReport(startDate: string, endDate: string): Promise<any> {
    const response = await this.api.get('/admin/finance/reports/payouts', { params: { startDate, endDate } });
    return response.data;
  }

  // Support - Tickets
  async getSupportTickets(status?: string, priority?: string): Promise<SupportTicket[]> {
    const response = await this.api.get('/admin/support/tickets', { params: { status, priority } });
    return response.data;
  }

  async getSupportTicket(id: number): Promise<SupportTicket> {
    const response = await this.api.get(`/admin/support/tickets/${id}`);
    return response.data;
  }

  async createSupportTicket(data: { userId: number; subject: string; description: string; priority: string }): Promise<SupportTicket> {
    const response = await this.api.post('/admin/support/tickets', data);
    return response.data;
  }

  async updateSupportTicket(id: number, data: Partial<SupportTicket>): Promise<SupportTicket> {
    const response = await this.api.patch(`/admin/support/tickets/${id}`, data);
    return response.data;
  }

  async assignSupportTicket(id: number, adminId: number): Promise<SupportTicket> {
    const response = await this.api.post(`/admin/support/tickets/${id}/assign`, { adminId });
    return response.data;
  }

  async resolveSupportTicket(id: number): Promise<SupportTicket> {
    const response = await this.api.post(`/admin/support/tickets/${id}/resolve`);
    return response.data;
  }

  // Support - Communication Logs
  async getCommunicationLogs(ticketId: number): Promise<CommunicationLog[]> {
    const response = await this.api.get(`/admin/support/tickets/${ticketId}/communications`);
    return response.data;
  }

  async addCommunicationLog(ticketId: number, data: { type: string; direction: string; content: string }): Promise<CommunicationLog> {
    const response = await this.api.post(`/admin/support/tickets/${ticketId}/communications`, data);
    return response.data;
  }

  // Bookings - Create
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await this.api.post('/admin/bookings', data);
    return response.data;
  }

  // Config - Notification Templates
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const response = await this.api.get('/admin/config/notification-templates');
    return response.data;
  }

  async updateNotificationTemplate(id: number, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const response = await this.api.patch(`/admin/config/notification-templates/${id}`, data);
    return response.data;
  }

  // Config - Business Hours
  async getBusinessHours(): Promise<BusinessHours[]> {
    const response = await this.api.get('/admin/config/business-hours');
    return response.data;
  }

  async updateBusinessHours(data: BusinessHours[]): Promise<BusinessHours[]> {
    const response = await this.api.patch('/admin/config/business-hours', data);
    return response.data;
  }

  // Config - Service Areas
  async getServiceAreas(): Promise<ServiceArea[]> {
    const response = await this.api.get('/admin/config/service-areas');
    return response.data;
  }

  async createServiceArea(data: Partial<ServiceArea>): Promise<ServiceArea> {
    const response = await this.api.post('/admin/config/service-areas', data);
    return response.data;
  }

  async updateServiceArea(id: number, data: Partial<ServiceArea>): Promise<ServiceArea> {
    const response = await this.api.patch(`/admin/config/service-areas/${id}`, data);
    return response.data;
  }

  async deleteServiceArea(id: number): Promise<void> {
    await this.api.delete(`/admin/config/service-areas/${id}`);
  }

  // Config - Pricing Rules
  async getPricingRules(): Promise<PricingRule[]> {
    const response = await this.api.get('/admin/config/pricing-rules');
    return response.data;
  }

  async createPricingRule(data: Partial<PricingRule>): Promise<PricingRule> {
    const response = await this.api.post('/admin/config/pricing-rules', data);
    return response.data;
  }

  async updatePricingRule(id: number, data: Partial<PricingRule>): Promise<PricingRule> {
    const response = await this.api.patch(`/admin/config/pricing-rules/${id}`, data);
    return response.data;
  }

  async deletePricingRule(id: number): Promise<void> {
    await this.api.delete(`/admin/config/pricing-rules/${id}`);
  }

  // Users - Bookings
  async getUserBookings(userId: number): Promise<Booking[]> {
    const response = await this.api.get(`/admin/users/${userId}/bookings`);
    return response.data;
  }

  // Pending Assignments
  async getUnassignedBookings(): Promise<Booking[]> {
    const response = await this.api.get('/admin/bookings/unassigned');
    return response.data;
  }

  async assignBooking(bookingId: string, workerId: number, notes?: string): Promise<Booking> {
    const response = await this.api.post(`/admin/bookings/${bookingId}/assign`, { workerId, notes });
    return response.data;
  }
}

export const apiService = new ApiService();
