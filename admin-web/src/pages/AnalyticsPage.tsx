import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { RevenueAnalytics, BookingAnalytics } from '../types';

const AnalyticsPage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [bookingData, setBookingData] = useState<BookingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [revenue, bookings] = await Promise.all([
          apiService.getRevenueAnalytics(),
          apiService.getBookingAnalytics(),
        ]);
        setRevenueData(revenue);
        setBookingData(bookings);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err.response?.data?.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string): string => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {revenueData ? formatCurrency(revenueData.totalRevenue) : '₹0'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Avg Per Booking</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {revenueData ? formatCurrency(revenueData.averagePerBooking) : '₹0'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {bookingData ? (bookingData.completionRate * 100).toFixed(1) : '0'}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Cancellation Rate</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {bookingData ? (bookingData.cancellationRate * 100).toFixed(1) : '0'}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Booking Status Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Breakdown</h2>
          <div className="space-y-3">
            {bookingData?.bookingsByStatus &&
              bookingData.bookingsByStatus.map(({ status, count }) => {
                const total = bookingData.totalBookings || 1;
                const countNum = parseInt(count, 10);
                const percentage = Math.round((countNum / total) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {countNum} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          status.toLowerCase() === 'completed'
                            ? 'bg-green-500'
                            : status.toLowerCase() === 'cancelled'
                            ? 'bg-red-500'
                            : status.toLowerCase() === 'in_progress'
                            ? 'bg-purple-500'
                            : status.toLowerCase() === 'confirmed'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Bookings</span>
              <span className="text-lg font-bold text-gray-900">
                {bookingData?.totalBookings || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Service Type Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Type Breakdown</h2>
          <div className="space-y-3">
            {bookingData?.bookingsByService &&
              bookingData.bookingsByService
                .sort((a, b) => parseInt(b.count, 10) - parseInt(a.count, 10))
                .map(({ service, count }) => {
                  const total = bookingData.totalBookings || 1;
                  const countNum = parseInt(count, 10);
                  const percentage = Math.round((countNum / total) * 100);
                  return (
                    <div key={service}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{service}</span>
                        <span className="text-sm text-gray-600">
                          {countNum} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-primary-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Revenue by Service */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h2>
        <div className="space-y-3">
          {revenueData?.revenueByService &&
            revenueData.revenueByService
              .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
              .map(({ service, revenue }) => {
                const totalRev = revenueData.totalRevenue || 1;
                const revNum = parseFloat(revenue);
                const percentage = Math.round((revNum / totalRev) * 100);
                return (
                  <div key={service}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{service}</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(revNum)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-green-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
