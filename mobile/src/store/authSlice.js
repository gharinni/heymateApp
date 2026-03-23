import { createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

const save = async (k, v) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem(k, v);
    else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(k, v);
    }
  } catch {}
};

const clear = async () => {
  try {
    if (Platform.OS === 'web') localStorage.clear();
    else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.clear();
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
      if (action.payload?.token) {
        save('token', action.payload.token);
        save('user', JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.user  = null;
      state.token = null;
      clear();
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
