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
  documents: Array<{
    type: string;
    cloudinaryUrl: string;
    uploadedAt: string;
  }>;
  stationId: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchVehicleDetails();
  }, [token, params.id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getVehicle(params.id as string);

      if (response.success) {
        setVehicle(response.data);
      } else {
        setError('Failed to fetch vehicle details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle entry?')) {
      return;
    }

    try {
      const response = await api.deleteVehicle(params.id as string);

      if (response.success) {
        alert('Vehicle entry deleted successfully');
        router.push('/vehicles');
      } else {
        alert('Failed to delete vehicle entry');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting vehicle entry');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_service':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/vehicles')}
              className="text-primary-600 hover:text-primary-700 mb-2 flex items-center"
            >
              ← Back to Vehicles
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Details</h1>
            <p className="text-gray-600 mt-1">Serial Number: {vehicle.serialNumber}</p>
          </div>
          <div className="flex gap-3">
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <>
                <button
                  onClick={() => router.push(`/vehicles/${params.id}/edit`)}
                  className="btn-primary"
                >
                  Edit Vehicle
                </button>
                <button onClick={handleDelete} className="btn-danger">
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Information */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-semibold">{vehicle.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle Type</p>
                  <p className="font-semibold capitalize">{vehicle.vehicleType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company/Brand</p>
                  <p className="font-semibold">{vehicle.companyBrand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engine Number</p>
                  <p className="font-semibold">{vehicle.engineNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chassis Number</p>
                  <p className="font-semibold">{vehicle.chassisNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      vehicle.status
                    )}`}
                  >
                    {vehicle.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{vehicle.ownerId.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mobile</p>
                  <p className="font-semibold">{vehicle.ownerId.mobile}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{vehicle.ownerId.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID Proof Type</p>
                  <p className="font-semibold">{vehicle.ownerId.idProofType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID Proof Number</p>
                  <p className="font-semibold">{vehicle.ownerId.idProofNumber}</p>
                </div>
              </div>
            </div>

            {/* Drop-off Person */}
            {vehicle.dropOffPersonId && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Drop-off Person</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{vehicle.dropOffPersonId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile</p>
                    <p className="font-semibold">{vehicle.dropOffPersonId.mobile}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold">{vehicle.dropOffPersonId.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Relation to Owner</p>
                    <p className="font-semibold">{vehicle.dropOffPersonId.relationToOwner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Proof</p>
                    <p className="font-semibold">
                      {vehicle.dropOffPersonId.idProofType} - {vehicle.dropOffPersonId.idProofNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pick-up Person */}
            {vehicle.pickUpPersonId && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Pick-up Person</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{vehicle.pickUpPersonId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile</p>
                    <p className="font-semibold">{vehicle.pickUpPersonId.mobile}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold">{vehicle.pickUpPersonId.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Relation to Owner</p>
                    <p className="font-semibold">{vehicle.pickUpPersonId.relationToOwner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Proof</p>
                    <p className="font-semibold">
                      {vehicle.pickUpPersonId.idProofType} - {vehicle.pickUpPersonId.idProofNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Timeline</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Date Submitted</p>
                  <p className="font-semibold">
                    {new Date(vehicle.dateSubmitted).toLocaleString()}
                  </p>
                </div>
                {vehicle.dateCollected && (
                  <div>
                    <p className="text-sm text-gray-600">Date Collected</p>
                    <p className="font-semibold">
                      {new Date(vehicle.dateCollected).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-semibold">{vehicle.createdBy.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Station</p>
                  <p className="font-semibold">{vehicle.stationId.name}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              <div className="space-y-3">
                {vehicle.documents.length > 0 ? (
                  vehicle.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {doc.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <a
                        href={doc.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        View Document →
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
