export type UserRole = 'admin' | 'manager' | 'staff';

export type VehicleType = 'gear' | 'non_gear';

export type VehicleStatus = 'pending' | 'completed' | 'delivered';

export type DocumentType = 'rc' | 'id_proof_owner' | 'id_proof_person';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
  isManagement: boolean;
  stationId?: Station | string | null;
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
  idProofType?: string;
  idProofNumber?: string;
}

export interface Person {
  _id?: string;
  name: string;
  address: string;
  mobile: string;
  idProofType?: string;
  idProofNumber?: string;
  relationToOwner: string;
}

export interface VehicleDocument {
  type: DocumentType;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: string;
}

export interface Payment {
  _id: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy: { _id: string; fullName: string } | string;
}

export interface Vehicle {
  _id: string;
  serialNumber: string;
  vehicleType: VehicleType;
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
  status: VehicleStatus;
  stationId: Station;
  documents: VehicleDocument[];
  advancePayment: number;
  payments: Payment[];
  nextServiceDate?: string;
  serviceReminderDate?: string;
  serviceReminderStatus?: 'pending' | 'completed';
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
