'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Tab = 'today' | 'upcoming' | 'completed';

interface ReminderVehicle {
  _id: string;
  serialNumber: string;
  registrationNumber: string;
  vehicleType: string;
  companyBrand: string;
  modelNumber?: string;
  dateSubmitted: string;
  nextServiceDate?: string;
  serviceReminderDate: string;
  serviceReminderStatus: 'pending' | 'completed';
  status: string;
  ownerId: {
    name: string;
    mobile: string;
    address: string;
  };
  stationId: { name: string };
}

export default function RemindersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('today');
  const [reminders, setReminders] = useState<ReminderVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<ReminderVehicle | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [tab]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await api.getReminders(tab);
      if (response.success) setReminders(response.data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (vehicleId: string, action: 'complete' | 'snooze_2h' | 'snooze_1d' | 'snooze_custom', snoozeDate?: string) => {
    if (action === 'snooze_custom' && !snoozeDate) return;
    setActionLoading(true);
    try {
      await api.updateReminder(vehicleId, action, snoozeDate);
      setSelectedVehicle(null);
      fetchReminders();
    } catch (err) {
      alert('Failed to update reminder');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: "Today's Reminders" },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
  ];

  const vehicleLabel = (v: ReminderVehicle) =>
    `${v.vehicleType === 'gear' ? 'Gear' : 'Non-Gear'} ${v.modelNumber ? `- ${v.modelNumber}` : ''} (${v.companyBrand})`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Service Reminders</h1>
        <p className="text-gray-600 mt-1">Track upcoming and due service reminders for vehicle owners</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-lg font-medium">No reminders</p>
          <p className="text-sm mt-1">
            {tab === 'today' ? "No service reminders due today" : tab === 'upcoming' ? "No upcoming reminders" : "No completed reminders"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map((v) => (
            <div
              key={v._id}
              onClick={() => { setSelectedVehicle(v); setCustomDate(''); }}
              className="card cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-base">{v.registrationNumber}</p>
                  <p className="text-sm text-gray-500">{vehicleLabel(v)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  v.serviceReminderStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {v.serviceReminderStatus === 'completed' ? 'Done' : 'Pending'}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">{v.ownerId?.name}</span>
                  <span className="text-gray-400">·</span>
                  <span>{v.ownerId?.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Submitted: {formatDate(v.dateSubmitted)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="font-medium text-orange-600">{formatDate(v.serviceReminderDate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedVehicle(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            {/* Modal Header */}
            <div className="bg-primary-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">{selectedVehicle.registrationNumber}</h3>
              <p className="text-primary-100 text-sm">{vehicleLabel(selectedVehicle)}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Owner</p>
                  <p className="font-semibold">{selectedVehicle.ownerId?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mobile</p>
                  <p className="font-semibold">{selectedVehicle.ownerId?.mobile}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date Submitted</p>
                  <p className="font-semibold">{formatDate(selectedVehicle.dateSubmitted)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Next Service</p>
                  <p className="font-semibold text-orange-600">{formatDate(selectedVehicle.serviceReminderDate)}</p>
                </div>
                {selectedVehicle.ownerId?.address && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Address</p>
                    <p className="font-semibold">{selectedVehicle.ownerId.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Station</p>
                  <p className="font-semibold">{selectedVehicle.stationId?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vehicle Status</p>
                  <p className="font-semibold capitalize">{selectedVehicle.status}</p>
                </div>
              </div>

              {selectedVehicle.serviceReminderStatus === 'pending' && (
                <>
                  <hr className="border-gray-100" />

                  {/* Quick action buttons */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Actions</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => handleAction(selectedVehicle._id, 'complete')}
                        disabled={actionLoading}
                        className="btn-primary text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Informed Owner — Mark as Done
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAction(selectedVehicle._id, 'snooze_2h')}
                          disabled={actionLoading}
                          className="btn-secondary text-sm"
                        >
                          Remind in 2 hours
                        </button>
                        <button
                          onClick={() => handleAction(selectedVehicle._id, 'snooze_1d')}
                          disabled={actionLoading}
                          className="btn-secondary text-sm"
                        >
                          Remind tomorrow
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom date snooze */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Remind on a specific date</p>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={customDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="input-field flex-1 text-sm"
                      />
                      <button
                        onClick={() => customDate && handleAction(selectedVehicle._id, 'snooze_custom', customDate)}
                        disabled={!customDate || actionLoading}
                        className="btn-secondary text-sm whitespace-nowrap"
                      >
                        Set Date
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedVehicle.serviceReminderStatus === 'completed' && (
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Owner has been informed about this service reminder.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedVehicle(null)} className="flex-1 btn-secondary text-sm">
                  Close
                </button>
                <button
                  onClick={() => { setSelectedVehicle(null); router.push(`/vehicles/${selectedVehicle._id}`); }}
                  className="flex-1 btn-primary text-sm"
                >
                  View Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
