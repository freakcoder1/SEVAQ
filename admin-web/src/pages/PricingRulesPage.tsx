import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { PricingRule } from '../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [newRule, setNewRule] = useState({ serviceId: '', dayOfWeek: '', timeSlot: '', multiplier: '1', minPrice: '', maxPrice: '' });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPricingRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch pricing rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rule: PricingRule) => {
    try {
      await apiService.updatePricingRule(rule.id, { isActive: !rule.isActive });
      fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await apiService.deletePricingRule(id);
      fetchRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        serviceId: newRule.serviceId ? Number(newRule.serviceId) : undefined,
        dayOfWeek: newRule.dayOfWeek ? Number(newRule.dayOfWeek) : undefined,
        timeSlot: newRule.timeSlot || undefined,
        multiplier: newRule.multiplier ? Number(newRule.multiplier) : undefined,
        minPrice: newRule.minPrice ? Number(newRule.minPrice) : undefined,
        maxPrice: newRule.maxPrice ? Number(newRule.maxPrice) : undefined,
      };
      if (editingRule) {
        await apiService.updatePricingRule(editingRule.id, data);
      } else {
        await apiService.createPricingRule({ ...data, isActive: true });
      }
      setShowModal(false);
      setEditingRule(null);
      setNewRule({ serviceId: '', dayOfWeek: '', timeSlot: '', multiplier: '1', minPrice: '', maxPrice: '' });
      fetchRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const openEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setNewRule({
      serviceId: rule.serviceId?.toString() || '',
      dayOfWeek: rule.dayOfWeek?.toString() || '',
      timeSlot: rule.timeSlot || '',
      multiplier: rule.multiplier?.toString() || '1',
      minPrice: rule.minPrice?.toString() || '',
      maxPrice: rule.maxPrice?.toString() || '',
    });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pricing Rules</h1>
        <button
          onClick={() => { setEditingRule(null); setNewRule({ serviceId: '', dayOfWeek: '', timeSlot: '', multiplier: '1', minPrice: '', maxPrice: '' }); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Rule
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Slot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Multiplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-4 text-center">No pricing rules found</td></tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4">{rule.serviceName ?? rule.serviceId ?? 'All'}</td>
                  <td className="px-6 py-4">{rule.dayOfWeek !== undefined ? DAYS[rule.dayOfWeek] : 'All'}</td>
                  <td className="px-6 py-4">{rule.timeSlot ?? 'All'}</td>
                  <td className="px-6 py-4">{rule.multiplier ?? '1'}x</td>
                  <td className="px-6 py-4">{rule.minPrice ? `₹${rule.minPrice}` : '-'}</td>
                  <td className="px-6 py-4">{rule.maxPrice ? `₹${rule.maxPrice}` : '-'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className={`px-2 py-1 text-xs rounded-full ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(rule)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button onClick={() => handleDelete(rule.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingRule ? 'Edit' : 'Add'} Pricing Rule</h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Service ID (leave empty for all)</label>
                <input
                  type="number"
                  value={newRule.serviceId}
                  onChange={(e) => setNewRule({ ...newRule, serviceId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Day of Week</label>
                <select
                  value={newRule.dayOfWeek}
                  onChange={(e) => setNewRule({ ...newRule, dayOfWeek: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">All Days</option>
                  {DAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Time Slot (e.g., 09:00-12:00)</label>
                <input
                  type="text"
                  value={newRule.timeSlot}
                  onChange={(e) => setNewRule({ ...newRule, timeSlot: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., 09:00-12:00"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Price Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRule.multiplier}
                  onChange={(e) => setNewRule({ ...newRule, multiplier: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    value={newRule.minPrice}
                    onChange={(e) => setNewRule({ ...newRule, minPrice: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    value={newRule.maxPrice}
                    onChange={(e) => setNewRule({ ...newRule, maxPrice: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
