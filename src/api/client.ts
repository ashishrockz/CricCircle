import axios from 'axios';
import {CONFIG} from '../config';
import {storage, STORAGE_KEYS} from '../utils/storage';

const client = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: 60000,
  headers: {'Content-Type': 'application/json'},
});

client.interceptors.request.use(async config => {
  const token = await storage.get<string>(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (handler: () => void) => {
  onUnauthorized = handler;
};

client.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await storage.remove(STORAGE_KEYS.TOKEN);
      await storage.remove(STORAGE_KEYS.USER);
      onUnauthorized?.();
    }
    // Re-fetch config on 503 (maintenance mode activated mid-session)
    if (error.response?.status === 503) {
      const {useConfigStore} = require('../stores/config.store');
      useConfigStore.getState().refreshConfig();
    }
    return Promise.reject(error);
  },
);

export default client;
