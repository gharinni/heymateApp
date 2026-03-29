import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';

// Import store FIRST - must happen before any component
import { store, setUser } from './src/store/index';

// Load stored user from device
const loadStoredUser = async () => {
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
// Provider is the VERY FIRST thing rendered
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadStoredUser()
      .then(user => {
        if (user) {
          user.role = (user.role || 'USER').toUpperCase();
          store.dispatch(setUser(user));
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
    </View>
  );

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <AppBody />
    </Provider>
  );
}

// ── AppBody renders inside Provider ──────────────────────
function AppBody() {
  const [Screen, setScreen] = useState(null);
  const [err, setErr]       = useState(null);

  useEffect(() => {
    Promise.all([
      import('./src/context/AppThemeContext'),
      import('./src/navigation/AppNavigator'),
    ])
    .then(([themeModule, navModule]) => {
      const { AppThemeProvider } = themeModule;
      const AppNavigator          = navModule.default;
      setScreen(() => () => (
        <AppThemeProvider>
          <AppNavigator />
        </AppThemeProvider>
      ));
    })
    .catch(e => setErr(e?.message || 'Failed to load app'));
  }, []);

  if (err) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize:48 }}>⚡</Text>
      <Text style={{ color:'#FF5722', fontSize:22, fontWeight:'800', marginTop:8 }}>
        HeyMate
      </Text>
      <Text style={{ color:'#9CA3AF', fontSize:13, marginTop:16,
        textAlign:'center', lineHeight:22 }}>
        {err}
      </Text>
    </View>
  );

  if (!Screen) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A',
      alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
      <Text style={{ color:'#9CA3AF', marginTop:14, fontSize:14 }}>
        Loading HeyMate...
      </Text>
    </View>
  );

  return <Screen />;
}
