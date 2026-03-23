import axios from 'axios';

// ✅ Your Railway backend URL
const API_BASE_URL = 'https://heymatebackend-production.up.railway.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Attach token automatically to every request
api.interceptors.request.use(
  async (config) => {
    try {
      let token = null;

      // Web → localStorage
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
      } else {
        // Mobile → AsyncStorage
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        token = await AsyncStorage.getItem('token');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Token error:', e);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ❗ Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API ERROR:', error?.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('Unauthorized - token invalid');
    }

    return Promise.reject(error);
  }
);

export default api;