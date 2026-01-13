import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Auth methods
  async login(credentials: { username: string; password: string }) {
    const response = await this.client.post('/auth/login', credentials);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    this.clearToken();
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async register(userData: any) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  // Vehicle methods
  async createVehicle(vehicleData: any) {
    const response = await this.client.post('/vehicles', vehicleData);
    return response.data;
  }

  async getVehicles(params?: any) {
    const response = await this.client.get('/vehicles', { params });
    return response.data;
  }

  async getVehicle(id: string) {
    const response = await this.client.get(`/vehicles/${id}`);
    return response.data;
  }

  async updateVehicle(id: string, vehicleData: any) {
    const response = await this.client.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  }

  async deleteVehicle(id: string) {
    const response = await this.client.delete(`/vehicles/${id}`);
    return response.data;
  }

  async uploadDocument(vehicleId: string, file: File, documentType: string) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const response = await this.client.post(`/vehicles/${vehicleId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDashboardStats(stationId?: string) {
    const params = stationId ? { stationId } : {};
    const response = await this.client.get('/vehicles/stats/dashboard', { params });
    return response.data;
  }

  // Station methods
  async createStation(stationData: any) {
    const response = await this.client.post('/stations', stationData);
    return response.data;
  }

  async getStations() {
    const response = await this.client.get('/stations');
    return response.data;
  }

  async getStation(id: string) {
    const response = await this.client.get(`/stations/${id}`);
    return response.data;
  }

  async updateStation(id: string, stationData: any) {
    const response = await this.client.put(`/stations/${id}`, stationData);
    return response.data;
  }

  async deleteStation(id: string) {
    const response = await this.client.delete(`/stations/${id}`);
    return response.data;
  }

  // User methods
  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async getUser(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, userData: any) {
    const response = await this.client.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // Report methods
  async exportDailyRegister(params: { format: 'pdf' | 'excel'; date?: string; stationId?: string }) {
    const response = await this.client.get('/reports/daily-register', {
      params,
      responseType: 'blob',
    });
    return response;
  }
}

export const api = new ApiClient();
export default api;
