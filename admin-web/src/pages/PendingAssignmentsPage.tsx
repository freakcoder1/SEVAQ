import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { config } from '../config';
import { Booking, Worker } from '../types';

interface PendingAssignmentsPageProps {
  onNotification?: () => void;
}

export default function PendingAssignmentsPage({ onNotification }: PendingAssignmentsPageProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [unassignedBookings, allWorkers] = await Promise.all([
        apiService.getUnassignedBookings(),
        apiService.getWorkers(),
      ]);
      setBookings(unassignedBookings);
      setWorkers(allWorkers.filter((w) => w.isActive && w.isAvailable));
      setError(null);
    } catch (err) {
      setError('Failed to load pending assignments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend URL from config, fallback to current host with backend port
    const backendUrl = config.apiBaseUrl.replace('/api', '');
    const wsHost = backendUrl ? new URL(backendUrl).hostname + ':' + (new URL(backendUrl).port || '3000') : window.location.hostname + ':3000';
    const wsUrl = `${protocol}//${wsHost}/monitoring`;
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for booking notifications');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'new_booking' || data.event === 'booking_status_changed') {
          fetchData();
          if (onNotification) {
            onNotification();
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [fetchData, onNotification]);

  const handleAssignClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedWorker(null);
    setAssignmentNotes('');
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleAssignSubmit = async () => {
    if (!selectedBooking || !selectedWorker) return;

    try {
      setAssigning(true);
      await apiService.assignBooking(
        String(selectedBooking.id),
        selectedWorker,
        assignmentNotes || undefined,
      );
      setSuccess('Booking assigned successfully!');
      setShowModal(false);
      setSelectedBooking(null);
      setSelectedWorker(null);
      setAssignmentNotes('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign booking');
    } finally {
      setAssigning(false);
    }
  };

  const getAvailableWorkersForBooking = (booking: Booking) => {
    if (!booking.serviceId) return workers;
    return workers.filter((w) => {
      if (!w.services || w.services.length === 0) return true;
      // Compare service IDs - w.services can be an array of service objects or IDs
      return w.services.some((s: any) => {
        const serviceId = typeof s === 'object' ? s.id : s;
        return String(serviceId) === String(booking.serviceId);
      });
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      // Handle time-only strings like "14:30:00"
      if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      // Handle full date strings
      return new Date(timeStr).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Assignments</h1>
          <p className="text-gray-600 mt-1">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} waiting for worker assignment
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-700">All caught up!</h2>
          <p className="text-gray-500 mt-2">No pending assignments at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.customerName || 'Unknown Customer'}
                  </h3>
                  <p className="text-sm text-gray-500">{booking.customerPhone || ''}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-medium text-gray-900">
                    {booking.serviceName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(booking.date)}</span>
                </div>
                {booking.startTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium text-gray-900">
                      {formatTime(booking.startTime)}
                      {booking.endTime && ` - ${formatTime(booking.endTime)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium text-gray-900">
                    ₹{typeof booking.amount === 'number' ? booking.amount.toFixed(2) : booking.amount}
                  </span>
                </div>
                {booking.customerAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium text-gray-900 truncate ml-2 max-w-[150px]">
                      {booking.customerAddress}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleAssignClick(booking)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Assign Worker
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Worker Selection Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assign Worker</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Customer:</span> {selectedBooking.customerName || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Service:</span> {selectedBooking.serviceName || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {formatDate(selectedBooking.date)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Worker
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getAvailableWorkersForBooking(selectedBooking).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No available workers for this service
                    </p>
                  ) : (
                    getAvailableWorkersForBooking(selectedBooking).map((worker) => (
                      <label
                        key={worker.id}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedWorker === worker.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="worker"
                          value={worker.id}
                          checked={selectedWorker === worker.id}
                          onChange={() => setSelectedWorker(Number(worker.id))}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {worker.firstName} {worker.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Rating: {typeof worker.rating === 'number' ? worker.rating.toFixed(1) : worker.rating || 'N/A'} ⭐
                            {worker.reviewCount > 0 && ` (${worker.reviewCount} reviews)`}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add any notes for the worker..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSubmit}
                  disabled={!selectedWorker || assigning}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
