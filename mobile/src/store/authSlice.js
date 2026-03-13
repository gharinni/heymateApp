import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api/auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persist user to AsyncStorage every time we update it
const persistUser = async (user) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch {}
};

export const loginThunk = createAsyncThunk('auth/login',
  async ({ phone, password }, { rejectWithValue }) => {
    try { return await authAPI.login(phone, password); }
    catch (e) { return rejectWithValue(e.response?.data?.error || 'Login failed'); }
  }
);

export const registerThunk = createAsyncThunk('auth/register',
  async (data, { rejectWithValue }) => {
    try { return await authAPI.register(data); }
    catch (e) { return rejectWithValue(e.response?.data?.error || 'Registration failed'); }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      // Also persist to AsyncStorage so it survives app restarts
      persistUser(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      authAPI.logout();
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false; s.user = a.payload; s.token = a.payload.token;
        persistUser(a.payload);
      })
      .addCase(loginThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerThunk.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(registerThunk.fulfilled, (s, a) => {
        s.loading = false; s.user = a.payload; s.token = a.payload.token;
        persistUser(a.payload);
      })
      .addCase(registerThunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { setUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
