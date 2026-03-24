import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// ── Screens ───────────────────────────────────────────────
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';
import RequestScreen from './src/screens/RequestScreen';
import ServiceProvidersScreen from './src/screens/ServiceProvidersScreen';
import BookingConfirmScreen from './src/screens/BookingConfirmScreen';
import BookingStatusScreen from './src/screens/BookingStatusScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import NearbyMapScreen from './src/screens/NearbyMapScreen';
import NearbySettingsScreen from './src/screens/NearbySettingsScreen';
import ProviderDashboard from './src/screens/ProviderDashboard';
import ProviderScreen from './src/screens/ProviderScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import RateAppScreen from './src/screens/RateAppScreen';
import BookingScreen from './src/screens/BookingScreen';

// ── Redux ────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.token = action.payload?.token || null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;

const store = configureStore({
  reducer: { auth: authSlice.reducer },
  middleware: g => g({ serializableCheck: false }),
});

// ── Navigation ───────────────────────────────────────────
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

const TAB_STYLE = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: '#1A1A2E',
    borderTopColor: '#2A2A3E',
    height: isWeb ? 60 : 56,
  },
  tabBarActiveTintColor: '#FF5722',
  tabBarInactiveTintColor: '#9CA3AF',
  tabBarShowLabel: !isWeb,
};

const TIcon = ({ e, l, focused, color }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: isWeb ? 18 : 22 }}>{e}</Text>
    {isWeb && (
      <Text style={{
        fontSize: 10,
        color,
        fontWeight: focused ? '700' : '400',
        marginTop: 2
      }}>
        {l}
      </Text>
    )}
  </View>
);

// ── User Tabs ────────────────────────────────────────────
function UserTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_STYLE}>
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: p => <TIcon e="🏠" l="Home" {...p} /> }} />
      <Tab.Screen name="Request" component={RequestScreen}
        options={{ tabBarIcon: p => <TIcon e="📋" l="Requests" {...p} /> }} />
      <Tab.Screen name="NearbyMap" component={NearbyMapScreen}
        options={{ tabBarIcon: p => <TIcon e="🗺️" l="Nearby" {...p} /> }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: p => <TIcon e="🚨" l="Emergency" {...p} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: p => <TIcon e="👤" l="Profile" {...p} /> }} />
    </Tab.Navigator>
  );
}

// ── Provider Tabs ────────────────────────────────────────
function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_STYLE}>
      <Tab.Screen name="ProviderDashboard" component={ProviderDashboard}
        options={{ tabBarIcon: p => <TIcon e="📊" l="Dashboard" {...p} /> }} />
      <Tab.Screen name="ProviderJobs" component={ProviderScreen}
        options={{ tabBarIcon: p => <TIcon e="🔧" l="Jobs" {...p} /> }} />
      <Tab.Screen name="NearbyMap" component={NearbyMapScreen}
        options={{ tabBarIcon: p => <TIcon e="🗺️" l="Nearby" {...p} /> }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: p => <TIcon e="🚨" l="Emergency" {...p} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: p => <TIcon e="👤" l="Profile" {...p} /> }} />
    </Tab.Navigator>
  );
}

// ── Role-based Tabs Switch ───────────────────────────────
function MainTabs() {
  const [isProvider, setIsProvider] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let u = null;
        if (Platform.OS === 'web') {
          u = localStorage.getItem('user');
        } else {
          const AS = (await import('@react-native-async-storage/async-storage')).default;
          u = await AS.getItem('user');
        }

        if (u) {
          const parsed = JSON.parse(u);
          setIsProvider(parsed?.role?.toUpperCase() === 'PROVIDER');
        }
      } catch {}
    })();
  }, []);

  return isProvider ? <ProviderTabs /> : <UserTabs />;
}

// ── App ─────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    (async () => {
      try {
        let token = null;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('token');
        } else {
          const AS = (await import('@react-native-async-storage/async-storage')).default;
          token = await AS.getItem('token');
        }

        if (token) setInitialRoute('Main');
      } catch {}
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D1A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>

          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />

          {/* Booking Flow */}
          <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
          <Stack.Screen name="BookingStatus" component={BookingStatusScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />

          {/* Extra Screens */}
          <Stack.Screen name="NearbySettings" component={NearbySettingsScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="RateApp" component={RateAppScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}