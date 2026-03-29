import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

// ── ALL imports inline — no external store file needed ────

// Screens
import LoginScreen                from './src/screens/LoginScreen';
import HomeScreen                 from './src/screens/HomeScreen';
import ProfileScreen              from './src/screens/ProfileScreen';
import EmergencyScreen            from './src/screens/EmergencyScreen';
import RequestScreen              from './src/screens/RequestScreen';
import ServiceProvidersScreen     from './src/screens/ServiceProvidersScreen';
import BookingConfirmScreen       from './src/screens/BookingConfirmScreen';
import BookingStatusScreen        from './src/screens/BookingStatusScreen';
import TrackingScreen             from './src/screens/TrackingScreen';
import PaymentScreen              from './src/screens/PaymentScreen';
import FeedbackScreen             from './src/screens/FeedbackScreen';
import NearbyMapScreen            from './src/screens/NearbyMapScreen';
import NearbySettingsScreen       from './src/screens/NearbySettingsScreen';
import ProviderDashboard          from './src/screens/ProviderDashboard';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import HelpSupportScreen          from './src/screens/HelpSupportScreen';
import RateAppScreen              from './src/screens/RateAppScreen';

// ── Redux Store ───────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser: (s, a) => { s.user = a.payload; s.token = a.payload?.token || null; },
    logout:  (s)    => { s.user = null; s.token = null; },
  },
});
const { setUser, logout } = authSlice.actions;
const store = configureStore({
  reducer: { auth: authSlice.reducer },
  middleware: g => g({ serializableCheck: false }),
});

// Export for screens that need it
export { store, setUser, logout };

// ── Storage helpers ───────────────────────────────────────
const saveStorage = async (k, v) => {
  try {
    if (Platform.OS === 'web') localStorage.setItem(k, v);
    else { const A = (await import('@react-native-async-storage/async-storage')).default; await A.setItem(k, v); }
  } catch {}
};

const loadUser = async () => {
  try {
    if (Platform.OS === 'web') { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
    const A = (await import('@react-native-async-storage/async-storage')).default;
    const u = await A.getItem('user'); return u ? JSON.parse(u) : null;
  } catch { return null; }
};

const clearStorage = async () => {
  try {
    if (Platform.OS === 'web') localStorage.clear();
    else { const A = (await import('@react-native-async-storage/async-storage')).default; await A.clear(); }
  } catch {}
};

// ── Navigation ────────────────────────────────────────────
const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

const tabStyle = {
  headerShown: false,
  tabBarStyle: { backgroundColor:'#1A1A2E', borderTopColor:'#2A2A3E', height: isWeb ? 60 : 56, paddingBottom: isWeb ? 8 : 4 },
  tabBarActiveTintColor: '#FF5722',
  tabBarInactiveTintColor: '#9CA3AF',
  tabBarShowLabel: !isWeb,
};

const TI = ({ e, l, focused, color }) => (
  <View style={{ alignItems:'center' }}>
    <Text style={{ fontSize: isWeb ? 18 : 22 }}>{e}</Text>
    {isWeb && <Text style={{ fontSize:10, color, fontWeight:focused?'700':'400', marginTop:2 }}>{l}</Text>}
  </View>
);

function UserTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="Home"      component={HomeScreen}     options={{ tabBarIcon: p => <TI e="🏠" l="Home"      {...p}/>, tabBarLabel:'Home' }} />
      <Tab.Screen name="Request"   component={RequestScreen}  options={{ tabBarIcon: p => <TI e="📋" l="Requests"  {...p}/>, tabBarLabel:'Requests' }} />
      <Tab.Screen name="NearbyMap" component={NearbyMapScreen}options={{ tabBarIcon: p => <TI e="🗺️" l="Nearby"   {...p}/>, tabBarLabel:'Nearby' }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen}options={{ tabBarIcon: p => <TI e="🚨" l="Emergency" {...p}/>, tabBarLabel:'Emergency' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}  options={{ tabBarIcon: p => <TI e="👤" l="Profile"   {...p}/>, tabBarLabel:'Profile' }} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="ProviderDashboard" component={ProviderDashboard}  options={{ tabBarIcon: p => <TI e="📊" l="Dashboard" {...p}/>, tabBarLabel:'Dashboard' }} />
      <Tab.Screen name="NearbyMap"         component={NearbyMapScreen}    options={{ tabBarIcon: p => <TI e="🗺️" l="Nearby"   {...p}/>, tabBarLabel:'Nearby' }} />
      <Tab.Screen name="Emergency"         component={EmergencyScreen}    options={{ tabBarIcon: p => <TI e="🚨" l="Emergency" {...p}/>, tabBarLabel:'Emergency' }} />
      <Tab.Screen name="Profile"           component={ProfileScreen}      options={{ tabBarIcon: p => <TI e="👤" l="Profile"   {...p}/>, tabBarLabel:'Profile' }} />
    </Tab.Navigator>
  );
}

function AppScreens() {
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

// ── Root App ──────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadUser().then(user => {
      if (user) {
        user.role = (user.role || 'USER').toUpperCase();
        store.dispatch(setUser(user));
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  if (!ready) return (
    <View style={{ flex:1, backgroundColor:'#0D0D1A', alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
    </View>
  );

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <View style={{ flex:1, backgroundColor: isWeb ? '#000' : '#0D0D1A',
        alignItems: isWeb ? 'center' : 'stretch', justifyContent: isWeb ? 'center' : 'flex-start' }}>
        <View style={{ width: isWeb ? 420 : '100%', maxWidth:'100%',
          height:'100%', overflow:'hidden', flex: isWeb ? undefined : 1 }}>
          <NavigationContainer>
            <AppScreens />
          </NavigationContainer>
        </View>
      </View>
    </Provider>
  );
}
