import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { authAPI } from './src/api/auth.api';
import { setUser } from './src/store/authSlice';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider } from './src/context/AppThemeContext';

export default function App() {
  useEffect(() => {
    // Rehydrate user from storage on app start (works on web + native)
    authAPI.getStoredUser().then(user => {
      if (user) {
        if (user.role) user.role = user.role.toUpperCase();
        if (!user.role) user.role = 'USER';
        store.dispatch(setUser(user));
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <AppThemeProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AppThemeProvider>
    </Provider>
  );
}
