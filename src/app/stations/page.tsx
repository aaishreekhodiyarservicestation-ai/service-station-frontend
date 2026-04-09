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
}

interface StationStats {
  totalToday: number;
  pendingDeliveries: number;
  completedEntries: number;
  alerts: number;
}

const emptyForm = { name: '', address: '', contactNumber: '', email: '', isActive: true };

export default function StationsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [stations, setStations] = useState<Station[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, StationStats>>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    if (user?.role !== 'admin') { router.push('/dashboard'); return; }
    fetchStations();
  }, [token, user]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.getStations();
      if (response.success) {
        setStations(response.data);
        fetchAllStats(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching stations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStats = async (stationList: Station[]) => {
    setStatsLoading(true);
    const results: Record<string, StationStats> = {};
    await Promise.all(
      stationList.filter(s => s.isActive).map(async (s) => {
        try {
          const res = await api.getStationStats(s._id);
          if (res.success) results[s._id] = res.data;
        } catch {}
      })
    );
    setStatsMap(results);
    setStatsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = editingStation
        ? await api.updateStation(editingStation._id, formData)
        : await api.createStation(formData);
      if (response.success) {
        fetchStations();
        closeModal();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving station');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this station? Staff assigned to it will lose station access.')) return;
    try {
      await api.deleteStation(id);
      fetchStations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deactivating station');
    }
  };

  const openModal = (station?: Station) => {
    if (station) {
      setEditingStation(station);
      setFormData({ name: station.name, address: station.address, contactNumber: station.contactNumber, email: station.email, isActive: station.isActive });
    } else {
      setEditingStation(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingStation(null); setFormData(emptyForm); };

  const activeStations = stations.filter(s => s.isActive);
  const inactiveStations = stations.filter(s => !s.isActive);

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Station Management</h1>
            <p className="text-gray-500 mt-1">{activeStations.length} active station{activeStations.length !== 1 ? 's' : ''} · {inactiveStations.length} inactive</p>
          </div>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Station
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary banner */}
        {activeStations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Active Stations', value: activeStations.length, color: 'text-primary-600', bg: 'bg-primary-50' },
              { label: "Today's Vehicles", value: Object.values(statsMap).reduce((a, s) => a + s.totalToday, 0), color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Pending Deliveries', value: Object.values(statsMap).reduce((a, s) => a + s.pendingDeliveries, 0), color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Completed Today', value: Object.values(statsMap).reduce((a, s) => a + s.completedEntries, 0), color: 'text-green-600', bg: 'bg-green-50' },
            ].map(item => (
              <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
                <p className={`text-2xl font-bold ${item.color}`}>{statsLoading ? '—' : item.value}</p>
                <p className="text-sm text-gray-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Active Stations */}
        {activeStations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">No stations yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first service station to get started</p>
            <button onClick={() => openModal()} className="mt-4 btn-primary">Create First Station</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {activeStations.map((station) => {
              const stats = statsMap[station._id];
              return (
                <div key={station._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{station.name}</h3>
                        <p className="text-primary-200 text-sm mt-1 flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {station.address}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-green-400 bg-opacity-30 text-white text-xs font-medium rounded-full">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    {[
                      { label: 'Today', value: statsLoading ? '…' : (stats?.totalToday ?? '—') },
                      { label: 'Pending', value: statsLoading ? '…' : (stats?.pendingDeliveries ?? '—') },
                      { label: 'Done', value: statsLoading ? '…' : (stats?.completedEntries ?? '—') },
                    ].map(item => (
                      <div key={item.label} className="py-3 text-center">
                        <p className="text-xl font-bold text-gray-800">{item.value}</p>
                        <p className="text-xs text-gray-400">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Contact info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {station.contactNumber}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {station.email}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button onClick={() => openModal(station)} className="flex-1 btn-primary text-sm py-2">
                      Edit Station
                    </button>
                    <button onClick={() => handleDeactivate(station._id)} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inactive stations */}
        {inactiveStations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-4">Inactive Stations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {inactiveStations.map((station) => (
                <div key={station._id} className="bg-white rounded-xl border border-gray-100 p-4 opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">{station.name}</h3>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Inactive</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{station.address}</p>
                  <button onClick={() => openModal(station)} className="w-full btn-secondary text-sm py-1.5">
                    Reactivate / Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStation ? 'Edit Station' : 'Add New Station'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Station Name *</label>
                <input type="text" className="input-field" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Address *</label>
                <textarea className="input-field" rows={2} value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Number *</label>
                  <input type="tel" className="input-field" value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input-field" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              </div>
              {editingStation && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" id="stationActive" checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                  <label htmlFor="stationActive" className="text-sm font-medium text-gray-700">
                    Station is active
                  </label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : editingStation ? 'Update Station' : 'Create Station'}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
