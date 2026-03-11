import {create} from 'zustand';
import {Platform} from 'react-native';
import i18n from '../i18n';
import {storage, STORAGE_KEYS} from '../utils/storage';
import type {ThemeMode} from '../theme';

function setAppBadge(count: number) {
  if (Platform.OS === 'ios') {
    try {
      const PushNotificationIOS =
        require('@react-native-community/push-notification-ios').default;
      PushNotificationIOS?.setApplicationIconBadgeNumber(count);
    } catch {}
  }
}

interface AppState {
  theme: ThemeMode;
  locale: string;
  unreadNotifications: number;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLocale: (locale: string) => void;
  setUnreadNotifications: (count: number) => void;
  loadPreferences: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'system',
  locale: 'en',
  unreadNotifications: 0,

  setTheme: (theme: ThemeMode) => {
    storage.set(STORAGE_KEYS.THEME, theme);
    set({theme});
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeMode =
      current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    storage.set(STORAGE_KEYS.THEME, next);
    set({theme: next});
  },

  setLocale: (locale: string) => {
    storage.set(STORAGE_KEYS.LOCALE, locale);
    set({locale});
  },

  setUnreadNotifications: (count: number) => {
    set({unreadNotifications: count});
    setAppBadge(count);
  },

  loadPreferences: async () => {
    const theme = await storage.get<ThemeMode>(STORAGE_KEYS.THEME);
    const locale = await storage.get<string>(STORAGE_KEYS.LOCALE);
    const resolvedLocale = locale || 'en';
    set({
      theme: theme || 'system',
      locale: resolvedLocale,
    });
    i18n.changeLanguage(resolvedLocale);
  },
}));
