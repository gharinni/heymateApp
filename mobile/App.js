import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider } from './src/context/AppThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import authReducer, { setUser } from './src/store/authSlice';

// ── Redux Store ───────────────────────────────────────────
export const store = configureStore({
  reducer: { auth: authReducer },
  middleware: (g) => g({ serializableCheck: false }),
});

// ── Restore session ───────────────────────────────────────
const getStoredUser = async () => {
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

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getStoredUser().then(user => {
      if (user) {
        user.role = (user.role || 'USER').toUpperCase();
        store.dispatch(setUser(user));
      }
      setReady(true);
    });
  }, []);

  if (!ready) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A', alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
    </View>
  );

  return (
    <Provider store={store}>
      <AppThemeProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AppThemeProvider>
    </Provider>
  );
}
