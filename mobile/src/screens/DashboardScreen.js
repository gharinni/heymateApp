import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const C = {
  bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722',
  text:'#FFFFFF', textMuted:'#9CA3AF', border:'#2A2A3E',
  success:'#4CAF50',
};

const clearStorage = async () => {
  try {
    if (Platform.OS === 'web') localStorage.clear();
    else { const AS = (await import('@react-native-async-storage/async-storage')).default; await AS.clear(); }
  } catch {}
};

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER';

  const Btn = ({ icon, label, screen, color }) => (
    <TouchableOpacity onPress={() => navigation.navigate(screen)}
      style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16,
        alignItems: 'center', borderWidth: 1, borderColor: color || C.border }}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ color: C.text, fontWeight: '700', fontSize: 11,
        marginTop: 8, textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}>

      <View style={{ marginBottom: 28 }}>
        <Text style={{ color: C.textMuted, fontSize: 13 }}>Welcome back 👋</Text>
        <Text style={{ color: C.text, fontSize: 28, fontWeight: '800', marginTop: 4 }}>
          {user?.name?.split(' ')[0] || 'Hello'}!
        </Text>
        <View style={{ backgroundColor: `${C.primary}20`, borderRadius: 20,
          paddingHorizontal: 14, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' }}>
          <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>
            {isProvider ? '🔧 Provider Mode' : '👤 Customer Mode'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <Btn icon="🏠" label="Home"      screen="Home"      color={`${C.primary}44`} />
        <Btn icon="📋" label="Requests"  screen="Request"   color={`${C.primary}44`} />
        <Btn icon="🗺️" label="Nearby"   screen="NearbyMap" color={`${C.success}44`} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
        <Btn icon="🚨" label="Emergency" screen="Emergency" color="#ef444444" />
        <Btn icon="👤" label="Profile"   screen="Profile"   color={`${C.success}44`} />
        {isProvider
          ? <Btn icon="📊" label="Dashboard" screen="ProviderDashboard" color={`${C.primary}44`} />
          : <Btn icon="⭐" label="Rate App"  screen="RateApp"           color="#eab30844" />
        }
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Home')}
        style={{ backgroundColor: C.primary, borderRadius: 14, padding: 16,
          alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Browse Services →</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={async () => {
        await clearStorage();
        dispatch(logout());
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
        style={{ backgroundColor: '#1a0000', borderRadius: 14, padding: 16,
          alignItems: 'center', borderWidth: 1, borderColor: '#ef444444' }}>
        <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 15 }}>🚪 Logout</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
