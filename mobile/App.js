// HeyMate App - Complete Single File
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';

// ✅ FIXED: Provider added here
import { Provider, useSelector, useDispatch } from 'react-redux';

import { configureStore, createSlice } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';
const isWeb = Platform.OS === 'web';

// STORE
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

// STORAGE
const C = { bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722', success:'#4CAF50', border:'#2A2A3E', text:'#FFFFFF', muted:'#9CA3AF', input:'#1E1E30' };

const gv = async k => {
  try {
    return isWeb
      ? localStorage.getItem(k)
      : (await import('@react-native-async-storage/async-storage')).default.getItem(k);
  } catch { return null; }
};

const sv = async (k,v) => {
  try {
    isWeb
      ? localStorage.setItem(k,v)
      : (await import('@react-native-async-storage/async-storage')).default.setItem(k,v);
  } catch {}
};

const cl = async () => {
  try {
    isWeb
      ? localStorage.clear()
      : (await import('@react-native-async-storage/async-storage')).default.clear();
  } catch {}
};

// LOGIN SCREEN
function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState('login');
  const [loading, setL] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [role, setRole] = useState('USER');

  const submit = async () => {
    setL(true);
    try {
      const url = mode === 'login'
        ? `${BACKEND}/auth/login`
        : `${BACKEND}/auth/register`;

      const body = mode === 'login'
        ? { phone, password: pass }
        : { name, phone, email, password: pass, role };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data?.token) {
        await sv('user', JSON.stringify(data));
        dispatch(setUser(data));
        navigation.replace('Main');
      } else {
        Alert.alert('Error', 'Login failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Server error');
    } finally {
      setL(false);
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:C.bg }}>
      <Text style={{ color:'#fff', fontSize:24, marginBottom:20 }}>Login</Text>
      <TextInput placeholder="Phone" style={{ backgroundColor:'#fff', width:200, margin:5 }} value={phone} onChangeText={setPhone}/>
      <TextInput placeholder="Password" style={{ backgroundColor:'#fff', width:200, margin:5 }} value={pass} onChangeText={setPass}/>
      <TouchableOpacity onPress={submit} style={{ backgroundColor:C.primary, padding:10 }}>
        <Text style={{ color:'#fff' }}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

// NAVIGATION
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeScreen(){ return <View><Text>Home</Text></View> }
function ProfileScreen(){ return <View><Text>Profile</Text></View> }

function UserTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen}/>
      <Tab.Screen name="Profile" component={ProfileScreen}/>
    </Tab.Navigator>
  );
}

function AppScreens() {
  const user = useSelector(s => s.auth?.user);

  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen}/>
      ) : (
        <Stack.Screen name="Main" component={UserTabs}/>
      )}
    </Stack.Navigator>
  );
}

// ROOT
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    gv('user').then(u => {
      if (u) {
        try {
          store.dispatch(setUser(JSON.parse(u)));
        } catch {}
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator/>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppScreens/>
      </NavigationContainer>
    </Provider>
  );
}