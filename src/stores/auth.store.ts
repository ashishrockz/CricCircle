import {create} from 'zustand';
import type {User} from '../models';
import {storage, STORAGE_KEYS} from '../utils/storage';
import {connectSocket, disconnectSocket} from '../api/socket';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  loadFromStorage: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token: string, user: User) => {
    await storage.set(STORAGE_KEYS.TOKEN, token);
    await storage.set(STORAGE_KEYS.USER, user);
    connectSocket(token);
    set({token, user, isAuthenticated: true, isLoading: false});
  },

  logout: async () => {
    disconnectSocket();
    await storage.remove(STORAGE_KEYS.TOKEN);
    await storage.remove(STORAGE_KEYS.USER);
    set({token: null, user: null, isAuthenticated: false, isLoading: false});
  },

  setUser: (user: User) => {
    storage.set(STORAGE_KEYS.USER, user);
    set({user});
  },

  loadFromStorage: async () => {
    try {
      const token = await storage.get<string>(STORAGE_KEYS.TOKEN);
      const user = await storage.get<User>(STORAGE_KEYS.USER);
      if (token && user) {
        connectSocket(token);
        set({token, user, isAuthenticated: true, isLoading: false});
        return true;
      }
      set({isLoading: false});
      return false;
    } catch {
      set({isLoading: false});
      return false;
    }
  },
}));
