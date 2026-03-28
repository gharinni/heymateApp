import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { StatusBar } from 'expo-status-bar';

// ── Inline store — no external imports that can fail ─────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser:  (s, a) => { s.user = a.payload; s.token = a.payload?.token || null; },
    logout:   (s)    => { s.user = null; s.token = null; },
  },
});
export const { setUser, logout } = authSlice.actions;
export const store = configureStore({
  reducer: { auth: authSlice.reducer },
  middleware: g => g({ serializableCheck: false }),
});

// ── Restore session from storage ──────────────────────────
const loadUser = async () => {
  try {
    if (Platform.OS === 'web') {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    const u  = await AS.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser()
      .then(user => {
        if (user) {
          user.role = (user.role || 'USER').toUpperCase();
          store.dispatch(setUser(user));
        }
        setReady(true);
      })
      .catch(e => {
        setError(e?.message || 'Init error');
        setReady(true);
      });
  }, []);

  if (!ready) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
    </View>
  );

  // Show error if something failed during boot
  if (error) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ color:'#FF5722', fontSize:20, fontWeight:'800' }}>⚡ HeyMate</Text>
      <Text style={{ color:'#fff', marginTop:12 }}>Loading error: {error}</Text>
    </View>
  );

  // Lazy load everything inside Provider so crashes are caught
  return (
    <Provider store={store}>
      <SafeApp />
    </Provider>
  );
}

// ── SafeApp loads heavy deps lazily ──────────────────────
function SafeApp() {
  const [ready, setReady] = useState(false);
  const [Comp, setComp]   = useState(null);
  const [err, setErr]     = useState(null);

  useEffect(() => {
    Promise.all([
      import('./src/context/AppThemeContext'),
      import('./src/navigation/AppNavigator'),
    ])
    .then(([themeModule, navModule]) => {
      const { AppThemeProvider } = themeModule;
      const AppNavigator          = navModule.default;

      const WrappedApp = () => (
        <AppThemeProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AppThemeProvider>
      );

      setComp(() => WrappedApp);
      setReady(true);
    })
    .catch(e => {
      setErr(e?.message || 'Load error');
      setReady(true);
    });
  }, []);

  if (!ready) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
      <Text style={{ color:'#9CA3AF', marginTop:12 }}>Loading HeyMate...</Text>
    </View>
  );

  if (err) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ color:'#FF5722', fontSize:24 }}>⚡</Text>
      <Text style={{ color:'#fff', fontSize:18, fontWeight:'800', marginTop:8 }}>HeyMate</Text>
      <Text style={{ color:'#9CA3AF', marginTop:12, textAlign:'center' }}>{err}</Text>
    </View>
  );

  const C = Comp;
  return <C />;
}