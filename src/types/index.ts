export type UserRole = 'admin' | 'manager' | 'staff';

export type VehicleType = 'bike' | 'car' | 'truck' | 'other';

export type VehicleStatus = 'in_service' | 'delivered' | 'pending';

export type DocumentType = 'rc' | 'id_proof_owner' | 'id_proof_person';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  stationId: Station | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  _id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Owner {
  _id?: string;
  name: string;
  address: string;
  mobile: string;
  idProofType: string;
  idProofNumber: string;
}

export interface Person {
  _id?: string;
  name: string;
  address: string;
  mobile: string;
  idProofType: string;
  idProofNumber: string;
  relationToOwner: string;
}

export interface VehicleDocument {
  type: DocumentType;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: string;
}

export interface Vehicle {
  _id: string;
  serialNumber: string;
  vehicleType: VehicleType;
  companyBrand: string;
  registrationNumber: string;
  engineNumber: string;
  chassisNumber: string;
  ownerId: Owner;
  dropOffPersonId?: Person;
  pickUpPersonId?: Person;
  dateSubmitted: string;
  dateCollected?: string;
  status: VehicleStatus;
  stationId: Station;
  documents: VehicleDocument[];
  createdBy: User | string;
  updatedBy?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalToday: number;
  pendingDeliveries: number;
  completedEntries: number;
  alerts: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
