import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiService } from '../services/api';
import { WorkerLocation, Booking } from '../types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveMonitoringPage: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerLocation[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [unassignedBookings, setUnassignedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = async () => {
    try {
      const [workerLocations, bookings] = await Promise.all([
        apiService.getWorkerLocations(),
        apiService.getActiveBookings(),
      ]);
      setWorkers(workerLocations);
      setActiveBookings(bookings);
      
      // Fetch unassigned bookings for alerts
      try {
        const allBookings = await apiService.getBookings();
        const unassigned = allBookings.filter((b: any) => b.status === 'pending' && !b.workerId);
        setUnassignedBookings(unassigned);
      } catch (err) {
        console.error('Error fetching unassigned bookings:', err);
      }
      
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Calculate summary statistics
  const totalWorkers = workers.length;
  const activeWorkers = workers.filter(w => w.isActive).length;
  const availableWorkers = workers.filter(w => w.isAvailable && w.isActive).length;
  const busyWorkers = workers.filter(w => w.currentBookingStatus && w.isActive).length;
  const utilizationRate = activeWorkers > 0 ? Math.round((busyWorkers / activeWorkers) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Monitoring</h1>
        <div className="text-sm text-gray-500">Last updated: {lastUpdated}</div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Workers</div>
          <div className="text-2xl font-bold text-gray-900">{totalWorkers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Active Workers</div>
          <div className="text-2xl font-bold text-green-600">{activeWorkers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Available</div>
          <div className="text-2xl font-bold text-blue-600">{availableWorkers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">On Jobs</div>
          <div className="text-2xl font-bold text-orange-600">{busyWorkers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Utilization</div>
          <div className="text-2xl font-bold text-purple-600">{utilizationRate}%</div>
        </div>
      </div>

      {/* Unassigned Bookings Alert */}
      {unassignedBookings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-yellow-800 font-semibold">
                ⚠️ {unassignedBookings.length} Unassigned Booking{unassignedBookings.length > 1 ? 's' : ''} Requiring Attention
              </span>
            </div>
            <a
              href="/bookings?status=pending"
              className="text-sm text-yellow-800 underline hover:text-yellow-900"
            >
              View All →
            </a>
          </div>
          <div className="mt-2 space-y-1">
            {unassignedBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="text-sm text-yellow-700">
                • {booking.serviceName} - {booking.customerName} ({booking.date})
              </div>
            ))}
            {unassignedBookings.length > 3 && (
              <div className="text-sm text-yellow-600">
                ...and {unassignedBookings.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Worker Locations</h2>
          <div className="h-96">
            <MapContainer
              center={[28.6139, 77.209]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {workers
                .filter((w) => w.latitude !== 0 && w.longitude !== 0)
                .map((worker) => (
                  <Marker
                    key={worker.workerId}
                    position={[worker.latitude, worker.longitude]}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <p className="font-semibold text-base">{worker.workerName}</p>
                        <p className="text-sm text-gray-600">
                          📞 <a href={`tel:${worker.phone}`} className="text-blue-600 hover:underline">{worker.phone}</a>
                        </p>
                        <p className="text-sm text-gray-600">
                          ✉️ {worker.email}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            Status: <span className={worker.isAvailable ? 'text-green-600' : 'text-orange-600'}>
                              {worker.currentBookingStatus ? 'On Job' : (worker.isAvailable ? 'Available' : 'Busy')}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">Rating: ⭐ {(worker.rating || 0).toFixed(1)}</p>
                          {worker.services && worker.services.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Services: {worker.services.map(s => s.name).join(', ')}
                            </p>
                          )}
                        </div>
                        {worker.currentBookingStatus && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-blue-600 font-medium">
                              Current: {worker.currentBookingStatus}
                            </p>
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          <a
                            href={`tel:${worker.phone}`}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          >
                            📞 Call
                          </a>
                          <a
                            href={`sms:${worker.phone}`}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            💬 SMS
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Available ({availableWorkers})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>On Job ({busyWorkers})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Inactive ({totalWorkers - activeWorkers})</span>
            </div>
          </div>
        </div>

        {/* Active Bookings Sidebar */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Active Bookings ({activeBookings.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active bookings</p>
            ) : (
              activeBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{booking.serviceName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">👤 {booking.customerName}</p>
                  <p className="text-sm text-gray-600">🔧 {booking.workerName}</p>
                  <p className="text-sm text-gray-500">
                    🕐 {booking.startTime} - {booking.endTime}
                  </p>
                  {booking.location?.address && (
                    <p className="text-xs text-gray-400 mt-1">📍 {booking.location.address}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      Call Customer
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoringPage;
