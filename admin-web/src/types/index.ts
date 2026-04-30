export interface User {
  id: number | string;
  publicId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkerUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface Worker {
  id: number | string;
  publicId: string;
  userId: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  isAvailable: boolean;
  rating: number | string;
  reviewCount: number;
  serviceRadiusKm: number;
  latitude?: string | null;
  longitude?: string | null;
  services?: string[];
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
  // Nested user relation from API response
  user?: WorkerUser;
}

export type BookingStatus = 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: number | string;
  publicId: string;
  userId: number | string;
  workerId?: number | string | null;
  serviceId: number | string;
  serviceName?: string;
  status: BookingStatus | string;
  assignmentState?: string;
  amount: number | string;
  date: string;
  startTime?: string;
  endTime?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  workerName?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  type?: string;
  notes?: string | null;
  isPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averagePerBooking: number;
  revenueByService: Array<{ service: string; revenue: string }>;
  revenueByDate: Array<{ date: string; revenue: string }>;
}

export interface BookingAnalytics {
  totalBookings: number;
  bookingsByStatus: Array<{ status: string; count: string }>;
  bookingsByService: Array<{ service: string; count: string }>;
  bookingsByDate: Array<{ date: string; count: string }>;
  completionRate: number;
  cancellationRate: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalWorkers: number;
  totalBookings: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingAssignments: number;
  completedJobsToday: number;
  averageRating: number;
  bookingsByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: string }>;
  topWorkers: Array<{ id: number; name: string; rating: string; completedJobs: string }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Service Management
export interface Service {
  id: number;
  publicId: string;
  name: string;
  description: string | null;
  basePrice: number | string;
  category: string | null;
  subcategory: string | null;
  isAvailable: boolean;
  isFastBooking: boolean;
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  basePrice: number;
  category: string;
  subcategory: string;
  isAvailable: boolean;
  isFastBooking: boolean;
  imageUrl: string;
}

// Admin User Management
export type AdminRole = 'super_admin' | 'admin' | 'support' | 'finance';

export interface AdminUser {
  id: number;
  publicId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  isActive: boolean;
}

// Audit Logging
export interface AuditLog {
  id: number;
  adminId: number | null;
  adminEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Analytics Types
export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface BookingTrendPoint {
  date: string;
  count: number;
}

export interface ServicePopularity {
  serviceName: string;
  bookingCount: number;
  percentage: number;
}

export interface WorkerPerformance {
  workerId: number | string;
  workerName: string;
  completedJobs: number;
  rating: number;
  avgCompletionTime?: number;
}

export interface CustomerRetention {
  totalCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  avgBookingsPerCustomer: number;
}

export interface WorkerLocation {
  workerId: number | string;
  workerName: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  currentBookingId?: number;
  currentBookingStatus?: string;
  services?: Array<{ id: number; name: string }>;
  lastUpdate?: string;
}

export interface BookingTimelineItem {
  id: number | string;
  bookingId: string;
  status: string;
  timestamp: string;
  customerName: string;
  workerName?: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestRate: number;
  errorRate: number;
  uptime: number;
}

export interface AssignmentMetrics {
  totalAssignments: number;
  avgAssignmentTime: number;
  successRate: number;
  pendingAssignments: number;
  failedAssignments: number;
}

// User type for admin users list
export interface CustomerUser {
  id: number | string;
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt: string;
  bookingCount?: number;
}
