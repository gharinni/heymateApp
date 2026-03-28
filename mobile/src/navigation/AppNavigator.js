import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

// ── Screens ───────────────────────────────────────────────
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
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import HelpSupportScreen          from '../screens/HelpSupportScreen';
import RateAppScreen              from '../screens/RateAppScreen';


const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

const TAB = {
  bg:'#1A1A2E', border:'#2A2A3E', primary:'#FF5722', muted:'#9CA3AF',
};

const tabStyle = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: TAB.bg,
    borderTopColor:  TAB.border,
    height: isWeb ? 60 : 56,
    paddingBottom: isWeb ? 8 : 4,
  },
  tabBarActiveTintColor:   TAB.primary,
  tabBarInactiveTintColor: TAB.muted,
  tabBarShowLabel: !isWeb,
};

function TIcon({ e, l, focused, color }) {
  return (
    <View style={{ alignItems:'center' }}>
      <Text style={{ fontSize: isWeb ? 18 : 22 }}>{e}</Text>
      {isWeb && (
        <Text style={{ fontSize:10, color, fontWeight: focused ? '700':'400', marginTop:2 }}>
          {l}
        </Text>
      )}
    </View>
  );
}

function UserTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="Home"      component={HomeScreen}
        options={{ tabBarIcon: p => <TIcon e="🏠" l="Home"      {...p} />, tabBarLabel:'Home' }} />
      <Tab.Screen name="Request"   component={RequestScreen}
        options={{ tabBarIcon: p => <TIcon e="📋" l="Requests"  {...p} />, tabBarLabel:'Requests' }} />
      <Tab.Screen name="NearbyMap" component={NearbyMapScreen}
        options={{ tabBarIcon: p => <TIcon e="🗺️" l="Nearby"   {...p} />, tabBarLabel:'Nearby' }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}
        options={{ tabBarIcon: p => <TIcon e="🚨" l="Emergency" {...p} />, tabBarLabel:'Emergency' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}
        options={{ tabBarIcon: p => <TIcon e="👤" l="Profile"   {...p} />, tabBarLabel:'Profile' }} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="ProviderDashboard" component={ProviderDashboard}
        options={{ tabBarIcon: p => <TIcon e="📊" l="Dashboard" {...p} />, tabBarLabel:'Dashboard' }} />
      <Tab.Screen name="ProviderJobs"      component={ProviderScreen}
        options={{ tabBarIcon: p => <TIcon e="🔧" l="Jobs"      {...p} />, tabBarLabel:'Jobs' }} />
      <Tab.Screen name="NearbyMap"         component={NearbyMapScreen}
        options={{ tabBarIcon: p => <TIcon e="🗺️" l="Nearby"   {...p} />, tabBarLabel:'Nearby' }} />
      <Tab.Screen name="Emergency"         component={EmergencyScreen}
        options={{ tabBarIcon: p => <TIcon e="🚨" l="Emergency" {...p} />, tabBarLabel:'Emergency' }} />
      <Tab.Screen name="Profile"           component={ProfileScreen}
        options={{ tabBarIcon: p => <TIcon e="👤" l="Profile"   {...p} />, tabBarLabel:'Profile' }} />
    </Tab.Navigator>
  );
}

function WebWrapper({ children }) {
  if (!isWeb) return children;
  return (
    <View style={{ flex:1, backgroundColor:'#000',
      alignItems:'center', justifyContent:'center' }}>
      <View style={{ width:420, maxWidth:'100%', height:'100%', overflow:'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function AllScreens() {
  const user       = useSelector(s => s.auth?.user);
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER';

  return (
    <Stack.Navigator screenOptions={{ headerShown:false }} initialRouteName="Login">
      <Stack.Screen name="Login"                component={LoginScreen} />
      <Stack.Screen name="Main"                 component={isProvider ? ProviderTabs : UserTabs} />
      <Stack.Screen name="Home"                 component={HomeScreen} />
      <Stack.Screen name="Request"              component={RequestScreen} />
      <Stack.Screen name="Profile"              component={ProfileScreen} />
      <Stack.Screen name="Emergency"            component={EmergencyScreen} />
      <Stack.Screen name="NearbyMap"            component={NearbyMapScreen} />
      <Stack.Screen name="NearbySettings"       component={NearbySettingsScreen} />
      <Stack.Screen name="ServiceProviders"     component={ServiceProvidersScreen} />
      <Stack.Screen name="Booking"              component={BookingScreen} />
      <Stack.Screen name="BookingConfirm"       component={BookingConfirmScreen} />
      <Stack.Screen name="BookingStatus"        component={BookingStatusScreen} />
      <Stack.Screen name="Tracking"             component={TrackingScreen} />
      <Stack.Screen name="Payment"              component={PaymentScreen} />
      <Stack.Screen name="Feedback"             component={FeedbackScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="HelpSupport"          component={HelpSupportScreen} />
      <Stack.Screen name="RateApp"              component={RateAppScreen} />
      <Stack.Screen name="BloodDonors"          component={EmergencyScreen} />
      <Stack.Screen name="TrustedContacts"      component={EmergencyScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <WebWrapper>
      <NavigationContainer>
        <AllScreens />
      </NavigationContainer>
    </WebWrapper>
  );
}
