import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useSelector } from 'react-redux';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingConfirmScreen from '../screens/BookingConfirmScreen';
import BookingStatusScreen from '../screens/BookingStatusScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import NearbyMapScreen from '../screens/NearbyMapScreen';
import PaymentScreen from '../screens/PaymentScreen';
import RequestScreen from '../screens/RequestScreen';
import ServiceProvidersScreen from '../screens/ServiceProvidersScreen';
import TrackingScreen from '../screens/TrackingScreen';
import ProviderDashboard from '../screens/ProviderDashboard';
import ProviderScreen from '../screens/ProviderScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const user = useSelector((state) => state.auth.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* If NOT logged in → Login */}
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {/* Main Screens */}
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />

            {/* Booking Flow */}
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
            <Stack.Screen name="BookingStatus" component={BookingStatusScreen} />

            {/* Services */}
            <Stack.Screen name="Request" component={RequestScreen} />
            <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />

            {/* Other */}
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="NearbyMap" component={NearbyMapScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />

            {/* Provider */}
            <Stack.Screen name="ProviderDashboard" component={ProviderDashboard} />
            <Stack.Screen name="Provider" component={ProviderScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}