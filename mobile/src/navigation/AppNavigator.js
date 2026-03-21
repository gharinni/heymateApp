import React from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../context/AppThemeContext';

import LoginScreen                from '../screens/LoginScreen';
import HomeScreen                 from '../screens/HomeScreen';
import ProfileScreen              from '../screens/ProfileScreen';
import EmergencyScreen            from '../screens/EmergencyScreen';
import RequestScreen              from '../screens/RequestScreen';
import ServiceProvidersScreen     from '../screens/ServiceProvidersScreen';
import BookingConfirmScreen       from '../screens/BookingConfirmScreen';
import BookingStatusScreen        from '../screens/BookingStatusScreen';
import BookingScreen              from '../screens/BookingScreen';
import TrackingScreen             from '../screens/TrackingScreen';
import PaymentScreen              from '../screens/PaymentScreen';
import FeedbackScreen             from '../screens/FeedbackScreen';
import NearbyMapScreen            from '../screens/NearbyMapScreen';
import NearbySettingsScreen       from '../screens/NearbySettingsScreen';
import ProviderDashboard          from '../screens/ProviderDashboard';
import ProviderScreen             from '../screens/ProviderScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import HelpSupportScreen          from '../screens/HelpSupportScreen';
import RateAppScreen              from '../screens/RateAppScreen';
import DashboardScreen            from '../screens/DashboardScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

function TabIcon({ emoji, label, focused, color }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: isWeb ? 18 : 22 }}>{emoji}</Text>
      {isWeb && (
        <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '400', marginTop: 2 }}>
          {label}
        </Text>
      )}
    </View>
  );
}

const tabBarOpts = (colors) => ({
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    height: isWeb ? 60 : 56,
    paddingBottom: isWeb ? 8 : 4,
  },
  tabBarActiveTintColor:   colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarShowLabel: !isWeb,
});

function UserTabs() {
  const { colors } = useAppTheme();
  return (
    <Tab.Navigator screenOptions={tabBarOpts(colors)}>
      <Tab.Screen name="Home"      component={HomeScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="🏠" label="Home"      {...p} />, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Request"   component={RequestScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="📋" label="Requests"  {...p} />, tabBarLabel: 'Requests' }} />
      <Tab.Screen name="NearbyMap" component={NearbyMapScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="🗺️" label="Nearby"   {...p} />, tabBarLabel: 'Nearby' }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="🚨" label="Emergency" {...p} />, tabBarLabel: 'Emergency' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="👤" label="Profile"   {...p} />, tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  const { colors } = useAppTheme();
  return (
    <Tab.Navigator screenOptions={tabBarOpts(colors)}>
      <Tab.Screen name="ProviderDashboard" component={ProviderDashboard}
        options={{ tabBarIcon: p => <TabIcon emoji="📊" label="Dashboard" {...p} />, tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="ProviderScreen"    component={ProviderScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="🔧" label="Jobs"      {...p} />, tabBarLabel: 'Jobs' }} />
      <Tab.Screen name="NearbyMap"         component={NearbyMapScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="🗺️" label="Nearby"   {...p} />, tabBarLabel: 'Nearby' }} />
      <Tab.Screen name="Emergency"         component={EmergencyScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="🚨" label="Emergency" {...p} />, tabBarLabel: 'Emergency' }} />
      <Tab.Screen name="Profile"           component={ProfileScreen}
        options={{ tabBarIcon: p => <TabIcon emoji="👤" label="Profile"   {...p} />, tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function WebWrapper({ children }) {
  if (!isWeb) return children;
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 420, maxWidth: '100%', height: '100%',
        overflow: 'hidden', position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        {children}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { user }   = useSelector(s => s.auth);
  const { colors } = useAppTheme();
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER';

  return (
    <WebWrapper>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            // ── Not logged in ──────────────────────────────
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            // ── Logged in ──────────────────────────────────
            <>
              <Stack.Screen name="Main"
                component={isProvider ? ProviderTabs : UserTabs} />
              <Stack.Screen name="Dashboard"            component={DashboardScreen} />
              <Stack.Screen name="Home"                 component={HomeScreen} />
              <Stack.Screen name="ServiceProviders"     component={ServiceProvidersScreen} />
              <Stack.Screen name="Booking"              component={BookingScreen} />
              <Stack.Screen name="BookingConfirm"       component={BookingConfirmScreen} />
              <Stack.Screen name="BookingStatus"        component={BookingStatusScreen} />
              <Stack.Screen name="Tracking"             component={TrackingScreen} />
              <Stack.Screen name="Payment"              component={PaymentScreen} />
              <Stack.Screen name="Feedback"             component={FeedbackScreen} />
              <Stack.Screen name="Request"              component={RequestScreen} />
              <Stack.Screen name="NearbyMap"            component={NearbyMapScreen} />
              <Stack.Screen name="NearbySettings"       component={NearbySettingsScreen} />
              <Stack.Screen name="Emergency"            component={EmergencyScreen} />
              <Stack.Screen name="Profile"              component={ProfileScreen} />
              <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
              <Stack.Screen name="HelpSupport"          component={HelpSupportScreen} />
              <Stack.Screen name="RateApp"              component={RateAppScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </WebWrapper>
  );
}
