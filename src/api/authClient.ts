import axios from 'axios';
import {CONFIG} from '../config';
import {storage, STORAGE_KEYS} from '../utils/storage';

const authClient = axios.create({
  baseURL: CONFIG.AUTH_URL,
  timeout: 60000,
  headers: {'Content-Type': 'application/json'},
});

authClient.interceptors.request.use(async config => {
  const token = await storage.get<string>(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default authClient;
