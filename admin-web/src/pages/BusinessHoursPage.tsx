import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { BusinessHours } from '../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBusinessHours();
      // Ensure we have all 7 days
      const allDays: BusinessHours[] = [];
      for (let i = 0; i < 7; i++) {
        const existing = data.find((h: BusinessHours) => h.dayOfWeek === i);
        allDays.push(existing || { id: 0, dayOfWeek: i, startTime: '09:00', endTime: '18:00', isClosed: false, createdAt: '', updatedAt: '' });
      }
      setHours(allDays);
    } catch (error) {
      console.error('Failed to fetch business hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClosed = (index: number) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], isClosed: !updated[index].isClosed };
    setHours(updated);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateBusinessHours(hours);
      alert('Business hours saved successfully!');
    } catch (error) {
      console.error('Failed to save business hours:', error);
      alert('Failed to save business hours');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Business Hours</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closed</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hours.map((h, index) => (
              <tr key={h.dayOfWeek}>
                <td className="px-6 py-4 font-medium">{DAYS[h.dayOfWeek]}</td>
                <td className="px-6 py-4">
                  <input
                    type="time"
                    value={h.startTime || '09:00'}
                    onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                    disabled={h.isClosed}
                    className="border rounded px-2 py-1 disabled:bg-gray-100"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="time"
                    value={h.endTime || '18:00'}
                    onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                    disabled={h.isClosed}
                    className="border rounded px-2 py-1 disabled:bg-gray-100"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={h.isClosed}
                    onChange={() => handleToggleClosed(index)}
                    className="w-4 h-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Current Schedule Preview</h2>
        <div className="space-y-1">
          {hours.map((h) => (
            <div key={h.dayOfWeek} className="flex justify-between text-sm">
              <span className="font-medium">{DAYS[h.dayOfWeek]}</span>
              <span>{h.isClosed ? 'Closed' : `${h.startTime} - ${h.endTime}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
