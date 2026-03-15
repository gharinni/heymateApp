import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api/auth.api';
import { Platform } from 'react-native';

// ── Platform-aware storage ────────────────────────────────
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
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.removeItem(key);
    }
  } catch {}
};

const persistUser = async (user) => {
  await saveToStorage('user', JSON.stringify(user));
  if (user?.token) await saveToStorage('token', user.token);
};

// ── Thunks ────────────────────────────────────────────────
export const loginThunk = createAsyncThunk('auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authAPI.loginWithCredentials(credentials);
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message || e.response?.data?.error || e.message || 'Login failed'
      );
    }
  }
);

export const registerThunk = createAsyncThunk('auth/register',
  async (data, { rejectWithValue }) => {
    try {
      return await authAPI.register(data);
    } catch (e) {
      return rejectWithValue(e.response?.data?.error || e.message || 'Registration failed');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null },
  reducers: {
    setUser: (state, action) => {
      state.user   = action.payload;
      state.token  = action.payload?.token || state.token;
      persistUser(action.payload);
    },
    logout: (state) => {
      state.user  = null;
      state.token = null;
      removeFromStorage('user');
      removeFromStorage('token');
      authAPI.logout();
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending,   s => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.user    = a.payload;
        s.token   = a.payload?.token;
        persistUser(a.payload);
      })
      .addCase(loginThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerThunk.pending,   s => { s.loading = true; s.error = null; })
      .addCase(registerThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.user    = a.payload;
        s.token   = a.payload?.token;
        persistUser(a.payload);
      })
      .addCase(registerThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { setUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
