'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface FormData {
  vehicleType: string;
  companyBrand: string;
  registrationNumber: string;
  engineNumber: string;
  chassisNumber: string;
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

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [includeDropOff, setIncludeDropOff] = useState(false);
  const [includePickUp, setIncludePickUp] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    vehicleType: 'bike',
    companyBrand: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    owner: {
      name: '',
      address: '',
      mobile: '',
      idProofType: 'Aadhar Card',
      idProofNumber: '',
    },
    dateSubmitted: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('owner.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        owner: { ...formData.owner, [field]: value },
      });
    } else if (name.startsWith('dropOffPerson.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        dropOffPerson: { ...formData.dropOffPerson!, [field]: value },
      });
    } else if (name.startsWith('pickUpPerson.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        pickUpPerson: { ...formData.pickUpPerson!, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData: any = { ...formData };
      if (!includeDropOff) {
        delete submitData.dropOffPerson;
      }
      if (!includePickUp) {
        delete submitData.pickUpPerson;
      }

      const response = await api.createVehicle(submitData);

      if (response.success) {
        alert('Vehicle entry created successfully!');
        router.push('/vehicles');
      } else {
        setError(response.message || 'Failed to create vehicle entry');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Vehicle Entry</h1>
        <p className="text-gray-600 mt-1">Fill in all mandatory fields to register a vehicle</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle Type *</label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="truck">Truck</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Company/Brand *</label>
              <input
                type="text"
                name="companyBrand"
                value={formData.companyBrand}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g., Honda, Toyota"
              />
            </div>

            <div>
              <label className="label">Registration Number *</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
                className="input-field uppercase"
                placeholder="e.g., MH12AB1234"
              />
            </div>

            <div>
              <label className="label">Engine Number *</label>
              <input
                type="text"
                name="engineNumber"
                value={formData.engineNumber}
                onChange={handleChange}
                required
                className="input-field uppercase"
                placeholder="Engine number"
              />
            </div>

            <div>
              <label className="label">Chassis Number *</label>
              <input
                type="text"
                name="chassisNumber"
                value={formData.chassisNumber}
                onChange={handleChange}
                required
                className="input-field uppercase"
                placeholder="Chassis number"
              />
            </div>

            <div>
              <label className="label">Date Submitted *</label>
              <input
                type="date"
                name="dateSubmitted"
                value={formData.dateSubmitted}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Owner Name *</label>
              <input
                type="text"
                name="owner.name"
                value={formData.owner.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Full name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Address *</label>
              <textarea
                name="owner.address"
                value={formData.owner.address}
                onChange={handleChange}
                required
                rows={2}
                className="input-field"
                placeholder="Complete address"
              />
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
                className="input-field"
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label className="label">ID Proof Type *</label>
              <select
                name="owner.idProofType"
                value={formData.owner.idProofType}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">ID Proof Number *</label>
              <input
                type="text"
                name="owner.idProofNumber"
                value={formData.owner.idProofNumber}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="ID proof number"
              />
            </div>
          </div>
        </div>

        {/* Drop-off Person (Optional) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Drop-off Person (Optional)
            </h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDropOff}
                onChange={(e) => {
                  setIncludeDropOff(e.target.checked);
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      dropOffPerson: {
                        name: '',
                        address: '',
                        mobile: '',
                        idProofType: 'Aadhar Card',
                        idProofNumber: '',
                        relationToOwner: '',
                      },
                    });
                  } else {
                    const { dropOffPerson, ...rest } = formData;
                    setFormData(rest);
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Different person dropping off
              </span>
            </label>
          </div>

          {includeDropOff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Person Name</label>
                <input
                  type="text"
                  name="dropOffPerson.name"
                  value={formData.dropOffPerson?.name || ''}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input
                  type="text"
                  name="dropOffPerson.relationToOwner"
                  value={formData.dropOffPerson?.relationToOwner || ''}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Friend, Employee, Family"
                />
              </div>

              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="tel"
                  name="dropOffPerson.mobile"
                  value={formData.dropOffPerson?.mobile || ''}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  className="input-field"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="label">ID Proof Type</label>
                <select
                  name="dropOffPerson.idProofType"
                  value={formData.dropOffPerson?.idProofType || 'Aadhar Card'}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">ID Proof Number</label>
                <input
                  type="text"
                  name="dropOffPerson.idProofNumber"
                  value={formData.dropOffPerson?.idProofNumber || ''}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="ID proof number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea
                  name="dropOffPerson.address"
                  value={formData.dropOffPerson?.address || ''}
                  onChange={handleChange}
                  rows={2}
                  className="input-field"
                  placeholder="Complete address"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pick-up Person (Optional) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Pick-up Person (Optional)
            </h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includePickUp}
                onChange={(e) => {
                  setIncludePickUp(e.target.checked);
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      pickUpPerson: {
                        name: '',
                        address: '',
                        mobile: '',
                        idProofType: 'Aadhar Card',
                        idProofNumber: '',
                        relationToOwner: '',
                      },
                    });
                  } else {
                    const { pickUpPerson, ...rest } = formData;
                    setFormData(rest);
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Different person picking up
              </span>
            </label>
          </div>

          {includePickUp && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Person Name</label>
                <input
                  type="text"
                  name="pickUpPerson.name"
                  value={formData.pickUpPerson?.name || ''}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input
                  type="text"
                  name="pickUpPerson.relationToOwner"
                  value={formData.pickUpPerson?.relationToOwner || ''}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Friend, Employee, Family"
                />
              </div>

              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="tel"
                  name="pickUpPerson.mobile"
                  value={formData.pickUpPerson?.mobile || ''}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  className="input-field"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="label">ID Proof Type</label>
                <select
                  name="pickUpPerson.idProofType"
                  value={formData.pickUpPerson?.idProofType || 'Aadhar Card'}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">ID Proof Number</label>
                <input
                  type="text"
                  name="pickUpPerson.idProofNumber"
                  value={formData.pickUpPerson?.idProofNumber || ''}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="ID proof number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea
                  name="pickUpPerson.address"
                  value={formData.pickUpPerson?.address || ''}
                  onChange={handleChange}
                  rows={2}
                  className="input-field"
                  placeholder="Complete address"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Vehicle Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
