'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

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
  registrationNumber: string;
  engineNumber: string;
  chassisNumber: string;
  ownerId: Owner;
  dropOffPersonId?: Person;
  pickUpPersonId?: Person;
  dateSubmitted: string;
  dateCollected?: string;
  status: string;
  stationId: {
    _id: string;
    name: string;
  };
}

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [includeDropOff, setIncludeDropOff] = useState(false);
  const [includePickUp, setIncludePickUp] = useState(false);

  const [formData, setFormData] = useState({
    vehicleType: '',
    companyBrand: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
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
    if (!token) {
      router.push('/login');
      return;
    }

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
        const vehicleData = response.data;
        setVehicle(vehicleData);

        // Set checkbox states based on whether person data exists
        setIncludeDropOff(!!vehicleData.dropOffPersonId);
        setIncludePickUp(!!vehicleData.pickUpPersonId);

        // Pre-fill form with existing data
        setFormData({
          vehicleType: vehicleData.vehicleType,
          companyBrand: vehicleData.companyBrand,
          registrationNumber: vehicleData.registrationNumber,
          engineNumber: vehicleData.engineNumber,
          chassisNumber: vehicleData.chassisNumber,
          dateSubmitted: vehicleData.dateSubmitted?.split('T')[0] || '',
          dateCollected: vehicleData.dateCollected?.split('T')[0] || '',
          status: vehicleData.status,
          ownerName: vehicleData.ownerId?.name || '',
          ownerAddress: vehicleData.ownerId?.address || '',
          ownerMobile: vehicleData.ownerId?.mobile || '',
          ownerIdProofType: vehicleData.ownerId?.idProofType || '',
          ownerIdProofNumber: vehicleData.ownerId?.idProofNumber || '',
          dropOffPersonName: vehicleData.dropOffPersonId?.name || '',
          dropOffPersonAddress: vehicleData.dropOffPersonId?.address || '',
          dropOffPersonMobile: vehicleData.dropOffPersonId?.mobile || '',
          dropOffPersonIdProofType: vehicleData.dropOffPersonId?.idProofType || '',
          dropOffPersonIdProofNumber: vehicleData.dropOffPersonId?.idProofNumber || '',
          dropOffPersonRelation: vehicleData.dropOffPersonId?.relationToOwner || '',
          pickUpPersonName: vehicleData.pickUpPersonId?.name || '',
          pickUpPersonAddress: vehicleData.pickUpPersonId?.address || '',
          pickUpPersonMobile: vehicleData.pickUpPersonId?.mobile || '',
          pickUpPersonIdProofType: vehicleData.pickUpPersonId?.idProofType || '',
          pickUpPersonIdProofNumber: vehicleData.pickUpPersonId?.idProofNumber || '',
          pickUpPersonRelation: vehicleData.pickUpPersonId?.relationToOwner || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const updateData: any = {
        vehicleType: formData.vehicleType,
        companyBrand: formData.companyBrand,
        registrationNumber: formData.registrationNumber.toUpperCase(),
        engineNumber: formData.engineNumber.toUpperCase(),
        chassisNumber: formData.chassisNumber.toUpperCase(),
        dateSubmitted: formData.dateSubmitted,
        dateCollected: formData.dateCollected || undefined,
        status: formData.status,
        owner: {
          name: formData.ownerName,
          address: formData.ownerAddress,
          mobile: formData.ownerMobile,
          idProofType: formData.ownerIdProofType,
          idProofNumber: formData.ownerIdProofNumber,
        },
      };

      // Handle drop-off person - send null if unchecked to remove it
      if (includeDropOff) {
        updateData.dropOffPerson = {
          name: formData.dropOffPersonName,
          address: formData.dropOffPersonAddress,
          mobile: formData.dropOffPersonMobile,
          idProofType: formData.dropOffPersonIdProofType,
          idProofNumber: formData.dropOffPersonIdProofNumber,
          relationToOwner: formData.dropOffPersonRelation,
        };
      } else {
        updateData.dropOffPerson = null;
      }

      // Handle pick-up person - send null if unchecked to remove it
      if (includePickUp) {
        updateData.pickUpPerson = {
          name: formData.pickUpPersonName,
          address: formData.pickUpPersonAddress,
          mobile: formData.pickUpPersonMobile,
          idProofType: formData.pickUpPersonIdProofType,
          idProofNumber: formData.pickUpPersonIdProofNumber,
          relationToOwner: formData.pickUpPersonRelation,
        };
      } else {
        updateData.pickUpPerson = null;
      }

      const response = await api.updateVehicle(params.id as string, updateData);

      if (response.success) {
        alert('Vehicle updated successfully');
        router.push(`/vehicles/${params.id}`);
      } else {
        alert('Failed to update vehicle');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 text-lg">{error || 'Vehicle not found'}</p>
            <button
              onClick={() => router.push('/vehicles')}
              className="mt-4 btn-primary"
            >
              Back to Vehicles
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/vehicles/${params.id}`)}
            className="text-primary-600 hover:text-primary-700 mb-2 flex items-center"
          >
            ← Back to Vehicle Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
          <p className="text-gray-600 mt-1">Serial Number: {vehicle.serialNumber}</p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Vehicle Type *</label>
                <select
                  className="input-field"
                  value={formData.vehicleType}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleType: e.target.value })
                  }
                  required
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
                  className="input-field"
                  value={formData.companyBrand}
                  onChange={(e) =>
                    setFormData({ ...formData, companyBrand: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Registration Number *</label>
                <input
                  type="text"
                  className="input-field uppercase"
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Engine Number *</label>
                <input
                  type="text"
                  className="input-field uppercase"
                  value={formData.engineNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, engineNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Chassis Number *</label>
                <input
                  type="text"
                  className="input-field uppercase"
                  value={formData.chassisNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, chassisNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Status *</label>
                <select
                  className="input-field"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="in_service">In Service</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="label">Date Submitted *</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.dateSubmitted}
                  onChange={(e) =>
                    setFormData({ ...formData, dateSubmitted: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Date Collected</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.dateCollected}
                  onChange={(e) =>
                    setFormData({ ...formData, dateCollected: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Owner Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  required
                  placeholder="Full name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address *</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.ownerAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerAddress: e.target.value })
                  }
                  required
                  placeholder="Complete address"
                />
              </div>

              <div>
                <label className="label">Mobile Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.ownerMobile}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerMobile: e.target.value })
                  }
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="label">ID Proof Type *</label>
                <select
                  className="input-field"
                  value={formData.ownerIdProofType}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerIdProofType: e.target.value })
                  }
                  required
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
                  className="input-field"
                  value={formData.ownerIdProofNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerIdProofNumber: e.target.value })
                  }
                  required
                  placeholder="ID proof number"
                />
              </div>
            </div>
          </div>

          {/* Drop-off Person Information */}
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
                    if (!e.target.checked) {
                      // Clear drop-off person data when unchecked
                      setFormData({
                        ...formData,
                        dropOffPersonName: '',
                        dropOffPersonAddress: '',
                        dropOffPersonMobile: '',
                        dropOffPersonIdProofType: 'Aadhar Card',
                        dropOffPersonIdProofNumber: '',
                        dropOffPersonRelation: '',
                      });
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
                  className="input-field"
                  value={formData.dropOffPersonName}
                  onChange={(e) =>
                    setFormData({ ...formData, dropOffPersonName: e.target.value })
                  }
                  placeholder="Full name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.dropOffPersonRelation}
                  onChange={(e) =>
                    setFormData({ ...formData, dropOffPersonRelation: e.target.value })
                  }
                  placeholder="e.g., Friend, Employee, Family"
                />
              </div>

              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.dropOffPersonMobile}
                  onChange={(e) =>
                    setFormData({ ...formData, dropOffPersonMobile: e.target.value })
                  }
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="label">ID Proof Type</label>
                <select
                  className="input-field"
                  value={formData.dropOffPersonIdProofType}
                  onChange={(e) =>
                    setFormData({ ...formData, dropOffPersonIdProofType: e.target.value })
                  }
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
                  className="input-field"
                  value={formData.dropOffPersonIdProofNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, dropOffPersonIdProofNumber: e.target.value })
                  }
                  placeholder="ID proof number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.dropOffPersonAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, dropOffPersonAddress: e.target.value })
                  }
                  placeholder="Complete address"
                />
              </div>
            </div>
            )}
          </div>

          {/* Pick-up Person Information */}
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
                    if (!e.target.checked) {
                      // Clear pick-up person data when unchecked
                      setFormData({
                        ...formData,
                        pickUpPersonName: '',
                        pickUpPersonAddress: '',
                        pickUpPersonMobile: '',
                        pickUpPersonIdProofType: 'Aadhar Card',
                        pickUpPersonIdProofNumber: '',
                        pickUpPersonRelation: '',
                      });
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
                  className="input-field"
                  value={formData.pickUpPersonName}
                  onChange={(e) =>
                    setFormData({ ...formData, pickUpPersonName: e.target.value })
                  }
                  placeholder="Full name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Relation to Owner</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.pickUpPersonRelation}
                  onChange={(e) =>
                    setFormData({ ...formData, pickUpPersonRelation: e.target.value })
                  }
                  placeholder="e.g., Friend, Employee, Family"
                />
              </div>

              <div>
                <label className="label">Mobile Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.pickUpPersonMobile}
                  onChange={(e) =>
                    setFormData({ ...formData, pickUpPersonMobile: e.target.value })
                  }
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="label">ID Proof Type</label>
                <select
                  className="input-field"
                  value={formData.pickUpPersonIdProofType}
                  onChange={(e) =>
                    setFormData({ ...formData, pickUpPersonIdProofType: e.target.value })
                  }
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
                  className="input-field"
                  value={formData.pickUpPersonIdProofNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, pickUpPersonIdProofNumber: e.target.value })
                  }
                  placeholder="ID proof number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.pickUpPersonAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, pickUpPersonAddress: e.target.value })
                  }
                  placeholder="Complete address"
                />
              </div>
            </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary"
            >
              {submitting ? 'Updating...' : 'Update Vehicle'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/vehicles/${params.id}`)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
