import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
    } catch {}
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch {}
  },
};

export const STORAGE_KEYS = {
  TOKEN: '@criccircle/token',
  USER: '@criccircle/user',
  THEME: '@criccircle/theme',
  LOCALE: '@criccircle/locale',
  REMOTE_CONFIG: '@criccircle/remote_config',
} as const;
