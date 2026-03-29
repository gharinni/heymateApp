// HeyMate App - Stable Version (NO lazy loading)

import React, { useEffect, useState } from 'react';
import {
  Platform,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

import { Provider, useSelector, useDispatch } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// ✅ IMPORT SCREENS DIRECTLY (IMPORTANT)
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
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import RateAppScreen from './src/screens/RateAppScreen';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';
const isWeb = Platform.OS === 'web';


// ================= REDUX =================
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser: (s, a) => {
      s.user = a.payload;
      s.token = a.payload?.token || null;
    },
    logout: (s) => {
      s.user = null;
      s.token = null;
    },
  },
});

const { setUser } = authSlice.actions;

const store = configureStore({
  reducer: { auth: authSlice.reducer },
  middleware: g => g({ serializableCheck: false }),
});


// ================= ERROR BOUNDARY =================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red', fontSize: 16 }}>
            {this.state.error?.toString()}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}


// ================= LOGIN =================
function LoginScreen({ navigation }) {
  const dispatch = useDispatch();

  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!phone || !pass) {
      Alert.alert('Enter credentials');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass }),
      });

      const data = await res.json();

      if (data?.token) {
        dispatch(setUser(data));
        navigation.replace('Main');
      } else {
        Alert.alert('Login failed');
      }
    } catch (e) {
      Alert.alert('Network error');
    }

    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} />
      <TextInput placeholder="Password" value={pass} onChangeText={setPass} secureTextEntry />
      <TouchableOpacity onPress={login}>
        {loading ? <ActivityIndicator /> : <Text>Login</Text>}
      </TouchableOpacity>
    </View>
  );
}


// ================= NAVIGATION =================
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function UserTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Request" component={RequestScreen} />
      <Tab.Screen name="Nearby" component={NearbyMapScreen} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={ProviderDashboard} />
      <Tab.Screen name="Nearby" component={NearbyMapScreen} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}


function AppScreens() {
  const user = useSelector(s => s.auth?.user);

  console.log("USER:", user);

  const isProvider = user?.role === 'PROVIDER';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={isProvider ? ProviderTabs : UserTabs} />
          <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
          <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
          <Stack.Screen name="BookingStatus" component={BookingStatusScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="NearbySettings" component={NearbySettingsScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="RateApp" component={RateAppScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}


// ================= ROOT =================
export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <NavigationContainer>
          <AppScreens />
        </NavigationContainer>
      </ErrorBoundary>
    </Provider>
  );
}