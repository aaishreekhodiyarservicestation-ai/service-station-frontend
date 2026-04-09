import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  selectedStationId: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => void;
  setSelectedStation: (stationId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  selectedStationId: null,

  setAuth: (user, token) => {
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedStationId');
    }
    set({ user: null, token: null, isAuthenticated: false, selectedStationId: null });
  },

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const selectedStationId = localStorage.getItem('selectedStationId');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true, selectedStationId: selectedStationId || null });
        } catch (error) {
          console.error('Failed to parse user from localStorage', error);
        }
      }
    }
  },

  setSelectedStation: (stationId) => {
    if (typeof window !== 'undefined') {
      if (stationId) {
        localStorage.setItem('selectedStationId', stationId);
      } else {
        localStorage.removeItem('selectedStationId');
      }
    }
    set({ selectedStationId: stationId });
  },
}));
