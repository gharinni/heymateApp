import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredUser } from './src/store/slices/authSlice';
import { StatusBar } from 'expo-status-bar';

function AppContent() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(loadStoredUser()); }, []);
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
