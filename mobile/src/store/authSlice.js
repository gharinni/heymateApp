import { createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

const saveToStorage = async (key, value) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  } catch {}
};

const removeFromStorage = async (key) => {
  try {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.removeItem(key);
    }
  } catch {}
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser: (state, action) => {
      const userData = action.payload;
      if (userData) {
        state.user  = userData;
        state.token = userData.token || state.token;
        // Save to storage async (no await in reducer)
        saveToStorage('user', JSON.stringify(userData));
        if (userData.token) saveToStorage('token', userData.token);
      }
    },
    logout: (state) => {
      state.user  = null;
      state.token = null;
      removeFromStorage('user');
      removeFromStorage('token');
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
