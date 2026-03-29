import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

const save = async (k, v) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem(k, v);
    else { const A = (await import('@react-native-async-storage/async-storage')).default; await A.setItem(k, v); }
  } catch {}
};

const clearAll = async () => {
  try {
    if (Platform.OS === 'web') localStorage.clear();
    else { const A = (await import('@react-native-async-storage/async-storage')).default; await A.clear(); }
  } catch {}
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser: (s, a) => {
      s.user  = a.payload;
      s.token = a.payload?.token || null;
      if (a.payload) {
        save('user', JSON.stringify(a.payload));
        if (a.payload.token) save('token', a.payload.token);
      }
    },
    logout: (s) => {
      s.user  = null;
      s.token = null;
      clearAll();
    },
  },
});

export const { setUser, logout } = authSlice.actions;

export const store = configureStore({
  reducer: { auth: authSlice.reducer },
  middleware: g => g({ serializableCheck: false }),
});
