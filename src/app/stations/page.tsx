'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Station {
  _id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StationsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    isActive: true,
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      alert('Access denied. Admin only.');
      router.push('/dashboard');
      return;
    }

    fetchStations();
  }, [token, user]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.getStations();

      if (response.success) {
        setStations(response.data);
      } else {
        setError('Failed to fetch stations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching stations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStation) {
        // Update station
        const response = await api.updateStation(editingStation._id, formData);

        if (response.success) {
          alert('Station updated successfully');
          fetchStations();
          handleCloseModal();
        }
      } else {
        // Create station
        const response = await api.createStation(formData);

        if (response.success) {
          alert('Station created successfully');
          fetchStations();
          handleCloseModal();
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving station');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this station?')) {
      return;
    }

    try {
      const response = await api.deleteStation(id);

      if (response.success) {
        alert('Station deactivated successfully');
        fetchStations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deactivating station');
    }
  };

  const handleOpenModal = (station?: Station) => {
    if (station) {
      setEditingStation(station);
      setFormData({
        name: station.name,
        address: station.address,
        contactNumber: station.contactNumber,
        email: station.email,
        isActive: station.isActive,
      });
    } else {
      setEditingStation(null);
      setFormData({
        name: '',
        address: '',
        contactNumber: '',
        email: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStation(null);
    setFormData({
      name: '',
      address: '',
      contactNumber: '',
      email: '',
      isActive: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stations Management</h1>
            <p className="text-gray-600 mt-1">Manage service station locations</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            + Add Station
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <div
              key={station._id}
              className={`card ${!station.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{station.name}</h3>
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                      station.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {station.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm font-medium">{station.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="text-sm font-medium">{station.contactNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium">{station.email}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleOpenModal(station)}
                  className="flex-1 btn-primary text-sm"
                >
                  Edit
                </button>
                {station.isActive && (
                  <button
                    onClick={() => handleDelete(station._id)}
                    className="flex-1 btn-danger text-sm"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {stations.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No stations found</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 btn-primary"
            >
              Create First Station
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingStation ? 'Edit Station' : 'Add New Station'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Station Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Address *</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Contact Number *</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 btn-primary">
                    {editingStation ? 'Update Station' : 'Create Station'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
