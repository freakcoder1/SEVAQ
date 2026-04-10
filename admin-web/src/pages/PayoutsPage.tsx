import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { Payout } from '../services/api';

interface PayoutSummary {
  totalPending: number;
  totalPaidThisMonth: number;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setPayoutSummary] = useState<PayoutSummary>({ totalPending: 0, totalPaidThisMonth: 0 });
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayout, setNewPayout] = useState({ workerId: '', amount: '', paymentMethod: 'bank_transfer', notes: '' });

  useEffect(() => {
    fetchPayouts();
    fetchSummary();
  }, [filter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPayouts(filter !== 'all' ? filter : undefined);
      setPayouts(data);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await apiService.getPayoutSummary();
      setPayoutSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleProcessPayout = async (id: number, status: 'completed' | 'failed') => {
    try {
      await apiService.processPayout(id, { status });
      fetchPayouts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to process payout:', error);
    }
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createPayout({
        workerId: Number(newPayout.workerId),
        amount: Number(newPayout.amount),
        paymentMethod: newPayout.paymentMethod,
        notes: newPayout.notes,
      });
      setShowCreateModal(false);
      setNewPayout({ workerId: '', amount: '', paymentMethod: 'bank_transfer', notes: '' });
      fetchPayouts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to create payout:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payouts Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Payout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">₹{summary.totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Paid This Month</h3>
          <p className="text-2xl font-bold text-green-600">₹{summary.totalPaidThisMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : payouts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">No payouts found</td></tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{payout.workerId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{payout.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{payout.paymentMethod}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(payout.requestedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payout.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcessPayout(payout.id, 'completed')}
                          className="text-green-600 hover:text-green-800"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcessPayout(payout.id, 'failed')}
                          className="text-red-600 hover:text-red-800"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Payout Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Payout</h2>
            <form onSubmit={handleCreatePayout}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Worker ID</label>
                <input
                  type="number"
                  value={newPayout.workerId}
                  onChange={(e) => setNewPayout({ ...newPayout, workerId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={newPayout.amount}
                  onChange={(e) => setNewPayout({ ...newPayout, amount: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={newPayout.paymentMethod}
                  onChange={(e) => setNewPayout({ ...newPayout, paymentMethod: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={newPayout.notes}
                  onChange={(e) => setNewPayout({ ...newPayout, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
