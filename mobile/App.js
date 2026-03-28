import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { StatusBar } from 'expo-status-bar';

// ── Store defined FIRST before anything else ─────────────
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

// ── Load stored session ───────────────────────────────────
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

// ── Root App ──────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadUser().then(user => {
      if (user) {
        user.role = (user.role || 'USER').toUpperCase();
        store.dispatch(setUser(user));
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  if (!ready) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
    </View>
  );

  // Provider wraps EVERYTHING — no component outside can use Redux
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
}

// ── AppInner is inside Provider ───────────────────────────
function AppInner() {
  const [Comp, setComp]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load theme + navigator lazily so crashes show error not blank
    Promise.all([
      import('./src/context/AppThemeContext'),
      import('./src/navigation/AppNavigator'),
    ]).then(([theme, nav]) => {
      const { AppThemeProvider } = theme;
      const AppNavigator          = nav.default;
      setComp(() => () => (
        <AppThemeProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AppThemeProvider>
      ));
    }).catch(e => setError(e?.message || String(e)));
  }, []);

  if (error) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize:40 }}>⚡</Text>
      <Text style={{ color:'#FF5722', fontSize:20, fontWeight:'800', marginTop:8 }}>
        HeyMate
      </Text>
      <Text style={{ color:'#fff', fontSize:13, marginTop:16, textAlign:'center' }}>
        {error}
      </Text>
    </View>
  );

  if (!Comp) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
      <Text style={{ color:'#9CA3AF', marginTop:12 }}>Loading...</Text>
    </View>
  );

  return <Comp />;
}
