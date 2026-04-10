import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkersPage from './pages/WorkersPage';
import BookingsPage from './pages/BookingsPage';
import UsersPage from './pages/UsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdvancedAnalyticsPage from './pages/AdvancedAnalyticsPage';
import LiveMonitoringPage from './pages/LiveMonitoringPage';
import ActiveBookingsPage from './pages/ActiveBookingsPage';
import ServicesPage from './pages/ServicesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
// Phase 2.3 - Finance
import PayoutsPage from './pages/PayoutsPage';
import RefundsPage from './pages/RefundsPage';
import RevenueReportsPage from './pages/RevenueReportsPage';
// Phase 2.4 - Support
import SupportTicketsPage from './pages/SupportTicketsPage';
import CreateBookingPage from './pages/CreateBookingPage';
// Phase 2.5 - Config
import NotificationTemplatesPage from './pages/NotificationTemplatesPage';
import BusinessHoursPage from './pages/BusinessHoursPage';
import ServiceAreasPage from './pages/ServiceAreasPage';
import PricingRulesPage from './pages/PricingRulesPage';
import PendingAssignmentsPage from './pages/PendingAssignmentsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="advanced-analytics" element={<AdvancedAnalyticsPage />} />
            <Route path="monitoring" element={<LiveMonitoringPage />} />
            <Route path="active-bookings" element={<ActiveBookingsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="admin-users" element={<AdminUsersPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            {/* Phase 2.3 - Finance */}
            <Route path="payouts" element={<PayoutsPage />} />
            <Route path="refunds" element={<RefundsPage />} />
            <Route path="revenue-reports" element={<RevenueReportsPage />} />
            {/* Phase 2.4 - Support */}
            <Route path="support-tickets" element={<SupportTicketsPage />} />
            <Route path="create-booking" element={<CreateBookingPage />} />
            {/* Phase 2.5 - Config */}
            <Route path="notification-templates" element={<NotificationTemplatesPage />} />
            <Route path="business-hours" element={<BusinessHoursPage />} />
            <Route path="service-areas" element={<ServiceAreasPage />} />
            <Route path="pricing-rules" element={<PricingRulesPage />} />
            <Route path="pending-assignments" element={<PendingAssignmentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
