'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Vehicle } from '@/types';
import { formatDateTime, getStatusColor, getStatusLabel, getVehicleTypeLabel, downloadFile } from '@/lib/utils';

const today = () => new Date().toISOString().split('T')[0];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [exportDateFrom, setExportDateFrom] = useState(today());
  const [exportDateTo, setExportDateTo] = useState(today());
  const [exportAllDates, setExportAllDates] = useState(false);
  const [exportDownloading, setExportDownloading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [page, statusFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await api.getVehicles(params);
      if (response.success) {
        setVehicles(response.data);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVehicles();
  };

  const openExportModal = (format: 'pdf' | 'excel') => {
    setExportFormat(format);
    setExportDateFrom(today());
    setExportDateTo(today());
    setExportAllDates(false);
    setShowExportModal(true);
  };

  const applyQuickSelect = (preset: 'today' | 'last_week' | 'last_month' | 'last_year' | 'all') => {
    const now = new Date();
    if (preset === 'all') {
      setExportAllDates(true);
      return;
    }
    setExportAllDates(false);
    const end = now.toISOString().split('T')[0];
    let start: string;
    if (preset === 'today') {
      start = end;
    } else if (preset === 'last_week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'last_month') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      start = d.toISOString().split('T')[0];
    } else {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split('T')[0];
    }
    setExportDateFrom(start);
    setExportDateTo(end);
  };

  const handleExportDownload = async () => {
    setExportDownloading(true);
    try {
      const params: { format: 'pdf' | 'excel'; dateFrom?: string; dateTo?: string } = {
        format: exportFormat,
      };
      if (!exportAllDates) {
        params.dateFrom = exportDateFrom;
        params.dateTo = exportDateTo;
      }
      const response = await api.exportDailyRegister(params);
      const blob = new Blob([response.data]);
      const suffix = exportAllDates
        ? 'all'
        : exportDateFrom === exportDateTo
        ? exportDateFrom
        : `${exportDateFrom}-to-${exportDateTo}`;
      const filename = `register-${suffix}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
      downloadFile(blob, filename);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExportDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-0.5 text-sm sm:text-base">Manage all vehicle service records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openExportModal('pdf')} className="btn-secondary flex items-center text-sm px-3 py-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="ml-1.5 hidden xs:inline sm:inline">Export</span>
            <span className="ml-1 hidden sm:inline">PDF</span>
            <span className="ml-1 sm:hidden">PDF</span>
          </button>
          <button onClick={() => openExportModal('excel')} className="btn-secondary flex items-center text-sm px-3 py-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="ml-1 sm:hidden">XLS</span>
            <span className="ml-1.5 hidden sm:inline">Export Excel</span>
          </button>
          <Link href="/vehicles/new" className="btn-primary flex items-center text-sm px-3 py-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="ml-1.5">New Entry</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by registration number or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-field md:w-48"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Vehicles Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new vehicle entry.</p>
            <div className="mt-6">
              <Link href="/vehicles/new" className="btn-primary inline-flex">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Vehicle Entry
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile card list — shown below sm */}
            <div className="sm:hidden divide-y divide-gray-100">
              {vehicles.map((vehicle) => (
                <div key={vehicle._id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-base">{vehicle.registrationNumber}</p>
                      <p className="text-sm text-gray-500">{getVehicleTypeLabel(vehicle.vehicleType)} · {vehicle.companyBrand}</p>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                      {getStatusLabel(vehicle.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-0.5 mb-3">
                    <p className="font-medium">{vehicle.ownerId.name} <span className="font-normal text-gray-400">·</span> {vehicle.ownerId.mobile}</p>
                    <p className="text-xs text-gray-400">{vehicle.serialNumber} · {formatDateTime(vehicle.dateSubmitted)}</p>
                  </div>
                  <Link href={`/vehicles/${vehicle._id}`} className="block text-center btn-primary text-sm py-2">
                    View Details →
                  </Link>
                </div>
              ))}
            </div>

            {/* Desktop table — hidden on mobile */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.serialNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.registrationNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{getVehicleTypeLabel(vehicle.vehicleType)}</div>
                          <div className="text-gray-500">{vehicle.companyBrand}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{vehicle.ownerId.name}</div>
                          <div className="text-gray-500">{vehicle.ownerId.mobile}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(vehicle.dateSubmitted)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                          {getStatusLabel(vehicle.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/vehicles/${vehicle._id}`} className="text-primary-600 hover:text-primary-900">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary ml-3">Next</button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary">Next</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowExportModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Format Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  exportFormat === 'pdf'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                PDF
              </button>
              <button
                onClick={() => setExportFormat('excel')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  exportFormat === 'excel'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Excel
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Register</h2>
                <p className="text-sm text-gray-500 mt-1">Choose a date range for the export</p>
              </div>

              {/* Quick Select */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Select</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: 'Today', value: 'today' },
                    { label: 'Last 7 days', value: 'last_week' },
                    { label: 'Last 30 days', value: 'last_month' },
                    { label: 'Last year', value: 'last_year' },
                    { label: 'All records', value: 'all' },
                  ] as const).map(({ label, value }) => {
                    const isActive =
                      value === 'all'
                        ? exportAllDates
                        : !exportAllDates &&
                          (() => {
                            const end = today();
                            const now = new Date();
                            if (value === 'today') return exportDateFrom === end && exportDateTo === end;
                            if (value === 'last_week') {
                              const d = new Date(now); d.setDate(d.getDate() - 6);
                              return exportDateFrom === d.toISOString().split('T')[0] && exportDateTo === end;
                            }
                            if (value === 'last_month') {
                              const d = new Date(now); d.setDate(d.getDate() - 29);
                              return exportDateFrom === d.toISOString().split('T')[0] && exportDateTo === end;
                            }
                            if (value === 'last_year') {
                              const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
                              return exportDateFrom === d.toISOString().split('T')[0] && exportDateTo === end;
                            }
                            return false;
                          })();
                    return (
                      <button
                        key={value}
                        onClick={() => applyQuickSelect(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:text-primary-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range Inputs */}
              <div className={exportAllDates ? 'opacity-40 pointer-events-none' : ''}>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Custom Range</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">From</label>
                    <input
                      type="date"
                      value={exportDateFrom}
                      max={exportDateTo}
                      onChange={(e) => {
                        setExportDateFrom(e.target.value);
                        setExportAllDates(false);
                      }}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">To</label>
                    <input
                      type="date"
                      value={exportDateTo}
                      min={exportDateFrom}
                      max={today()}
                      onChange={(e) => {
                        setExportDateTo(e.target.value);
                        setExportAllDates(false);
                      }}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
                {exportAllDates
                  ? 'Downloading all records'
                  : exportDateFrom === exportDateTo
                  ? `Downloading records for ${new Date(exportDateFrom + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : `Downloading from ${new Date(exportDateFrom + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(exportDateTo + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportDownload}
                  disabled={exportDownloading}
                  className="flex-1 btn-primary flex items-center justify-center"
                >
                  {exportDownloading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download {exportFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
