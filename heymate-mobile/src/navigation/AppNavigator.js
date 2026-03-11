import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ProviderDashboard from '../screens/ProviderDashboard';
import {
  BookingScreen, TrackingScreen, PaymentScreen, FeedbackScreen,
} from '../screens/BookingScreens';
import { COLORS } from '../constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 70, paddingBottom: 10 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>🏠</Text>, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Orders" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📦</Text>, tabBarLabel: 'Orders' }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>🚨</Text>, tabBarLabel: 'Emergency' }} />
      <Tab.Screen name="Profile" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>👤</Text>, tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 70, paddingBottom: 10 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen name="Dashboard" component={ProviderDashboard}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📊</Text> }} />
      <Tab.Screen name="Requests" component={ProviderDashboard}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📩</Text> }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>🚨</Text> }} />
      <Tab.Screen name="Profile" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, activeRole } = useSelector((s) => s.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs"
            component={activeRole === 'PROVIDER' ? ProviderTabs : UserTabs} />
          <Stack.Screen name="Service" component={HomeScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="Emergency" component={EmergencyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
