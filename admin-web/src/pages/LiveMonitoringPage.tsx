import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiService } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WorkerLocation {
  workerId: number;
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
}

interface ActiveBooking {
  id: number;
  customerName: string;
  customerPhone: string;
  workerName: string;
  serviceName: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  address: string;
}

const LiveMonitoringPage: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerLocation[]>([]);
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
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

  const getMarkerColor = (worker: WorkerLocation) => {
    if (!worker.isActive) return 'gray';
    if (worker.currentBookingStatus) return 'blue';
    if (worker.isAvailable) return 'green';
    return 'orange';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Monitoring</h1>
        <div className="text-sm text-gray-500">Last updated: {lastUpdated}</div>
      </div>

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
                      <div className="p-2">
                        <p className="font-semibold">{worker.workerName}</p>
                        <p className="text-sm text-gray-500">
                          Status: {worker.isAvailable ? 'Available' : 'Busy'}
                        </p>
                        <p className="text-sm text-gray-500">Rating: {(worker.rating || 0).toFixed(1)}</p>
                        {worker.currentBookingStatus && (
                          <p className="text-sm text-blue-600">
                            Booking: {worker.currentBookingStatus}
                          </p>
                        )}
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
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>On Job</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Inactive</span>
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
                <div key={booking.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{booking.serviceName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Customer: {booking.customerName}</p>
                  <p className="text-sm text-gray-600">Worker: {booking.workerName}</p>
                  <p className="text-sm text-gray-600">
                    Time: {booking.startTime} - {booking.endTime}
                  </p>
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
