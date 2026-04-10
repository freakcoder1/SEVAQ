import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Booking, BookingStatus } from '../types';

// Raw booking data from API (includes nested relations)
interface RawUserAddress {
  societyName?: string;
  towerNumber?: string;
  flatNumber?: string;
  landmark?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
  label?: string;
}

interface RawBooking {
  id: number | string;
  publicId: string;
  userId: number | string;
  workerId?: number | string | null;
  serviceId: number | string;
  serviceName?: string;
  status: string;
  amount: number | string;
  date: string;
  startTime?: string;
  endTime?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  workerName?: string;
  type?: string;
  notes?: string | null;
  isPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    addresses?: RawUserAddress[];
  };
  worker?: {
    firstName?: string;
    lastName?: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  service?: {
    name?: string;
  };
}

// Format a structured address object into a readable string
const formatUserAddress = (addr: RawUserAddress): string => {
  const parts: string[] = [];
  if (addr.flatNumber) parts.push(`Flat ${addr.flatNumber}`);
  if (addr.towerNumber) parts.push(`Tower ${addr.towerNumber}`);
  if (addr.societyName) parts.push(addr.societyName);
  if (addr.landmark) parts.push(addr.landmark);
  if (addr.area) parts.push(addr.area);
  if (addr.city && addr.pincode) {
    parts.push(`${addr.city} - ${addr.pincode}`);
  } else {
    if (addr.city) parts.push(addr.city);
    if (addr.pincode) parts.push(addr.pincode);
  }
  if (addr.state) parts.push(addr.state);
  return parts.join(', ');
};

// Build customer address string with fallback chain
const buildCustomerAddress = (booking: RawBooking): string => {
  const user = booking.user;

  // 1. Check user.addresses array for default or first address
  if (user?.addresses && user.addresses.length > 0) {
    const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
    const formatted = formatUserAddress(defaultAddr);
    if (formatted) return formatted;
  }

  // 2. Fall back to user.address (legacy string field)
  if (user?.address) return user.address;

  // 3. Fall back to booking.customerAddress
  if (booking.customerAddress) return booking.customerAddress;

  // 4. Fall back to booking.location?.address
  if (booking.location?.address) return booking.location.address;

  // 5. Default
  return 'N/A';
};

// Helper to flatten nested booking data
const flattenBooking = (booking: RawBooking): Booking => {
  const user = booking.user || {};
  const worker = booking.worker || {};
  const service = booking.service || {};
  return {
    id: booking.id,
    publicId: booking.publicId,
    userId: booking.userId,
    workerId: booking.workerId,
    serviceId: booking.serviceId,
    serviceName: service.name || booking.serviceName,
    status: booking.status,
    amount: booking.amount,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || booking.customerName,
    customerPhone: user.phone || booking.customerPhone,
    customerAddress: buildCustomerAddress(booking),
    workerName: worker.user?.firstName || worker.user?.lastName
      ? `${worker.user.firstName || ''} ${worker.user.lastName || ''}`.trim()
      : booking.workerName || (worker.firstName || worker.lastName ? `${worker.firstName || ''} ${worker.lastName || ''}`.trim() : undefined),
    type: booking.type,
    notes: booking.notes,
    isPaid: booking.isPaid,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
};

const BOOKING_STATUSES: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  requested: 'badge-warning',
  confirmed: 'badge-info',
  in_progress: 'badge-purple',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

const ITEMS_PER_PAGE = 10;

const BookingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterToday, setFilterToday] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Initialize filters from query params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'today') {
      setFilterToday(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await apiService.getBookings();
        // Flatten nested booking data
        const flattened = (data as any[]).map(flattenBooking);
        setBookings(flattened);
      } catch (err: any) {
        console.error('Failed to fetch bookings:', err);
        setError(err.response?.data?.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.publicId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || booking.status === filterStatus;

    // Filter for today's created bookings using createdAt date
    const matchesToday = !filterToday || (() => {
      if (!booking.createdAt) return false;
      const bookingDate = new Date(booking.createdAt);
      const today = new Date();
      return bookingDate.getFullYear() === today.getFullYear() &&
             bookingDate.getMonth() === today.getMonth() &&
             bookingDate.getDate() === today.getDate();
    })();

    return matchesSearch && matchesFilter && matchesToday;
  });

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusUpdate = async (bookingId: string | number, newStatus: string) => {
    setUpdatingStatus(String(bookingId));
    try {
      const updatedBooking = await apiService.updateBookingStatus(String(bookingId), newStatus);
      const flattened = flattenBooking(updatedBooking);
      setBookings((prev) =>
        prev.map((b) => (String(b.id) === String(bookingId) ? flattened : b))
      );
      if (selectedBooking && String(selectedBooking.id) === String(bookingId)) {
        setSelectedBooking(flattened);
      }
    } catch (err: any) {
      console.error('Failed to update booking status:', err);
      alert('Failed to update booking status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setCancelling(true);
    try {
      const updatedBooking = await apiService.cancelBooking(String(selectedBooking.id), cancelReason);
      const flattened = flattenBooking(updatedBooking);
      setBookings((prev) =>
        prev.map((b) => (String(b.id) === String(selectedBooking.id) ? flattened : b))
      );
      setSelectedBooking(flattened);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err: any) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status] || 'badge-gray';
    const label = status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return <span className={`badge ${colorClass}`}>{label}</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading bookings...</div>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
        <span className="text-sm text-gray-500">
          {filteredBookings.length} of {bookings.length} bookings
        </span>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, worker name, or booking ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field md:w-48"
          >
            {BOOKING_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-600">
                        {booking.publicId || booking.id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customerName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap max-w-xs">
                      <div className="text-sm text-gray-600 truncate" title={booking.customerAddress || 'N/A'}>
                        {booking.customerAddress || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.workerName || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.serviceName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.date)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(booking.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(booking);
                        }}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of{' '}
              {filteredBookings.length} bookings
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded border ${
                    page === currentPage
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Booking ID</label>
                    <p className="font-mono text-sm">{selectedBooking.publicId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Customer</label>
                    <p className="font-medium">{selectedBooking.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Customer Phone</label>
                    <p className="font-medium">{selectedBooking.customerPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Worker</label>
                    <p className="font-medium">{selectedBooking.workerName || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Service</label>
                    <p className="font-medium">{selectedBooking.serviceName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Date</label>
                    <p className="font-medium">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Time</label>
                    <p className="font-medium">
                      {selectedBooking.startTime || 'N/A'} - {selectedBooking.endTime || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Amount</label>
                    <p className="font-medium text-lg">{formatCurrency(selectedBooking.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="font-medium">{selectedBooking.customerAddress || 'N/A'}</p>
                  </div>
                </div>

                {/* Status Update */}
                {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                  <div className="border-t pt-4 mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Update Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BOOKING_STATUSES.filter(
                        (s) => s.value !== 'all' && s.value !== selectedBooking.status
                      ).map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleStatusUpdate(selectedBooking.id, status.value)}
                          disabled={updatingStatus === String(selectedBooking.id)}
                          className={`px-3 py-1.5 text-sm rounded ${STATUS_COLORS[status.value]} text-white disabled:opacity-50`}
                        >
                          {updatingStatus === String(selectedBooking.id) ? 'Updating...' : status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancel Button */}
                {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                  <div className="border-t pt-4">
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason (optional)"
              className="input-field w-full h-24 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
