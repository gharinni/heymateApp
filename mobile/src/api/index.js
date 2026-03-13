import axios from 'axios';
import { Platform } from 'react-native';

export const BASE_URL   = 'https://heymatebackend-production.up.railway.app';
export const API_URL    = BASE_URL + '/api';
export const SOCKET_URL = BASE_URL;

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  const AS = (await import('@react-native-async-storage/async-storage')).default;
  return AS.getItem('token');
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      if (Platform.OS === 'web') localStorage.clear();
      else {
        const AS = (await import('@react-native-async-storage/async-storage')).default;
        await AS.clear();
      }
    }
    return Promise.reject(err);
  },
);

export default api;
