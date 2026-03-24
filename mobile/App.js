import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens (ONLY existing ones)
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';
import BookingScreen from './src/screens/BookingScreen';
import BookingConfirmScreen from './src/screens/BookingConfirmScreen';
import BookingStatusScreen from './src/screens/BookingStatusScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import RateAppScreen from './src/screens/RateAppScreen';
import RequestScreen from './src/screens/RequestScreen';
import ServiceProvidersScreen from './src/screens/ServiceProvidersScreen';
import NearbyMapScreen from './src/screens/NearbyMapScreen';
import NearbySettingsScreen from './src/screens/NearbySettingsScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import ProviderDashboard from './src/screens/ProviderDashboard';
import TrackingScreen from './src/screens/TrackingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">

        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Main */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Service Flow */}
        <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
        <Stack.Screen name="Request" component={RequestScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
        <Stack.Screen name="BookingStatus" component={BookingStatusScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />

        {/* ✅ Tracking added */}
        <Stack.Screen name="Tracking" component={TrackingScreen} />

        <Stack.Screen name="Feedback" component={FeedbackScreen} />

        {/* Extra */}
        <Stack.Screen name="Emergency" component={EmergencyScreen} />
        <Stack.Screen name="NearbyMap" component={NearbyMapScreen} />
        <Stack.Screen name="NearbySettings" component={NearbySettingsScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="RateApp" component={RateAppScreen} />

        {/* Provider Dashboard (ONLY existing one) */}
        <Stack.Screen name="ProviderDashboard" component={ProviderDashboard} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}