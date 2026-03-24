import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { providerAPI } from '../api/provider.api';
import { useLocation } from '../hooks/useLocation';
import { useAppTheme } from '../context/AppThemeContext';
import { SERVICES } from '../constants';

export default function HomeScreen({ navigation }) {
  const { user } = useSelector((s) => s.auth);
  const { location, address } = useLocation();
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');

  const c = colors;
  const filteredServices = SERVICES.filter(s =>
    !search || s.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 }}>
        <View>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Welcome back 👋</Text>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{user?.name?.split(' ')[0] || 'Hello'}!</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
          <Text style={{ fontSize: 20 }}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Live Location Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 14, marginHorizontal: 20, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
          <Text style={{ fontSize: 18, marginTop: 2 }}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Location</Text>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', marginTop: 2 }} numberOfLines={2}>{address || 'Getting location...'}</Text>
          </View>
        </View>
        {location
          ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${c.success}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.success }} />
              <Text style={{ color: c.success, fontSize: 10, fontWeight: '800' }}>LIVE</Text>
            </View>
          : <ActivityIndicator size="small" color={c.primary} />
        }
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: c.card, borderRadius: 14, marginHorizontal: 20, borderWidth: 1, borderColor: c.border, marginBottom: 16 }}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          placeholder="Search any service..."
          placeholderTextColor={c.textMuted}
          style={{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 12 }}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Emergency Banners */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Emergency')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#D32F2F', borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 10 }}>
        <Text style={{ fontSize: 28 }}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Emergency Services</Text>
          <Text style={{ color: '#ffcccc', fontSize: 11, marginTop: 2 }}>Blood Donors · She-Safe · Ambulance · Police</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Emergency')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#AD1457', borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 28 }}>🛡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>She-Safe Mode</Text>
          <Text style={{ color: '#ffcccc', fontSize: 11, marginTop: 2 }}>SOS Alert · Live Location Share · Trusted Contacts</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
      </TouchableOpacity>

      {/* Services Grid — tapping goes to ServiceProviders, NOT map */}
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginHorizontal: 20, marginBottom: 14 }}>All Services</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 24 }}>
        {filteredServices.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => navigation.navigate('ServiceProviders', { service: s })}
            style={{ width: '21%', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 4, borderWidth: 1, borderColor: c.border }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: `${s.color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 7 }}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
            </View>
            <Text style={{ color: c.text, fontSize: 9, fontWeight: '700', textAlign: 'center' }}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
