'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface FormData {
  vehicleType: string;
  companyBrand: string;
  modelNumber: string;
  registrationNumber: string;
  engineNumber: string;
  chassisNumber: string;
  kmDriven: string;
  description: string;
  advancePayment: string;
  owner: {
    name: string;
    address: string;
    mobile: string;
    idProofType: string;
    idProofNumber: string;
  };
  dropOffPerson?: {
    name: string;
    address: string;
    mobile: string;
    idProofType: string;
    idProofNumber: string;
    relationToOwner: string;
  };
  pickUpPerson?: {
    name: string;
    address: string;
    mobile: string;
    idProofType: string;
    idProofNumber: string;
    relationToOwner: string;
  };
  dateSubmitted: string;
  status: string;
}

// Map API error paths to human-readable labels
const FIELD_LABELS: Record<string, string> = {
  vehicleType: 'Vehicle Type',
  companyBrand: 'Company / Brand',
  modelNumber: 'Model Number',
  registrationNumber: 'Registration Number',
  engineNumber: 'Engine Number',
  chassisNumber: 'Chassis Number',
  kmDriven: 'KM Driven',
  advancePayment: 'Advance Payment',
  dateSubmitted: 'Date Submitted',
  'owner.name': 'Owner Name',
  'owner.address': 'Owner Address',
  'owner.mobile': 'Owner Mobile',
  'owner.idProofType': 'Owner ID Proof Type',
  'owner.idProofNumber': 'Owner ID Proof Number',
  'dropOffPerson.name': 'Drop-off Person Name',
  'dropOffPerson.mobile': 'Drop-off Person Mobile',
  'dropOffPerson.address': 'Drop-off Person Address',
  'pickUpPerson.name': 'Pick-up Person Name',
  'pickUpPerson.mobile': 'Pick-up Person Mobile',
  'pickUpPerson.address': 'Pick-up Person Address',
};

export default function NewVehiclePage() {
  const router = useRouter();
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [includeDropOff, setIncludeDropOff] = useState(false);
  const [includePickUp, setIncludePickUp] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    vehicleType: 'gear',
    companyBrand: '',
    modelNumber: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    kmDriven: '',
    description: '',
    advancePayment: '0',
    owner: {
      name: '',
      address: '',
      mobile: '',
      idProofType: '',
      idProofNumber: '',
    },
    dateSubmitted: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  // Scroll to error banner whenever errors appear
  useEffect(() => {
    if ((globalError || Object.keys(fieldErrors).length > 0) && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [globalError, fieldErrors]);

  const clearErrors = () => {
    setGlobalError('');
    setFieldErrors({});
  };

  const AUTO_UPPERCASE_FIELDS = ['registrationNumber', 'engineNumber', 'chassisNumber'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    const value = AUTO_UPPERCASE_FIELDS.includes(name) ? e.target.value.toUpperCase() : e.target.value;

    // Clear the error for this specific field as the user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }

    if (name.startsWith('owner.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, owner: { ...formData.owner, [field]: value } });
    } else if (name.startsWith('dropOffPerson.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, dropOffPerson: { ...formData.dropOffPerson!, [field]: value } });
    } else if (name.startsWith('pickUpPerson.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, pickUpPerson: { ...formData.pickUpPerson!, [field]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const submitData: any = { ...formData };
      if (!includeDropOff) delete submitData.dropOffPerson;
      if (!includePickUp) delete submitData.pickUpPerson;
      if (submitData.kmDriven === '') delete submitData.kmDriven;
      if (submitData.advancePayment === '') submitData.advancePayment = 0;

      const response = await api.createVehicle(submitData);
      if (response.success) {
        router.push('/vehicles?created=1');
      } else {
        setGlobalError(response.message || 'Failed to create vehicle entry');
      }
    } catch (err: any) {
      const data = err.response?.data;

      // Parse express-validator errors array into per-field map
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const map: Record<string, string> = {};
        data.errors.forEach((e: any) => {
          const path = e.path || e.param || '';
          map[path] = e.msg;
        });
        setFieldErrors(map);
        setGlobalError('Please fix the errors below before submitting.');
      } else {
        setGlobalError(data?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper: get error for a field name
  const fe = (field: string) => fieldErrors[field];

  // Helper: input class with error state
  const inputClass = (field: string) =>
    `input-field ${fe(field) ? 'border-red-400 focus:ring-red-400 bg-red-50' : ''}`;

  const FieldError = ({ field }: { field: string }) =>
    fe(field) ? (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {fe(field)}
      </p>
    ) : null;

  const idProofOptions = (
    <>
      <option value="Aadhar Card">Aadhar Card</option>
      <option value="PAN Card">PAN Card</option>
      <option value="Driving License">Driving License</option>
      <option value="Passport">Passport</option>
      <option value="Voter ID">Voter ID</option>
      <option value="Other">Other</option>
    </>
  );

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Vehicle Entry</h1>
        <p className="text-gray-600 mt-1">Fill in the required fields to register a vehicle</p>
      </div>

      {/* Error banner */}
      {(globalError || hasFieldErrors) && (
        <div ref={errorBannerRef} className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">{globalError}</p>
              {hasFieldErrors && (
                <ul className="mt-2 space-y-1">
                  {Object.entries(fieldErrors).map(([path, msg]) => (
                    <li key={path} className="text-sm text-red-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                      <span className="font-medium">{FIELD_LABELS[path] || path}:</span> {msg}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle Type *</label>
              <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} required className={inputClass('vehicleType')}>
                <option value="gear">Gear Bike</option>
                <option value="non_gear">Non-Gear Bike</option>
              </select>
              <FieldError field="vehicleType" />
            </div>

            <div>
              <label className="label">Company / Brand *</label>
              <input type="text" name="companyBrand" value={formData.companyBrand} onChange={handleChange} required className={inputClass('companyBrand')} placeholder="e.g., Honda, Bajaj" />
              <FieldError field="companyBrand" />
            </div>

            <div>
              <label className="label">Model Number</label>
              <input type="text" name="modelNumber" value={formData.modelNumber} onChange={handleChange} className={inputClass('modelNumber')} placeholder="e.g., Activa 6G, Pulsar 150" />
              <FieldError field="modelNumber" />
            </div>

            <div>
              <label className="label">Registration Number *</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
                className={`${inputClass('registrationNumber')} uppercase`}
                placeholder="e.g., GJ12AB1234"
              />
              <FieldError field="registrationNumber" />
            </div>

            <div>
              <label className="label">Engine Number</label>
              <input type="text" name="engineNumber" value={formData.engineNumber} onChange={handleChange} className={`${inputClass('engineNumber')} uppercase`} placeholder="Engine number (optional)" />
              <FieldError field="engineNumber" />
            </div>

            <div>
              <label className="label">Chassis Number</label>
              <input type="text" name="chassisNumber" value={formData.chassisNumber} onChange={handleChange} className={`${inputClass('chassisNumber')} uppercase`} placeholder="Chassis number (optional)" />
              <FieldError field="chassisNumber" />
            </div>

            <div>
              <label className="label">KM Driven</label>
              <input type="number" name="kmDriven" value={formData.kmDriven} onChange={handleChange} min="0" className={inputClass('kmDriven')} placeholder="Current odometer reading" />
              <FieldError field="kmDriven" />
            </div>

            <div>
              <label className="label">Date Submitted *</label>
              <input type="date" name="dateSubmitted" value={formData.dateSubmitted} onChange={handleChange} required className={inputClass('dateSubmitted')} />
              <FieldError field="dateSubmitted" />
            </div>

            <div className="md:col-span-2">
              <label className="label">Description / Work Required</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={inputClass('description')} placeholder="Describe the issue or work required..." />
              <FieldError field="description" />
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Owner Name *</label>
              <input type="text" name="owner.name" value={formData.owner.name} onChange={handleChange} required className={inputClass('owner.name')} placeholder="Full name" />
              <FieldError field="owner.name" />
            </div>

            <div className="md:col-span-2">
              <label className="label">Address *</label>
              <textarea name="owner.address" value={formData.owner.address} onChange={handleChange} required rows={2} className={inputClass('owner.address')} placeholder="Complete address" />
              <FieldError field="owner.address" />
            </div>

            <div>
              <label className="label">Mobile Number *</label>
              <input
                type="tel"
                name="owner.mobile"
                value={formData.owner.mobile}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className={inputClass('owner.mobile')}
                placeholder="10-digit mobile number"
              />
              <FieldError field="owner.mobile" />
            </div>

            <div>
              <label className="label">ID Proof Type</label>
              <select name="owner.idProofType" value={formData.owner.idProofType} onChange={handleChange} className={inputClass('owner.idProofType')}>
                <option value="">-- None --</option>
                {idProofOptions}
              </select>
              <FieldError field="owner.idProofType" />
            </div>

            <div className="md:col-span-2">
              <label className="label">ID Proof Number</label>
              <input type="text" name="owner.idProofNumber" value={formData.owner.idProofNumber} onChange={handleChange} className={inputClass('owner.idProofNumber')} placeholder="ID proof number (optional)" />
              <FieldError field="owner.idProofNumber" />
            </div>
          </div>
        </div>

        {/* Drop-off Person (Optional) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Drop-off Person <span className="text-sm font-normal text-gray-400">(Optional)</span></h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeDropOff}
                onChange={(e) => {
                  setIncludeDropOff(e.target.checked);
                  if (e.target.checked) {
                    setFormData({ ...formData, dropOffPerson: { name: '', address: '', mobile: '', idProofType: '', idProofNumber: '', relationToOwner: '' } });
                  } else {
                    const { dropOffPerson, ...rest } = formData;
                    setFormData(rest);
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
                <input type="text" name="dropOffPerson.name" value={formData.dropOffPerson?.name || ''} onChange={handleChange} className={inputClass('dropOffPerson.name')} placeholder="Full name" />
                <FieldError field="dropOffPerson.name" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input type="text" name="dropOffPerson.relationToOwner" value={formData.dropOffPerson?.relationToOwner || ''} onChange={handleChange} className={inputClass('dropOffPerson.relationToOwner')} placeholder="e.g., Friend, Employee, Family" />
                <FieldError field="dropOffPerson.relationToOwner" />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input type="tel" name="dropOffPerson.mobile" value={formData.dropOffPerson?.mobile || ''} onChange={handleChange} pattern="[0-9]{10}" className={inputClass('dropOffPerson.mobile')} placeholder="10-digit mobile number" />
                <FieldError field="dropOffPerson.mobile" />
              </div>
              <div>
                <label className="label">ID Proof Type</label>
                <select name="dropOffPerson.idProofType" value={formData.dropOffPerson?.idProofType || ''} onChange={handleChange} className={inputClass('dropOffPerson.idProofType')}>
                  <option value="">-- None --</option>
                  {idProofOptions}
                </select>
                <FieldError field="dropOffPerson.idProofType" />
              </div>
              <div className="md:col-span-2">
                <label className="label">ID Proof Number</label>
                <input type="text" name="dropOffPerson.idProofNumber" value={formData.dropOffPerson?.idProofNumber || ''} onChange={handleChange} className={inputClass('dropOffPerson.idProofNumber')} placeholder="ID proof number (optional)" />
                <FieldError field="dropOffPerson.idProofNumber" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea name="dropOffPerson.address" value={formData.dropOffPerson?.address || ''} onChange={handleChange} rows={2} className={inputClass('dropOffPerson.address')} placeholder="Complete address" />
                <FieldError field="dropOffPerson.address" />
              </div>
            </div>
          )}

          {!includeDropOff && (
            <p className="text-sm text-gray-400 italic">No drop-off person — owner is dropping off the vehicle.</p>
          )}
        </div>

        {/* Pick-up Person (Optional) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pick-up Person <span className="text-sm font-normal text-gray-400">(Optional)</span></h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includePickUp}
                onChange={(e) => {
                  setIncludePickUp(e.target.checked);
                  if (e.target.checked) {
                    setFormData({ ...formData, pickUpPerson: { name: '', address: '', mobile: '', idProofType: '', idProofNumber: '', relationToOwner: '' } });
                  } else {
                    const { pickUpPerson, ...rest } = formData;
                    setFormData(rest);
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
                <input type="text" name="pickUpPerson.name" value={formData.pickUpPerson?.name || ''} onChange={handleChange} className={inputClass('pickUpPerson.name')} placeholder="Full name" />
                <FieldError field="pickUpPerson.name" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input type="text" name="pickUpPerson.relationToOwner" value={formData.pickUpPerson?.relationToOwner || ''} onChange={handleChange} className={inputClass('pickUpPerson.relationToOwner')} placeholder="e.g., Friend, Employee, Family" />
                <FieldError field="pickUpPerson.relationToOwner" />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input type="tel" name="pickUpPerson.mobile" value={formData.pickUpPerson?.mobile || ''} onChange={handleChange} pattern="[0-9]{10}" className={inputClass('pickUpPerson.mobile')} placeholder="10-digit mobile number" />
                <FieldError field="pickUpPerson.mobile" />
              </div>
              <div>
                <label className="label">ID Proof Type</label>
                <select name="pickUpPerson.idProofType" value={formData.pickUpPerson?.idProofType || ''} onChange={handleChange} className={inputClass('pickUpPerson.idProofType')}>
                  <option value="">-- None --</option>
                  {idProofOptions}
                </select>
                <FieldError field="pickUpPerson.idProofType" />
              </div>
              <div className="md:col-span-2">
                <label className="label">ID Proof Number</label>
                <input type="text" name="pickUpPerson.idProofNumber" value={formData.pickUpPerson?.idProofNumber || ''} onChange={handleChange} className={inputClass('pickUpPerson.idProofNumber')} placeholder="ID proof number (optional)" />
                <FieldError field="pickUpPerson.idProofNumber" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea name="pickUpPerson.address" value={formData.pickUpPerson?.address || ''} onChange={handleChange} rows={2} className={inputClass('pickUpPerson.address')} placeholder="Complete address" />
                <FieldError field="pickUpPerson.address" />
              </div>
            </div>
          )}

          {!includePickUp && (
            <p className="text-sm text-gray-400 italic">No pick-up person — owner will collect the vehicle.</p>
          )}
        </div>

        {/* Payment */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
          <div>
            <label className="label">Advance Payment (₹)</label>
            <input
              type="number"
              name="advancePayment"
              value={formData.advancePayment}
              onChange={handleChange}
              min="0"
              className={`${inputClass('advancePayment')} md:w-48`}
              placeholder="0"
            />
            <FieldError field="advancePayment" />
            <p className="text-xs text-gray-500 mt-1">Amount collected at the time of vehicle intake</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pb-6">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary min-w-[160px] disabled:opacity-60">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : 'Create Vehicle Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
