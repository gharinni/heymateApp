import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
export const BASE_URL = 'http://10.0.2.2:8080'; // Android emulator
// export const BASE_URL = 'http://localhost:8080'; // iOS simulator
// export const BASE_URL = 'https://api.heymate.app'; // Production

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Navigation to Login is handled in App.js via auth state
    }
    return Promise.reject(error);
  }
);

export default api;
