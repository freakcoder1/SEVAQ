import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/workers', label: 'Workers', icon: '👷' },
  { path: '/bookings', label: 'Bookings', icon: '📅' },
  { path: '/active-bookings', label: 'Active Bookings', icon: '📋' },
  { path: '/monitoring', label: 'Live Monitoring', icon: '📍' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/services', label: 'Services', icon: '🔧' },
  { path: '/admin-users', label: 'Admin Users', icon: '🛡️' },
  { path: '/audit-logs', label: 'Audit Logs', icon: '📋' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/advanced-analytics', label: 'Advanced Analytics', icon: '📊' },
];

const financeNavItems = [
  { path: '/payouts', label: 'Payouts', icon: '💰' },
  { path: '/refunds', label: 'Refunds', icon: '↩️' },
  { path: '/revenue-reports', label: 'Revenue Reports', icon: '📑' },
];

const supportNavItems = [
  { path: '/support-tickets', label: 'Support Tickets', icon: '🎫' },
  { path: '/create-booking', label: 'Create Booking', icon: '➕' },
];

const configNavItems = [
  { path: '/notification-templates', label: 'Notification Templates', icon: '🔔' },
  { path: '/business-hours', label: 'Business Hours', icon: '🕐' },
  { path: '/service-areas', label: 'Service Areas', icon: '🗺️' },
  { path: '/pricing-rules', label: 'Pricing Rules', icon: '💲' },
];

const NavSection: React.FC<{ title: string; items: typeof navItems }> = ({ title, items }) => {
  const location = useLocation();
  return (
    <div className="mb-4">
      <h3 className="px-4 text-xs font-semibold text-teal-200 uppercase tracking-wider mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-[#0A5C56] text-white'
                    : 'text-teal-100 hover:bg-[#0A5C56] hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);

  // Poll for unassigned bookings count using the correct API endpoint
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const bookings = await apiService.getUnassignedBookings();
        setPendingCount(bookings.length);
      } catch (e) {
        // Ignore errors during polling
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const pendingAssignmentsItem = [
    {
      path: '/pending-assignments',
      label: 'Pending Assignments',
      icon: '🔔',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-[#0F766E] text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#0A5C56]">
        <h1 className="text-2xl font-bold text-white">SEVAQ Admin</h1>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <NavSection title="Main" items={navItems} />
        <NavSectionWithBadge title="Assignments" items={pendingAssignmentsItem} />
        <NavSection title="Finance" items={financeNavItems} />
        <NavSection title="Support" items={supportNavItems} />
        <NavSection title="Configuration" items={configNavItems} />
      </nav>
      <div className="p-4 border-t border-[#0A5C56]">
        <p className="text-xs text-teal-200">v2.0.0</p>
      </div>
    </aside>
  );
};

const NavSectionWithBadge: React.FC<{ title: string; items: Array<{ path: string; label: string; icon: string; badge?: number }> }> = ({ title, items }) => {
  const location = useLocation();
  return (
    <div className="mb-4">
      <h3 className="px-4 text-xs font-semibold text-teal-200 uppercase tracking-wider mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-[#0A5C56] text-white'
                    : 'text-teal-100 hover:bg-[#0A5C56] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-error rounded-full animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
