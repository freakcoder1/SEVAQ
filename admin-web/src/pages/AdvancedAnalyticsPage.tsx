import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiService } from '../services/api';
import { RevenueTrendPoint, BookingTrendPoint, ServicePopularity, WorkerPerformance, CustomerRetention } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedAnalyticsPage: React.FC = () => {
  const [days, setDays] = useState<number>(30);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
  const [bookingTrend, setBookingTrend] = useState<BookingTrendPoint[]>([]);
  const [servicePopularity, setServicePopularity] = useState<ServicePopularity[]>([]);
  const [workerPerformance, setWorkerPerformance] = useState<WorkerPerformance[]>([]);
  const [customerRetention, setCustomerRetention] = useState<CustomerRetention | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revenue, bookings, services, workers, retention] = await Promise.all([
        apiService.getRevenueTrend(days),
        apiService.getBookingTrend(days),
        apiService.getServicePopularity(),
        apiService.getWorkerPerformance(),
        apiService.getCustomerRetention(),
      ]);
      setRevenueTrend(revenue);
      setBookingTrend(bookings);
      setServicePopularity(services);
      setWorkerPerformance(workers);
      setCustomerRetention(retention);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipLabel = (label: any) => {
    const labelStr = typeof label === 'string' ? label : String(label);
    return formatDate(labelStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded ${
                days === d
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Customer Retention Cards */}
      {customerRetention && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-2xl font-bold">{customerRetention.totalCustomers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Returning Customers</p>
            <p className="text-2xl font-bold">{customerRetention.returningCustomers}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Retention Rate</p>
            <p className="text-2xl font-bold">{customerRetention.retentionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Avg Bookings/Customer</p>
            <p className="text-2xl font-bold">{customerRetention.avgBookingsPerCustomer.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Revenue Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis />
            <Tooltip labelFormatter={formatTooltipLabel} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#0088FE" name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Volume */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Booking Volume</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bookingTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis />
            <Tooltip labelFormatter={formatTooltipLabel} />
            <Legend />
            <Bar dataKey="count" fill="#00C49F" name="Bookings" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service Popularity & Worker Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Popularity Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Service Popularity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={servicePopularity}
                dataKey="bookingCount"
                nameKey="serviceName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ serviceName, percent }: { serviceName?: string; percent?: number }) => 
                  `${serviceName || 'Unknown'} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {servicePopularity.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Worker Performance Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Worker Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jobs</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workerPerformance.slice(0, 10).map((worker) => (
                  <tr key={worker.workerId}>
                    <td className="px-3 py-2 text-sm">{worker.workerName}</td>
                    <td className="px-3 py-2 text-sm">{worker.completedJobs}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className="text-yellow-500">★</span> {Number(worker.rating).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {worker.avgCompletionTime ? `${Math.round(worker.avgCompletionTime)} min` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage;
