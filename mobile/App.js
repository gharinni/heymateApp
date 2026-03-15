import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { authAPI } from './src/api/auth.api';
import { setUser } from './src/store/authSlice';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider } from './src/context/AppThemeContext';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Rehydrate user from storage on every app start / QR scan / page refresh
    const rehydrate = async () => {
      try {
        const user = await authAPI.getStoredUser();
        if (user) {
          if (user.role) user.role = user.role.toUpperCase();
          if (!user.role) user.role = 'USER';
          store.dispatch(setUser(user));
        }
      } catch {}
      setReady(true);
    };
    rehydrate();
  }, []);

  // Show loading spinner while rehydrating — prevents flash of login screen
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D1A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <AppThemeProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AppThemeProvider>
    </Provider>
  );
}
