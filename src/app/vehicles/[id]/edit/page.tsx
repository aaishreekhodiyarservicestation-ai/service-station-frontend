'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { Payment } from '@/types';

interface Owner {
  _id: string;
  name: string;
  address: string;
  mobile: string;
  idProofType: string;
  idProofNumber: string;
}

interface Person {
  _id: string;
  name: string;
  address: string;
  mobile: string;
  idProofType: string;
  idProofNumber: string;
  relationToOwner: string;
}

interface Vehicle {
  _id: string;
  serialNumber: string;
  vehicleType: string;
  companyBrand: string;
  modelNumber?: string;
  registrationNumber: string;
  engineNumber?: string;
  chassisNumber?: string;
  kmDriven?: number;
  description?: string;
  ownerId: Owner;
  dropOffPersonId?: Person;
  pickUpPersonId?: Person;
  dateSubmitted: string;
  dateCollected?: string;
  status: string;
  advancePayment: number;
  payments: Payment[];
  stationId: { _id: string; name: string };
}

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const [includeDropOff, setIncludeDropOff] = useState(false);
  const [includePickUp, setIncludePickUp] = useState(false);

  // Next service date modal (shown when status → delivered)
  const [showServiceDateModal, setShowServiceDateModal] = useState(false);
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);

  // Payment UI state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDesc, setNewPaymentDesc] = useState('');
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [formData, setFormData] = useState({
    vehicleType: '',
    companyBrand: '',
    modelNumber: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    kmDriven: '',
    description: '',
    dateSubmitted: '',
    dateCollected: '',
    status: 'pending',
    ownerName: '',
    ownerAddress: '',
    ownerMobile: '',
    ownerIdProofType: '',
    ownerIdProofNumber: '',
    dropOffPersonName: '',
    dropOffPersonAddress: '',
    dropOffPersonMobile: '',
    dropOffPersonIdProofType: '',
    dropOffPersonIdProofNumber: '',
    dropOffPersonRelation: '',
    pickUpPersonName: '',
    pickUpPersonAddress: '',
    pickUpPersonMobile: '',
    pickUpPersonIdProofType: '',
    pickUpPersonIdProofNumber: '',
    pickUpPersonRelation: '',
  });

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      alert('Access denied. Only managers and admins can edit vehicles.');
      router.push('/vehicles');
      return;
    }
    fetchVehicleDetails();
  }, [token, user, params.id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getVehicle(params.id as string);
      if (response.success) {
        const v = response.data;
        setVehicle(v);
        setIncludeDropOff(!!v.dropOffPersonId);
        setIncludePickUp(!!v.pickUpPersonId);
        setFormData({
          vehicleType: v.vehicleType,
          companyBrand: v.companyBrand,
          modelNumber: v.modelNumber || '',
          registrationNumber: v.registrationNumber,
          engineNumber: v.engineNumber || '',
          chassisNumber: v.chassisNumber || '',
          kmDriven: v.kmDriven !== undefined ? String(v.kmDriven) : '',
          description: v.description || '',
          dateSubmitted: v.dateSubmitted?.split('T')[0] || '',
          dateCollected: v.dateCollected?.split('T')[0] || '',
          status: v.status,
          ownerName: v.ownerId?.name || '',
          ownerAddress: v.ownerId?.address || '',
          ownerMobile: v.ownerId?.mobile || '',
          ownerIdProofType: v.ownerId?.idProofType || '',
          ownerIdProofNumber: v.ownerId?.idProofNumber || '',
          dropOffPersonName: v.dropOffPersonId?.name || '',
          dropOffPersonAddress: v.dropOffPersonId?.address || '',
          dropOffPersonMobile: v.dropOffPersonId?.mobile || '',
          dropOffPersonIdProofType: v.dropOffPersonId?.idProofType || '',
          dropOffPersonIdProofNumber: v.dropOffPersonId?.idProofNumber || '',
          dropOffPersonRelation: v.dropOffPersonId?.relationToOwner || '',
          pickUpPersonName: v.pickUpPersonId?.name || '',
          pickUpPersonAddress: v.pickUpPersonId?.address || '',
          pickUpPersonMobile: v.pickUpPersonId?.mobile || '',
          pickUpPersonIdProofType: v.pickUpPersonId?.idProofType || '',
          pickUpPersonIdProofNumber: v.pickUpPersonId?.idProofNumber || '',
          pickUpPersonRelation: v.pickUpPersonId?.relationToOwner || '',
        });
      } else {
        setError('Failed to fetch vehicle details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const buildUpdateData = () => {
    const updateData: any = {
      vehicleType: formData.vehicleType,
      companyBrand: formData.companyBrand,
      modelNumber: formData.modelNumber || undefined,
      registrationNumber: formData.registrationNumber.toUpperCase(),
      engineNumber: formData.engineNumber.toUpperCase() || undefined,
      chassisNumber: formData.chassisNumber.toUpperCase() || undefined,
      kmDriven: formData.kmDriven !== '' ? Number(formData.kmDriven) : undefined,
      description: formData.description || undefined,
      dateSubmitted: formData.dateSubmitted,
      dateCollected: formData.dateCollected || undefined,
      status: formData.status,
      owner: {
        name: formData.ownerName,
        address: formData.ownerAddress,
        mobile: formData.ownerMobile,
        idProofType: formData.ownerIdProofType || undefined,
        idProofNumber: formData.ownerIdProofNumber || undefined,
      },
    };
    if (includeDropOff) {
      updateData.dropOffPerson = {
        name: formData.dropOffPersonName,
        address: formData.dropOffPersonAddress,
        mobile: formData.dropOffPersonMobile,
        idProofType: formData.dropOffPersonIdProofType || undefined,
        idProofNumber: formData.dropOffPersonIdProofNumber || undefined,
        relationToOwner: formData.dropOffPersonRelation,
      };
    } else {
      updateData.dropOffPerson = null;
    }
    if (includePickUp) {
      updateData.pickUpPerson = {
        name: formData.pickUpPersonName,
        address: formData.pickUpPersonAddress,
        mobile: formData.pickUpPersonMobile,
        idProofType: formData.pickUpPersonIdProofType || undefined,
        idProofNumber: formData.pickUpPersonIdProofNumber || undefined,
        relationToOwner: formData.pickUpPersonRelation,
      };
    } else {
      updateData.pickUpPerson = null;
    }
    return updateData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If status is being set to delivered, show next service date modal first
    const wasDelivered = vehicle?.status === 'delivered';
    if (formData.status === 'delivered' && !wasDelivered) {
      const data = buildUpdateData();
      setPendingUpdateData(data);
      // Default: dateSubmitted + 3 months
      const base = formData.dateSubmitted ? new Date(formData.dateSubmitted) : new Date();
      base.setMonth(base.getMonth() + 3);
      setNextServiceDate(base.toISOString().split('T')[0]);
      setShowServiceDateModal(true);
      return;
    }

    await doSave(buildUpdateData());
  };

  const doSave = async (updateData: any) => {
    setError('');
    setFieldErrors({});
    try {
      setSubmitting(true);
      const response = await api.updateVehicle(params.id as string, updateData);
      if (response.success) {
        router.push(`/vehicles/${params.id}`);
      } else {
        setError(response.message || 'Failed to update vehicle');
        setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const map: Record<string, string> = {};
        data.errors.forEach((e: any) => { const path = e.path || e.param || ''; map[path] = e.msg; });
        setFieldErrors(map);
        setError('Please fix the errors below before saving.');
      } else {
        setError(data?.message || 'Error updating vehicle');
      }
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceDateConfirm = async () => {
    if (!nextServiceDate) {
      alert('Please select a next service date');
      return;
    }
    const updateData = { ...pendingUpdateData };
    updateData.nextServiceDate = nextServiceDate;
    updateData.serviceReminderDate = nextServiceDate;
    updateData.serviceReminderStatus = 'pending';
    setShowServiceDateModal(false);
    await doSave(updateData);
  };

  const handleAddPaymentConfirm = async () => {
    if (!newPaymentAmount || Number(newPaymentAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setSavingPayment(true);
    try {
      const response = await api.addPayment(params.id as string, Number(newPaymentAmount), newPaymentDesc);
      if (response.success) {
        // Refresh vehicle to get updated payments
        const refreshed = await api.getVehicle(params.id as string);
        if (refreshed.success) setVehicle(refreshed.data);
        setNewPaymentAmount('');
        setNewPaymentDesc('');
        setShowAddPayment(false);
        setShowPaymentConfirm(false);
      } else {
        alert(response.message || 'Failed to add payment');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const totalPaid = (vehicle: Vehicle) => {
    const paymentSum = vehicle.payments.reduce((sum, p) => sum + p.amount, 0);
    return vehicle.advancePayment + paymentSum;
  };

  const idProofOptions = (
    <>
      <option value="">-- None --</option>
      <option value="Aadhar Card">Aadhar Card</option>
      <option value="PAN Card">PAN Card</option>
      <option value="Driving License">Driving License</option>
      <option value="Passport">Passport</option>
      <option value="Voter ID">Voter ID</option>
      <option value="Other">Other</option>
    </>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 text-lg">{error || 'Vehicle not found'}</p>
        <button onClick={() => router.push('/vehicles')} className="mt-4 btn-primary">Back to Vehicles</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <button onClick={() => router.push(`/vehicles/${params.id}`)} className="text-primary-600 hover:text-primary-700 mb-2 flex items-center">
          ← Back to Vehicle Details
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
        <p className="text-gray-600 mt-1">Serial Number: {vehicle.serialNumber}</p>
      </div>

      {/* Error banner */}
      {(error || Object.keys(fieldErrors).length > 0) && (
        <div ref={errorBannerRef} className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">{error}</p>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {Object.entries(fieldErrors).map(([path, msg]) => (
                    <li key={path} className="text-sm text-red-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                      <span className="font-medium">{path}:</span> {msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle Type *</label>
              <select className="input-field" value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })} required>
                <option value="gear">Gear Bike</option>
                <option value="non_gear">Non-Gear Bike</option>
              </select>
            </div>

            <div>
              <label className="label">Company/Brand *</label>
              <input type="text" className="input-field" value={formData.companyBrand} onChange={(e) => setFormData({ ...formData, companyBrand: e.target.value })} required />
            </div>

            <div>
              <label className="label">Model Number</label>
              <input type="text" className="input-field" value={formData.modelNumber} onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })} placeholder="e.g., Activa 6G" />
            </div>

            <div>
              <label className="label">Registration Number *</label>
              <input type="text" className="input-field uppercase" value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })} required />
            </div>

            <div>
              <label className="label">Engine Number</label>
              <input type="text" className="input-field uppercase" value={formData.engineNumber} onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value.toUpperCase() })} placeholder="Optional" />
            </div>

            <div>
              <label className="label">Chassis Number</label>
              <input type="text" className="input-field uppercase" value={formData.chassisNumber} onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value.toUpperCase() })} placeholder="Optional" />
            </div>

            <div>
              <label className="label">KM Driven</label>
              <input type="number" className="input-field" min="0" value={formData.kmDriven} onChange={(e) => setFormData({ ...formData, kmDriven: e.target.value })} placeholder="Odometer reading" />
            </div>

            <div>
              <label className="label">Status *</label>
              <select className="input-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="label">Date Submitted *</label>
              <input type="date" className="input-field" value={formData.dateSubmitted} onChange={(e) => setFormData({ ...formData, dateSubmitted: e.target.value })} required />
            </div>

            <div>
              <label className="label">Date Collected</label>
              <input type="date" className="input-field" value={formData.dateCollected} onChange={(e) => setFormData({ ...formData, dateCollected: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description / Work Required</label>
              <textarea className="input-field" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the issue or work done..." />
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Owner Name *</label>
              <input type="text" className="input-field" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} required placeholder="Full name" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address *</label>
              <textarea className="input-field" rows={2} value={formData.ownerAddress} onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })} required placeholder="Complete address" />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input type="tel" className="input-field" value={formData.ownerMobile} onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })} required pattern="[0-9]{10}" placeholder="10-digit mobile number" />
            </div>
            <div>
              <label className="label">ID Proof Type</label>
              <select className="input-field" value={formData.ownerIdProofType} onChange={(e) => setFormData({ ...formData, ownerIdProofType: e.target.value })}>
                {idProofOptions}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">ID Proof Number</label>
              <input type="text" className="input-field" value={formData.ownerIdProofNumber} onChange={(e) => setFormData({ ...formData, ownerIdProofNumber: e.target.value })} placeholder="ID proof number (optional)" />
            </div>
          </div>
        </div>

        {/* Drop-off Person */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Drop-off Person (Optional)</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDropOff}
                onChange={(e) => {
                  setIncludeDropOff(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, dropOffPersonName: '', dropOffPersonAddress: '', dropOffPersonMobile: '', dropOffPersonIdProofType: '', dropOffPersonIdProofNumber: '', dropOffPersonRelation: '' });
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Different person dropping off</span>
            </label>
          </div>
          {includeDropOff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Person Name</label>
                <input type="text" className="input-field" value={formData.dropOffPersonName} onChange={(e) => setFormData({ ...formData, dropOffPersonName: e.target.value })} placeholder="Full name" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input type="text" className="input-field" value={formData.dropOffPersonRelation} onChange={(e) => setFormData({ ...formData, dropOffPersonRelation: e.target.value })} placeholder="e.g., Friend, Employee, Family" />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input type="tel" className="input-field" value={formData.dropOffPersonMobile} onChange={(e) => setFormData({ ...formData, dropOffPersonMobile: e.target.value })} pattern="[0-9]{10}" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="label">ID Proof Type</label>
                <select className="input-field" value={formData.dropOffPersonIdProofType} onChange={(e) => setFormData({ ...formData, dropOffPersonIdProofType: e.target.value })}>
                  {idProofOptions}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">ID Proof Number</label>
                <input type="text" className="input-field" value={formData.dropOffPersonIdProofNumber} onChange={(e) => setFormData({ ...formData, dropOffPersonIdProofNumber: e.target.value })} placeholder="ID proof number (optional)" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea className="input-field" rows={2} value={formData.dropOffPersonAddress} onChange={(e) => setFormData({ ...formData, dropOffPersonAddress: e.target.value })} placeholder="Complete address" />
              </div>
            </div>
          )}
        </div>

        {/* Pick-up Person */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pick-up Person (Optional)</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includePickUp}
                onChange={(e) => {
                  setIncludePickUp(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, pickUpPersonName: '', pickUpPersonAddress: '', pickUpPersonMobile: '', pickUpPersonIdProofType: '', pickUpPersonIdProofNumber: '', pickUpPersonRelation: '' });
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Different person picking up</span>
            </label>
          </div>
          {includePickUp && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Person Name</label>
                <input type="text" className="input-field" value={formData.pickUpPersonName} onChange={(e) => setFormData({ ...formData, pickUpPersonName: e.target.value })} placeholder="Full name" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input type="text" className="input-field" value={formData.pickUpPersonRelation} onChange={(e) => setFormData({ ...formData, pickUpPersonRelation: e.target.value })} placeholder="e.g., Friend, Employee, Family" />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input type="tel" className="input-field" value={formData.pickUpPersonMobile} onChange={(e) => setFormData({ ...formData, pickUpPersonMobile: e.target.value })} pattern="[0-9]{10}" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="label">ID Proof Type</label>
                <select className="input-field" value={formData.pickUpPersonIdProofType} onChange={(e) => setFormData({ ...formData, pickUpPersonIdProofType: e.target.value })}>
                  {idProofOptions}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">ID Proof Number</label>
                <input type="text" className="input-field" value={formData.pickUpPersonIdProofNumber} onChange={(e) => setFormData({ ...formData, pickUpPersonIdProofNumber: e.target.value })} placeholder="ID proof number (optional)" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea className="input-field" rows={2} value={formData.pickUpPersonAddress} onChange={(e) => setFormData({ ...formData, pickUpPersonAddress: e.target.value })} placeholder="Complete address" />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button type="submit" disabled={submitting} className="flex-1 btn-primary">
            {submitting ? 'Updating...' : 'Update Vehicle'}
          </button>
          <button type="button" onClick={() => router.push(`/vehicles/${params.id}`)} className="flex-1 btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      {/* Payment History — separate from the save form */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
          <span className="text-sm font-semibold text-gray-700">Total: ₹{totalPaid(vehicle).toLocaleString('en-IN')}</span>
        </div>

        {/* Ledger */}
        <div className="space-y-2 mb-4">
          {/* Advance */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-700">Advance (at intake)</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">₹{(vehicle.advancePayment || 0).toLocaleString('en-IN')}</span>
          </div>

          {/* Payment entries */}
          {vehicle.payments.map((p, i) => (
            <div key={p._id || i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-500 mr-2">
                  {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {p.description && <span className="text-sm text-gray-700">{p.description}</span>}
              </div>
              <span className="text-sm font-semibold text-gray-900">₹{p.amount.toLocaleString('en-IN')}</span>
            </div>
          ))}

          {vehicle.payments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No additional payments recorded yet</p>
          )}
        </div>

        {/* Add payment */}
        {!showAddPayment ? (
          <button
            type="button"
            onClick={() => setShowAddPayment(true)}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-primary-600 text-primary-600 font-bold text-base leading-none">+</span>
            Add Payment
          </button>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">New Payment Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 2000"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={newPaymentDesc}
                  onChange={(e) => setNewPaymentDesc(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Oil service, Parts replacement"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!newPaymentAmount || Number(newPaymentAmount) <= 0) {
                    alert('Please enter a valid amount');
                    return;
                  }
                  setShowPaymentConfirm(true);
                }}
                className="btn-primary text-sm"
              >
                Save Payment
              </button>
              <button
                type="button"
                onClick={() => { setShowAddPayment(false); setNewPaymentAmount(''); setNewPaymentDesc(''); }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Next Service Date Modal */}
      {showServiceDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Schedule Next Service</h3>
            <p className="text-sm text-gray-500 mb-5">
              Vehicle is being marked as <span className="font-medium text-green-600">Delivered</span>. Set a reminder for the owner's next service.
            </p>
            <div>
              <label className="label">Next Service Date</label>
              <input
                type="date"
                value={nextServiceDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNextServiceDate(e.target.value)}
                className="input-field"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Default is 3 months from date submitted. You can change it.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowServiceDateModal(false); doSave(pendingUpdateData!); }}
                className="flex-1 btn-secondary text-sm"
              >
                Skip Reminder
              </button>
              <button
                type="button"
                onClick={handleServiceDateConfirm}
                disabled={submitting}
                className="flex-1 btn-primary text-sm"
              >
                {submitting ? 'Saving...' : 'Save & Set Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowPaymentConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Payment</h3>
            <p className="text-gray-600 mb-1">
              Amount: <span className="font-semibold text-gray-900">₹{Number(newPaymentAmount).toLocaleString('en-IN')}</span>
            </p>
            {newPaymentDesc && (
              <p className="text-gray-600 mb-4">
                Description: <span className="font-semibold text-gray-900">{newPaymentDesc}</span>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">This payment will be permanently added to the payment history.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPaymentConfirm(false)} className="flex-1 btn-secondary" disabled={savingPayment}>
                Cancel
              </button>
              <button type="button" onClick={handleAddPaymentConfirm} className="flex-1 btn-primary" disabled={savingPayment}>
                {savingPayment ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
