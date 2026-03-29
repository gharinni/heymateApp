import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, TouchableOpacity,
         TextInput, ScrollView, Alert } from 'react-native';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';
const isWeb   = Platform.OS === 'web';

// ─── STORE ────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser: (s, a) => { s.user = a.payload; s.token = a.payload?.token||null; },
    logout:  (s)    => { s.user = null; s.token = null; },
  },
});
const { setUser, logout } = authSlice.actions;
const store = configureStore({
  reducer: { auth: authSlice.reducer },
  middleware: g => g({ serializableCheck:false }),
});

// ─── STORAGE ──────────────────────────────────────────────
const sv = async (k,v) => { try { if(isWeb) localStorage.setItem(k,v); else { const A=(await import('@react-native-async-storage/async-storage')).default; await A.setItem(k,v); } } catch{} };
const gv = async (k)   => { try { if(isWeb) return localStorage.getItem(k); const A=(await import('@react-native-async-storage/async-storage')).default; return A.getItem(k); } catch{ return null; } };
const cl = async ()    => { try { if(isWeb) localStorage.clear(); else { const A=(await import('@react-native-async-storage/async-storage')).default; await A.clear(); } } catch{} };

// ─── COLORS ───────────────────────────────────────────────
const C = { bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722', success:'#4CAF50', border:'#2A2A3E', text:'#FFFFFF', muted:'#9CA3AF', input:'#1E1E30' };

// ─── LOGIN SCREEN ─────────────────────────────────────────
function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [mode, setMode]     = useState('login');
  const [loading, setL]     = useState(false);
  const [name, setName]     = useState('');
  const [phone, setPhone]   = useState('');
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [role, setRole]     = useState('USER');

  const submit = async () => {
    if (mode==='login') {
      if (!phone.trim()&&!email.trim()) { Alert.alert('Error','Enter phone or email'); return; }
      if (!pass) { Alert.alert('Error','Enter password'); return; }
    } else {
      if (!name.trim()) { Alert.alert('Error','Enter name'); return; }
      if (phone.length!==10) { Alert.alert('Error','10-digit phone required'); return; }
      if (pass.length<6) { Alert.alert('Error','Password min 6 chars'); return; }
    }
    setL(true);
    try {
      const url  = mode==='login' ? `${BACKEND}/auth/login` : `${BACKEND}/auth/register`;
      const body = mode==='login'
        ? (phone ? {phone:phone.trim(),password:pass} : {email:email.trim().toLowerCase(),password:pass})
        : {name:name.trim(),phone:phone.trim(),email:email.trim().toLowerCase(),password:pass,role};
      const ctrl = new AbortController();
      const t    = setTimeout(()=>ctrl.abort(),10000);
      const res  = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal});
      clearTimeout(t);
      const txt  = await res.text();
      let data={};
      try{data=JSON.parse(txt);}catch{}
      const user = data?.token?data:data?.data?.token?data.data:null;
      if (user?.token) {
        user.role=(user.role||'USER').toUpperCase();
        await sv('token',user.token);
        await sv('user',JSON.stringify(user));
        dispatch(setUser(user));
        navigation.reset({index:0,routes:[{name:'Main'}]});
      } else {
        Alert.alert('Failed', data?.message||data?.error||(res.status===401?'Wrong credentials':`Error ${res.status}`));
      }
    } catch(e) {
      Alert.alert('Error', e.name==='AbortError'?'Timeout - try again':e.message||'Cannot connect');
    } finally { setL(false); }
  };

  const inp = {borderWidth:1.5,borderColor:C.border,borderRadius:12,padding:14,fontSize:16,backgroundColor:C.input,color:'#fff',marginBottom:14};
  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}} contentContainerStyle={{padding:24,paddingTop:60}} keyboardShouldPersistTaps="handled">
      <View style={{alignItems:'center',marginBottom:36}}>
        <Text style={{fontSize:54}}>⚡</Text>
        <Text style={{fontSize:36,fontWeight:'800',color:C.primary,marginTop:8}}>HeyMate</Text>
        <Text style={{color:C.muted,fontSize:14,marginTop:4}}>One App · Any Task · Any Time</Text>
      </View>
      <View style={{flexDirection:'row',backgroundColor:C.card,borderRadius:14,padding:4,marginBottom:24,borderWidth:1,borderColor:C.border}}>
        {[{v:'login',l:'Login'},{v:'signup',l:'Sign Up'}].map(m=>(
          <TouchableOpacity key={m.v} onPress={()=>setMode(m.v)} style={{flex:1,paddingVertical:12,borderRadius:10,alignItems:'center',backgroundColor:mode===m.v?C.primary:'transparent'}}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>{m.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {mode==='signup'&&<>
        <Text style={{color:C.text,fontWeight:'600',marginBottom:8}}>Full Name *</Text>
        <TextInput style={inp} placeholder="Your name" placeholderTextColor={C.muted} value={name} onChangeText={setName}/>
        <Text style={{color:C.text,fontWeight:'600',marginBottom:8}}>I am a *</Text>
        <View style={{flexDirection:'row',gap:10,marginBottom:14}}>
          {[{v:'USER',l:'👤 Customer'},{v:'PROVIDER',l:'🔧 Provider'}].map(r=>(
            <TouchableOpacity key={r.v} onPress={()=>setRole(r.v)} style={{flex:1,padding:14,borderRadius:12,alignItems:'center',borderWidth:2,borderColor:role===r.v?C.success:C.border,backgroundColor:role===r.v?'#0a2a0a':C.card}}>
              <Text style={{color:role===r.v?C.success:C.muted,fontWeight:'700'}}>{role===r.v?'✓ ':''}{r.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>}
      <Text style={{color:C.text,fontWeight:'600',marginBottom:8}}>Phone *</Text>
      <TextInput style={inp} placeholder="10-digit phone" placeholderTextColor={C.muted} value={phone} onChangeText={t=>setPhone(t.replace(/\D/g,'').slice(0,10))} keyboardType="phone-pad"/>
      <Text style={{color:C.text,fontWeight:'600',marginBottom:8}}>Email {mode==='signup'?'(optional)':'(or phone)'}</Text>
      <TextInput style={inp} placeholder="Email address" placeholderTextColor={C.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
      <Text style={{color:C.text,fontWeight:'600',marginBottom:8}}>Password *</Text>
      <TextInput style={[inp,{marginBottom:28}]} placeholder={mode==='signup'?'Min 6 chars':'Password'} placeholderTextColor={C.muted} value={pass} onChangeText={setPass} secureTextEntry autoCapitalize="none"/>
      <TouchableOpacity onPress={submit} disabled={loading} style={{backgroundColor:loading?'#555':C.primary,borderRadius:14,padding:18,alignItems:'center'}}>
        {loading?<ActivityIndicator color="#fff" size="large"/>:<Text style={{color:'#fff',fontWeight:'800',fontSize:17}}>{mode==='login'?'Login':'Create Account'}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={()=>setMode(mode==='login'?'signup':'login')} style={{alignItems:'center',marginTop:20,padding:10}}>
        <Text style={{color:C.muted}}>{mode==='login'?"No account? ":"Have account? "}<Text style={{color:C.primary,fontWeight:'700'}}>{mode==='login'?'Register':'Login'}</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────
const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const tabStyle = {
  headerShown:false,
  tabBarStyle:{backgroundColor:'#1A1A2E',borderTopColor:'#2A2A3E',height:isWeb?60:56,paddingBottom:isWeb?8:4},
  tabBarActiveTintColor:'#FF5722',tabBarInactiveTintColor:'#9CA3AF',tabBarShowLabel:!isWeb,
};
const TI = ({e,l,focused,color})=>(
  <View style={{alignItems:'center'}}>
    <Text style={{fontSize:isWeb?18:22}}>{e}</Text>
    {isWeb&&<Text style={{fontSize:10,color,fontWeight:focused?'700':'400',marginTop:2}}>{l}</Text>}
  </View>
);

// Lazy screen loader — loads from files but catches errors
const makeLazy = (loader) => {
  let Comp = null;
  return function LazyScreen(props) {
    const [C2, setC2] = useState(Comp);
    const [err, setErr] = useState(null);
    useEffect(()=>{
      if(!C2) loader().then(m=>{ Comp=m.default; setC2(()=>m.default); }).catch(e=>setErr(e?.message||'Load error'));
    },[]);
    if(err) return <View style={{flex:1,backgroundColor:'#0D0D1A',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#FF5722'}}>{err}</Text></View>;
    if(!C2) return <View style={{flex:1,backgroundColor:'#0D0D1A',alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#FF5722"/></View>;
    return <C2 {...props}/>;
  };
};

const HomeScreen                 = makeLazy(()=>import('./src/screens/HomeScreen'));
const ProfileScreen              = makeLazy(()=>import('./src/screens/ProfileScreen'));
const EmergencyScreen            = makeLazy(()=>import('./src/screens/EmergencyScreen'));
const RequestScreen              = makeLazy(()=>import('./src/screens/RequestScreen'));
const ServiceProvidersScreen     = makeLazy(()=>import('./src/screens/ServiceProvidersScreen'));
const BookingConfirmScreen       = makeLazy(()=>import('./src/screens/BookingConfirmScreen'));
const BookingStatusScreen        = makeLazy(()=>import('./src/screens/BookingStatusScreen'));
const TrackingScreen             = makeLazy(()=>import('./src/screens/TrackingScreen'));
const PaymentScreen              = makeLazy(()=>import('./src/screens/PaymentScreen'));
const FeedbackScreen             = makeLazy(()=>import('./src/screens/FeedbackScreen'));
const NearbyMapScreen            = makeLazy(()=>import('./src/screens/NearbyMapScreen'));
const NearbySettingsScreen       = makeLazy(()=>import('./src/screens/NearbySettingsScreen'));
const ProviderDashboard          = makeLazy(()=>import('./src/screens/ProviderDashboard'));
const NotificationSettingsScreen = makeLazy(()=>import('./src/screens/NotificationSettingsScreen'));
const HelpSupportScreen          = makeLazy(()=>import('./src/screens/HelpSupportScreen'));
const RateAppScreen              = makeLazy(()=>import('./src/screens/RateAppScreen'));

function UserTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="Home"      component={HomeScreen}      options={{tabBarIcon:p=><TI e="🏠" l="Home"      {...p}/>,tabBarLabel:'Home'}}/>
      <Tab.Screen name="Request"   component={RequestScreen}   options={{tabBarIcon:p=><TI e="📋" l="Requests"  {...p}/>,tabBarLabel:'Requests'}}/>
      <Tab.Screen name="NearbyMap" component={NearbyMapScreen} options={{tabBarIcon:p=><TI e="🗺️" l="Nearby"   {...p}/>,tabBarLabel:'Nearby'}}/>
      <Tab.Screen name="Emergency" component={EmergencyScreen} options={{tabBarIcon:p=><TI e="🚨" l="Emergency" {...p}/>,tabBarLabel:'Emergency'}}/>
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{tabBarIcon:p=><TI e="👤" l="Profile"   {...p}/>,tabBarLabel:'Profile'}}/>
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={tabStyle}>
      <Tab.Screen name="ProviderDashboard" component={ProviderDashboard}  options={{tabBarIcon:p=><TI e="📊" l="Dashboard" {...p}/>,tabBarLabel:'Dashboard'}}/>
      <Tab.Screen name="NearbyMap"         component={NearbyMapScreen}    options={{tabBarIcon:p=><TI e="🗺️" l="Nearby"   {...p}/>,tabBarLabel:'Nearby'}}/>
      <Tab.Screen name="Emergency"         component={EmergencyScreen}    options={{tabBarIcon:p=><TI e="🚨" l="Emergency" {...p}/>,tabBarLabel:'Emergency'}}/>
      <Tab.Screen name="Profile"           component={ProfileScreen}      options={{tabBarIcon:p=><TI e="👤" l="Profile"   {...p}/>,tabBarLabel:'Profile'}}/>
    </Tab.Navigator>
  );
}

function AppScreens() {
  const user       = useSelector(s => s.auth?.user);
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER';
  return (
    <Stack.Navigator screenOptions={{headerShown:false}} initialRouteName="Login">
      <Stack.Screen name="Login"                component={LoginScreen}/>
      <Stack.Screen name="Main"                 component={isProvider?ProviderTabs:UserTabs}/>
      <Stack.Screen name="Home"                 component={HomeScreen}/>
      <Stack.Screen name="Request"              component={RequestScreen}/>
      <Stack.Screen name="Profile"              component={ProfileScreen}/>
      <Stack.Screen name="Emergency"            component={EmergencyScreen}/>
      <Stack.Screen name="NearbyMap"            component={NearbyMapScreen}/>
      <Stack.Screen name="NearbySettings"       component={NearbySettingsScreen}/>
      <Stack.Screen name="ServiceProviders"     component={ServiceProvidersScreen}/>
      <Stack.Screen name="BookingConfirm"       component={BookingConfirmScreen}/>
      <Stack.Screen name="BookingStatus"        component={BookingStatusScreen}/>
      <Stack.Screen name="Tracking"             component={TrackingScreen}/>
      <Stack.Screen name="Payment"              component={PaymentScreen}/>
      <Stack.Screen name="Feedback"             component={FeedbackScreen}/>
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen}/>
      <Stack.Screen name="HelpSupport"          component={HelpSupportScreen}/>
      <Stack.Screen name="RateApp"              component={RateAppScreen}/>
      <Stack.Screen name="BloodDonors"          component={EmergencyScreen}/>
      <Stack.Screen name="TrustedContacts"      component={EmergencyScreen}/>
    </Stack.Navigator>
  );
}

// ─── ROOT ─────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(()=>{
    gv('user').then(u=>{
      if(u){ const user=JSON.parse(u); user.role=(user.role||'USER').toUpperCase(); store.dispatch(setUser(user)); }
      setReady(true);
    }).catch(()=>setReady(true));
  },[]);

  if(!ready) return (
    <View style={{flex:1,backgroundColor:'#0D0D1A',alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator size="large" color="#FF5722"/>
    </View>
  );

  return (
    <Provider store={store}>
      <StatusBar style="light"/>
      <View style={{flex:1,backgroundColor:isWeb?'#000':'#0D0D1A',alignItems:isWeb?'center':'stretch',justifyContent:isWeb?'center':'flex-start'}}>
        <View style={{width:isWeb?420:'100%',maxWidth:'100%',height:'100%',overflow:'hidden',flex:isWeb?undefined:1}}>
          <NavigationContainer>
            <AppScreens/>
          </NavigationContainer>
        </View>
      </View>
    </Provider>
  );
}
