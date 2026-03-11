import {create} from 'zustand';
import {storage, STORAGE_KEYS} from '../utils/storage';
import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';

// ── Remote Config Types ─────────────────────────────────────────────────────

export interface MaintenanceConfig {
  enabled: boolean;
  title: string;
  message: string;
  estimatedEndTime: string | null;
}

export interface FeaturesConfig {
  leaderboard: boolean;
  friends: boolean;
  rooms: boolean;
  highlights: boolean;
  matchSharing: boolean;
  userSearch: boolean;
}

export interface SettingsConfig {
  paginationLimit: number;
  roomListLimit: number;
  leaderboardLimit: number;
  commentaryLimit: number;
  maxOvers: number;
  minOvers: number;
  otpLength: number;
  otpResendSeconds: number;
  apiTimeoutMs: number;
  socketReconnectAttempts: number;
  socketReconnectDelayMs: number;
}

export interface AnnouncementConfig {
  enabled: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
}

export interface ForceUpdateConfig {
  enabled: boolean;
  minVersion: string;
  updateUrl: string;
  message: string;
}

export interface ContentConfig {
  termsUrl: string;
  privacyUrl: string;
  supportEmail: string;
  announcement: AnnouncementConfig;
  forceUpdate: ForceUpdateConfig;
}

export interface BrandingConfig {
  appName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
}

export interface RemoteConfig {
  version: number;
  maintenance: MaintenanceConfig;
  features: FeaturesConfig;
  settings: SettingsConfig;
  content: ContentConfig;
  branding: BrandingConfig;
}

// ── Defaults (match current hardcoded values) ───────────────────────────────

export const DEFAULT_CONFIG: RemoteConfig = {
  version: 0,
  maintenance: {
    enabled: false,
    title: 'Under Maintenance',
    message: 'We are performing scheduled maintenance. Please try again later.',
    estimatedEndTime: null,
  },
  features: {
    leaderboard: true,
    friends: true,
    rooms: true,
    highlights: true,
    matchSharing: true,
    userSearch: true,
  },
  settings: {
    paginationLimit: 20,
    roomListLimit: 5,
    leaderboardLimit: 50,
    commentaryLimit: 50,
    maxOvers: 20,
    minOvers: 1,
    otpLength: 6,
    otpResendSeconds: 60,
    apiTimeoutMs: 60000,
    socketReconnectAttempts: 5,
    socketReconnectDelayMs: 1000,
  },
  content: {
    termsUrl: '',
    privacyUrl: '',
    supportEmail: '',
    announcement: {enabled: false, title: '', message: '', type: 'info'},
    forceUpdate: {
      enabled: false,
      minVersion: '1.0.0',
      updateUrl: '',
      message: 'A new version is available. Please update to continue.',
    },
  },
  branding: {
    appName: 'CricCircle',
    tagline: '',
    primaryColor: '',
    accentColor: '',
    logoUrl: '',
  },
};

// ── Store ───────────────────────────────────────────────────────────────────

interface ConfigState {
  config: RemoteConfig;
  isLoaded: boolean;

  fetchConfig: () => Promise<void>;
  refreshConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoaded: false,

  fetchConfig: async () => {
    try {
      // Load cached config first
      const cached = await storage.get<RemoteConfig>(STORAGE_KEYS.REMOTE_CONFIG);
      if (cached) {
        set({config: cached, isLoaded: true});
      }

      // Fetch remote config with conditional request
      const currentVersion = cached?.version || 0;
      const {data, status} = await client.get(ENDPOINTS.APP_CONFIG, {
        params: currentVersion ? {since: currentVersion} : undefined,
        validateStatus: (s: number) => s === 200 || s === 304,
        timeout: 10000, // shorter timeout for config fetch
      });

      if (status === 200 && data) {
        await storage.set(STORAGE_KEYS.REMOTE_CONFIG, data);
        set({config: data, isLoaded: true});
      } else if (!cached) {
        // No cache and 304 (shouldn't happen), use defaults
        set({isLoaded: true});
      }
    } catch {
      // Network error — use cached or defaults
      if (!get().isLoaded) {
        set({isLoaded: true});
      }
    }
  },

  refreshConfig: async () => {
    try {
      const {data, status} = await client.get(ENDPOINTS.APP_CONFIG, {
        validateStatus: (s: number) => s === 200 || s === 304,
        timeout: 10000,
      });
      if (status === 200 && data) {
        await storage.set(STORAGE_KEYS.REMOTE_CONFIG, data);
        set({config: data});
      }
    } catch {}
  },
}));
