import api from './index';
import { Platform } from 'react-native';

// ── STORAGE ───────────────────────────────────────────
const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.setItem(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.removeItem(key);
  },
};

export const authAPI = {

  loginWithCredentials: async ({ phone, email, password }) => {
    const payload = { password };

    if (phone) payload.phone = phone.trim();
    if (email) payload.email = email.trim().toLowerCase();

    const res = await api.post('/auth/login', payload);

    const user = res.data;

    await storage.setItem('token', user.token);
    await storage.setItem('user', JSON.stringify(user));

    return user;
  },

  logout: async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
  },

  getStoredUser: async () => {
    const u = await storage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
};