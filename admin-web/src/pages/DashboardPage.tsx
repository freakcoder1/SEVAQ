import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  onClick?: () => void;
  clickable?: boolean;
}> = ({ title, value, icon, color, onClick, clickable = false }) => (
  <div 
    className={`card ${clickable ? 'cursor-pointer hover:shadow-elevation hover:-translate-y-1 transition-all duration-200' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-secondary-text mb-1">{title}</p>
        <p className="text-3xl font-bold text-on-surface">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-md flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  // Calculate pending bookings from bookingsByStatus
  const pendingBookings = stats?.bookingsByStatus
    ? Object.entries(stats.bookingsByStatus)
        .filter(([key]) => key.toLowerCase() === 'requested')
        .reduce((sum, [, count]) => sum + count, 0)
    : 0;

  const completedBookings = stats?.bookingsByStatus
    ? Object.entries(stats.bookingsByStatus)
        .filter(([key]) => key.toLowerCase() === 'completed')
        .reduce((sum, [, count]) => sum + count, 0)
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          title="Completed Today"
          value={stats?.completedJobsToday || 0}
          icon="📆"
          color="bg-info/20"
          clickable={true}
          onClick={() => navigate('/bookings?status=completed')}
        />
        <MetricCard
          title="Total Bookings"
          value={stats?.totalBookings?.toLocaleString() || 0}
          icon="📅"
          color="bg-primary-container"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
          icon="💰"
          color="bg-success/20"
        />
        <MetricCard
          title="Total Workers"
          value={stats?.totalWorkers || 0}
          icon="👷"
          color="bg-tertiary/20"
        />
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="bg-warning/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Booking Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Pending (Requested)</span>
              <span className="badge badge-pending">{pendingBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Completed</span>
              <span className="badge badge-completed">{completedBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Active Subscriptions</span>
              <span className="badge badge-info">{stats?.activeSubscriptions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Avg Rating</span>
              <span className="text-sm font-medium">⭐ {stats?.averageRating?.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/workers" className="block btn-secondary text-center py-3 rounded-lg">
              Manage Workers
            </Link>
            <Link to="/bookings" className="block btn-secondary text-center py-3 rounded-lg">
              View Bookings
            </Link>
            <Link to="/analytics" className="block btn-secondary text-center py-3 rounded-lg">
              View Analytics
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-on-surface mb-4">System Status</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-sm text-on-surface-variant">Backend API: Running</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-sm text-on-surface-variant">Database: Connected</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-on-surface-variant">Pending Assignments</span>
              <span className="text-sm font-medium">{stats?.pendingAssignments || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Completed Today</span>
              <span className="text-sm font-medium">{stats?.completedJobsToday || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
