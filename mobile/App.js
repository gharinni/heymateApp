import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { setUser } from './src/store/authSlice';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider } from './src/context/AppThemeContext';

const getStoredUser = async () => {
  try {
    if (Platform.OS === 'web') {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      const u  = await AS.getItem('user');
      return u ? JSON.parse(u) : null;
    }
  } catch { return null; }
};

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getStoredUser().then(user => {
      if (user) {
        if (user.role) user.role = user.role.toUpperCase();
        else user.role = 'USER';
        store.dispatch(setUser(user));
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D1A',
        alignItems: 'center', justifyContent: 'center' }}>
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
