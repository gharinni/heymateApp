import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const saveStorage = async (key, value) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(key, value);
    }
  } catch {}
};

const clearStorage = async () => {
  try {
    if (Platform.OS === 'web') localStorage.clear();
    else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.clear();
    }
  } catch {}
};

// ── Thunks ────────────────────────────────────────────────
export const loginThunk = createAsyncThunk('auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${BACKEND}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      const user = data?.token ? data : data?.data?.token ? data.data : null;
      if (!user?.token) return rejectWithValue(data?.message || data?.error || 'Login failed');
      user.role = (user.role || 'USER').toUpperCase();
      await saveStorage('token', user.token);
      await saveStorage('user', JSON.stringify(user));
      return user;
    } catch (e) {
      return rejectWithValue(e.message || 'Cannot connect to server');
    }
  }
);

export const registerThunk = createAsyncThunk('auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res  = await fetch(`${BACKEND}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      const user = json?.token ? json : json?.data?.token ? json.data : null;
      if (!user?.token) return rejectWithValue(json?.message || json?.error || 'Registration failed');
      user.role = (user.role || 'USER').toUpperCase();
      await saveStorage('token', user.token);
      await saveStorage('user', JSON.stringify(user));
      return user;
    } catch (e) {
      return rejectWithValue(e.message || 'Cannot connect to server');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null },
  reducers: {
    setUser: (state, action) => {
      state.user  = action.payload;
      state.token = action.payload?.token || null;
      state.error = null;
      if (action.payload) {
        saveStorage('user', JSON.stringify(action.payload));
        if (action.payload.token) saveStorage('token', action.payload.token);
      }
    },
    logout: (state) => {
      state.user  = null;
      state.token = null;
      clearStorage();
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending,    s => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled,  (s, a) => { s.loading = false; s.user = a.payload; s.token = a.payload.token; })
      .addCase(loginThunk.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerThunk.pending,   s => { s.loading = true; s.error = null; })
      .addCase(registerThunk.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.token = a.payload.token; })
      .addCase(registerThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { setUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
