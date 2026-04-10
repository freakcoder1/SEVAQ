import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { ServiceArea } from '../services/api';

export default function ServiceAreasPage() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [newArea, setNewArea] = useState({ name: '', city: '', state: '', latitude: '', longitude: '', radiusKm: '' });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const data = await apiService.getServiceAreas();
      setAreas(data);
    } catch (error) {
      console.error('Failed to fetch service areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (area: ServiceArea) => {
    try {
      await apiService.updateServiceArea(area.id, { isActive: !area.isActive });
      fetchAreas();
    } catch (error) {
      console.error('Failed to toggle area:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service area?')) return;
    try {
      await apiService.deleteServiceArea(id);
      fetchAreas();
    } catch (error) {
      console.error('Failed to delete area:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await apiService.updateServiceArea(editingArea.id, {
          name: newArea.name,
          city: newArea.city,
          state: newArea.state,
          latitude: newArea.latitude ? Number(newArea.latitude) : undefined,
          longitude: newArea.longitude ? Number(newArea.longitude) : undefined,
          radiusKm: newArea.radiusKm ? Number(newArea.radiusKm) : undefined,
        });
      } else {
        await apiService.createServiceArea({
          name: newArea.name,
          city: newArea.city,
          state: newArea.state,
          latitude: newArea.latitude ? Number(newArea.latitude) : undefined,
          longitude: newArea.longitude ? Number(newArea.longitude) : undefined,
          radiusKm: newArea.radiusKm ? Number(newArea.radiusKm) : undefined,
          isActive: true,
        });
      }
      setShowModal(false);
      setEditingArea(null);
      setNewArea({ name: '', city: '', state: '', latitude: '', longitude: '', radiusKm: '' });
      fetchAreas();
    } catch (error) {
      console.error('Failed to save area:', error);
    }
  };

  const openEdit = (area: ServiceArea) => {
    setEditingArea(area);
    setNewArea({
      name: area.name,
      city: area.city,
      state: area.state || '',
      latitude: area.latitude?.toString() || '',
      longitude: area.longitude?.toString() || '',
      radiusKm: area.radiusKm?.toString() || '',
    });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Service Areas</h1>
        <button
          onClick={() => { setEditingArea(null); setNewArea({ name: '', city: '', state: '', latitude: '', longitude: '', radiusKm: '' }); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Area
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Radius (km)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : areas.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">No service areas found</td></tr>
            ) : (
              areas.map((area) => (
                <tr key={area.id}>
                  <td className="px-6 py-4">{area.name}</td>
                  <td className="px-6 py-4">{area.city}</td>
                  <td className="px-6 py-4">{area.radiusKm ?? 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(area)}
                      className={`px-2 py-1 text-xs rounded-full ${area.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {area.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(area)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button onClick={() => handleDelete(area.id)} className="text-red-600 hover:text-red-800">Delete</button>
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
            <h2 className="text-xl font-bold mb-4">{editingArea ? 'Edit' : 'Add'} Service Area</h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={newArea.city}
                  onChange={(e) => setNewArea({ ...newArea, city: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  value={newArea.state}
                  onChange={(e) => setNewArea({ ...newArea, state: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newArea.latitude}
                    onChange={(e) => setNewArea({ ...newArea, latitude: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newArea.longitude}
                    onChange={(e) => setNewArea({ ...newArea, longitude: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Radius (km)</label>
                <input
                  type="number"
                  value={newArea.radiusKm}
                  onChange={(e) => setNewArea({ ...newArea, radiusKm: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingArea ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
