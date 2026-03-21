import { createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

const save = async (key, val) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem(key, val);
    else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(key, val);
    }
  } catch {}
};

const remove = async (key) => {
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
      state.user  = action.payload;
      state.token = action.payload?.token || null;
      // Persist async
      if (action.payload) {
        save('user', JSON.stringify(action.payload));
        if (action.payload.token) save('token', action.payload.token);
      }
    },
    logout: (state) => {
      state.user  = null;
      state.token = null;
      remove('user');
      remove('token');
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
