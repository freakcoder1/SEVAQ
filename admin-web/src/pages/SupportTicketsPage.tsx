import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { SupportTicket, CommunicationLog } from '../services/api';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ userId: '', subject: '', description: '', priority: 'medium' });
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [newLog, setNewLog] = useState({ type: 'note' as const, direction: 'outbound' as const, content: '' });

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const priority = priorityFilter !== 'all' ? priorityFilter : undefined;
      const data = await apiService.getSupportTickets(status, priority);
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
    try {
      const logs = await apiService.getCommunicationLogs(ticket.id);
      setCommunicationLogs(logs);
    } catch (error) {
      console.error('Failed to fetch communication logs:', error);
    }
  };

  const handleAddLog = async () => {
    if (!selectedTicket || !newLog.content.trim()) return;
    try {
      await apiService.addCommunicationLog(selectedTicket.id, newLog);
      setNewLog({ type: 'note', direction: 'outbound', content: '' });
      const logs = await apiService.getCommunicationLogs(selectedTicket.id);
      setCommunicationLogs(logs);
    } catch (error) {
      console.error('Failed to add log:', error);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await apiService.resolveSupportTicket(id);
      fetchTickets();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createSupportTicket({
        userId: Number(newTicket.userId),
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
      });
      setShowCreateModal(false);
      setNewTicket({ userId: '', subject: '', description: '', priority: 'medium' });
      fetchTickets();
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-4 text-center">No tickets found</td></tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4">{ticket.subject}</td>
                  <td className="px-6 py-4">{ticket.userId}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{ticket.assignedToName ?? 'Unassigned'}</td>
                  <td className="px-6 py-4">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      className="text-blue-600 hover:text-blue-800"
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">User ID</label>
                <input
                  type="number"
                  value={newTicket.userId}
                  onChange={(e) => setNewTicket({ ...newTicket, userId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded">
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

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mb-4">
              <p><strong>User:</strong> {selectedTicket.userId}</p>
              <p><strong>Priority:</strong> <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span></p>
              <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status}</span></p>
              <p><strong>Assigned:</strong> {selectedTicket.assignedToName ?? 'Unassigned'}</p>
              <p className="mt-2"><strong>Description:</strong></p>
              <p className="text-gray-700">{selectedTicket.description}</p>
            </div>

            {/* Communication Log */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Communication Log</h3>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {communicationLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 p-2 rounded text-sm">
                    <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                    <span className="ml-2 px-1 bg-gray-200 rounded text-xs">{log.type}</span>
                    <span className="ml-2 px-1 bg-gray-200 rounded text-xs">{log.direction}</span>
                    <p className="mt-1">{log.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newLog.type}
                  onChange={(e) => setNewLog({ ...newLog, type: e.target.value as any })}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="note">Note</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
                <select
                  value={newLog.direction}
                  onChange={(e) => setNewLog({ ...newLog, direction: e.target.value as any })}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newLog.content}
                  onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
                  placeholder="Add note..."
                  className="flex-1 border rounded px-3 py-1 text-sm"
                />
                <button onClick={handleAddLog} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4 border-t pt-4">
              {selectedTicket.status !== 'resolved' && (
                <button
                  onClick={() => handleResolve(selectedTicket.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Mark Resolved
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
