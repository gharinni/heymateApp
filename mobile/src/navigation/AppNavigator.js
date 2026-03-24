import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import RequestScreen from '../screens/RequestScreen';
import ProviderDashboard from '../screens/ProviderDashboard';

import BookingScreen from '../screens/BookingScreen';
import BookingConfirmScreen from '../screens/BookingConfirmScreen';
import BookingStatusScreen from '../screens/BookingStatusScreen';
import PaymentScreen from '../screens/PaymentScreen';
import TrackingScreen from '../screens/TrackingScreen';

import FeedbackScreen from '../screens/FeedbackScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import NearbyMapScreen from '../screens/NearbyMapScreen';
import NearbySettingsScreen from '../screens/NearbySettingsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import RateAppScreen from '../screens/RateAppScreen';
import ServiceProvidersScreen from '../screens/ServiceProvidersScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">

      {/* Authentication */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />

      {/* Main Screens */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Emergency" component={EmergencyScreen} />
      <Stack.Screen name="Request" component={RequestScreen} />
      <Stack.Screen name="ProviderDashboard" component={ProviderDashboard} />

      {/* Booking Flow */}
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
      <Stack.Screen name="BookingStatus" component={BookingStatusScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen 
        name="Tracking" 
        component={TrackingScreen} 
        options={{ title: 'Track Service' }}
      />

      {/* Additional Features */}
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="NearbyMap" component={NearbyMapScreen} />
      <Stack.Screen name="NearbySettings" component={NearbySettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="RateApp" component={RateAppScreen} />
      <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />

    </Stack.Navigator>
  );
}