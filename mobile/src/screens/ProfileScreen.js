import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, Platform, Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const C = {
  bg: '#0D0D1A', card: '#1A1A2E', primary: '#FF5722',
  text: '#FFFFFF', textMuted: '#9CA3AF', border: '#2A2A3E',
  success: '#4CAF50', danger: '#EF4444',
};

const clearStorage = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.clear();
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await AS.clear();
    }
  } catch {}
};

export default function ProfileScreen({ navigation }) {
  const dispatch     = useDispatch();
  const { user }     = useSelector(s => s.auth);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = () => Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await clearStorage();
        dispatch(logout());
      }},
    ]
  );

  const MenuItem = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
        borderRadius: 14, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: danger ? `${C.danger}44` : C.border }}
    >
      <Text style={{ fontSize: 22, marginRight: 14 }}>{icon}</Text>
      <Text style={{ color: danger ? C.danger : C.text, fontSize: 15, fontWeight: '600', flex: 1 }}>
        {label}
      </Text>
      <Text style={{ color: C.textMuted, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}>

      {/* Profile Card */}
      <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 24,
        alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: C.border }}>
        <View style={{ width: 80, height: 80, borderRadius: 40,
          backgroundColor: `${C.primary}30`, alignItems: 'center',
          justifyContent: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>
          {user?.name || 'User'}
        </Text>
        <Text style={{ color: C.textMuted, fontSize: 14, marginTop: 4 }}>
          {user?.email || user?.phone || '—'}
        </Text>
        <View style={{ backgroundColor: `${C.primary}20`, borderRadius: 20,
          paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 }}>
          <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>
            {user?.role === 'PROVIDER' ? '🔧 Provider' : '👤 Customer'}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '700',
        letterSpacing: 1, marginBottom: 10 }}>ACCOUNT</Text>

      <MenuItem icon="📋" label="My Requests" onPress={() => navigation.navigate('Request')} />
      <MenuItem icon="💳" label="Payment History" onPress={() => navigation.navigate('Request')} />
      <MenuItem icon="⭐" label="My Reviews" onPress={() => {}} />
      <MenuItem icon="📍" label="Saved Addresses" onPress={() => {}} />

      <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '700',
        letterSpacing: 1, marginBottom: 10, marginTop: 10 }}>SETTINGS</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
        borderRadius: 14, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: C.border }}>
        <Text style={{ fontSize: 22, marginRight: 14 }}>🌙</Text>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: '600', flex: 1 }}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode}
          trackColor={{ true: C.primary }} thumbColor="#fff" />
      </View>

      <MenuItem icon="🔔" label="Notifications" onPress={() => {}} />
      <MenuItem icon="🔒" label="Privacy & Security" onPress={() => {}} />
      <MenuItem icon="❓" label="Help & Support" onPress={() => {}} />
      <MenuItem icon="ℹ️" label="About HeyMate" onPress={() => {}} />

      <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '700',
        letterSpacing: 1, marginBottom: 10, marginTop: 10 }}>DANGER ZONE</Text>

      <MenuItem icon="🚪" label="Logout" onPress={handleLogout} danger />

      <Text style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
        HeyMate v1.0.0 · One App, Any Task, Any Time
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
