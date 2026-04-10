import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Worker } from '../types';

// Helper to get worker name from nested user object
const getWorkerName = (worker: Worker) => {
  const firstName = worker.user?.firstName || worker.firstName || '';
  const lastName = worker.user?.lastName || worker.lastName || '';
  return { firstName, lastName };
};

// Helper to get worker email from nested user object
const getWorkerEmail = (worker: Worker) => {
  return worker.user?.email || worker.email || 'N/A';
};

// Helper to get numeric rating
const getNumericRating = (worker: Worker) => {
  const rating = worker.rating;
  return typeof rating === 'string' ? parseFloat(rating) : rating;
};

const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const data = await apiService.getWorkers();
        setWorkers(data);
      } catch (err: any) {
        console.error('Failed to fetch workers:', err);
        setError(err.response?.data?.message || 'Failed to load workers');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  const toggleAvailability = async (workerId: string) => {
    try {
      const updatedWorker = await apiService.toggleWorkerAvailability(workerId);
      setWorkers((prev) =>
        prev.map((w) => (String(w.id) === String(workerId) ? updatedWorker : w))
      );
    } catch (err: any) {
      console.error('Failed to toggle worker availability:', err);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const { firstName, lastName } = getWorkerName(worker);
    const email = getWorkerEmail(worker);

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && worker.isActive && worker.isAvailable) ||
      (filterStatus === 'inactive' && !worker.isActive) ||
      (filterStatus === 'unavailable' && worker.isActive && !worker.isAvailable);

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (worker: Worker) => {
    if (!worker.isActive) {
      return <span className="badge badge-inactive">Inactive</span>;
    }
    if (worker.isAvailable) {
      return <span className="badge badge-active">Active & Available</span>;
    }
    return <span className="badge badge-pending">Active & Unavailable</span>;
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workers Management</h1>
        <span className="text-sm text-gray-500">
          {filteredWorkers.length} of {workers.length} workers
        </span>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="all">All Status</option>
            <option value="active">Active & Available</option>
            <option value="inactive">Inactive</option>
            <option value="unavailable">Active & Unavailable</option>
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No workers found
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => {
                  const { firstName, lastName } = getWorkerName(worker);
                  const email = getWorkerEmail(worker);
                  const rating = getNumericRating(worker);
                  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'W';

                  return (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                            {initials}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {firstName} {lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {worker.publicId?.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ⭐ {typeof rating === 'number' ? rating.toFixed(1) : '0.0'} ({worker.reviewCount || 0})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(worker)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleAvailability(String(worker.id))}
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          {worker.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkersPage;
