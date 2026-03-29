// HeyMate App — Entry Point
// All screens live in src/screens/, store in src/store/
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Store
import { store, setUser } from './src/store';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// ── Helpers ──────────────────────────────────────────────
const getStored = async (key) => {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem(key);
  } catch { return null; }
};

// ── Navigation ───────────────────────────────────────────
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function UserTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppScreens() {
  const user = useSelector(s => s.auth?.user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={UserTabs} />
      )}
    </Stack.Navigator>
  );
}

// ── Root ─────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getStored('user').then(u => {
      if (u) {
        try { store.dispatch(setUser(JSON.parse(u))); } catch {}
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppScreens />
      </NavigationContainer>
    </Provider>
  );
}