import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { store } from './src/store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

import { authAPI } from './src/api/auth.api';
import { setUser } from './src/store/authSlice';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider } from './src/context/AppThemeContext';

const Stack = createNativeStackNavigator();


// 🔹 This component controls navigation based on login state
function RootNavigator() {
  const user = useSelector(state => state.auth.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {user ? (
          // ✅ If logged in → go to Dashboard
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : (
          // ❌ If not logged in → stay in Login
          <Stack.Screen name="Login" component={LoginScreen} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}


export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rehydrate = async () => {
      try {
        const user = await authAPI.getStoredUser();

        if (user) {
          if (user.role) user.role = user.role.toUpperCase();
          if (!user.role) user.role = 'USER';

          store.dispatch(setUser(user));
        }
      } catch (e) {
        console.log("Rehydrate error:", e);
      }

      setReady(true);
    };

    rehydrate();
  }, []);

  // ⏳ Loading screen
  if (!ready) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#0D0D1A',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <AppThemeProvider>
        <StatusBar style="auto" />
        <RootNavigator /> {/* ✅ IMPORTANT CHANGE */}
      </AppThemeProvider>
    </Provider>
  );
}