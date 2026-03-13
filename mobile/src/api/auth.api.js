import api from './index';
import { Platform } from 'react-native';

// Web uses localStorage, native uses AsyncStorage
const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.setItem(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.removeItem(key);
  },
  clear: async () => {
    if (Platform.OS === 'web') { localStorage.clear(); return; }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.clear();
  },
};

export const authAPI = {
  register: async (data) => {
    const res  = await api.post('/api/auth/register', data);
    const user = res.data;
    if (user.role) user.role = user.role.toUpperCase();
    if (!user.role) user.role = 'USER';
    await storage.setItem('token', user.token);
    await storage.setItem('user', JSON.stringify(user));
    return user;
  },

  login: async (phone, password) => {
    const res  = await api.post('/api/auth/login', { phone, password });
    const user = res.data;
    if (user.role) user.role = user.role.toUpperCase();
    if (!user.role) user.role = 'USER';
    await storage.setItem('token', user.token);
    await storage.setItem('user', JSON.stringify(user));
    return user;
  },

  // Supports both { phone, password } and { email, password }
  loginWithCredentials: async (credentials) => {
    const payload = { password: credentials.password };
    if (credentials.email) payload.email = credentials.email.trim().toLowerCase();
    if (credentials.phone) payload.phone = credentials.phone.trim();

    const res  = await api.post('/api/auth/login', payload);
    const user = res.data;
    if (user.role) user.role = user.role.toUpperCase();
    if (!user.role) user.role = 'USER';
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
    if (!u) return null;
    try {
      const user = JSON.parse(u);
      if (user.role) user.role = user.role.toUpperCase();
      if (!user.role) user.role = 'USER';
      return user;
    } catch { return null; }
  },

  getToken: () => storage.getItem('token'),

  updateFcmToken: (fcmToken) => api.post('/api/auth/fcm-token', { fcmToken }),
};
