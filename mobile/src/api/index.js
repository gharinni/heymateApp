import axios from 'axios';

// ✅ Use environment variable (best practice)
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://heymatebackend-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token automatically
api.interceptors.request.use(async (config) => {
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {}

  return config;
});

export default api;