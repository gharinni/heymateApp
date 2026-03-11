import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from '../hooks/useLocation';
import { providerApi } from '../api/services';
import { COLORS, SERVICES } from '../constants';

export default function HomeScreen({ navigation }) {
  const { user } = useSelector((s) => s.auth);
  const { location } = useLocation();
  const [search, setSearch] = useState('');
  const [nearbyProviders, setNearbyProviders] = useState([]);

  useEffect(() => {
    if (location) loadNearbyProviders();
  }, [location]);

  const loadNearbyProviders = async () => {
    try {
      const res = await providerApi.getNearby(location.lat, location.lng, 'FOOD', 5000);
      setNearbyProviders(res.data.data || []);
    } catch (e) { /* silent */ }
  };

  const filteredServices = SERVICES.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.headline}>What do you need?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
          <Text style={{ fontSize: 22 }}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Location */}
      <View style={styles.locationBar}>
        <Text style={{ fontSize: 16 }}>📍</Text>
        <Text style={styles.locationText}>
          {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting location...'}
        </Text>
      </View>

      {/* Search + AI Chat */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search any service..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.aiBadge} onPress={() => navigation.navigate('Chat')}>
          <Text style={styles.aiBadgeText}>⚡ AI</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Banner */}
      <TouchableOpacity style={styles.emergencyBanner} onPress={() => navigation.navigate('Emergency')}>
        <Text style={{ fontSize: 28 }}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.emergencyTitle}>Emergency Services</Text>
          <Text style={styles.emergencySub}>Blood Donors · She-Safe · Ambulance</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
      </TouchableOpacity>

      {/* Services Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Services</Text>
        <View style={styles.grid}>
          {filteredServices.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Service', { service: s })}
            >
              <View style={[styles.serviceIcon, { backgroundColor: `${s.color}20` }]}>
                <Text style={{ fontSize: 24 }}>{s.icon}</Text>
              </View>
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nearby Providers */}
      {nearbyProviders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Nearby Providers</Text>
          {nearbyProviders.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onBook={() => navigation.navigate('Booking', { provider: p })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ProviderCard({ provider, onBook }) {
  return (
    <View style={pStyles.card}>
      <View style={pStyles.avatar}>
        <Text style={{ fontSize: 28 }}>👷</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={pStyles.name}>{provider.name}</Text>
        <Text style={pStyles.meta}>⭐ {provider.rating} · {provider.totalOrders} tasks</Text>
        <View style={pStyles.badges}>
          {provider.estimatedEta && (
            <View style={[pStyles.badge, { backgroundColor: '#00C85320' }]}>
              <Text style={[pStyles.badgeText, { color: COLORS.success }]}>🕐 {provider.estimatedEta}</Text>
            </View>
          )}
          {provider.basePrice && (
            <View style={[pStyles.badge, { backgroundColor: `${COLORS.primary}20` }]}>
              <Text style={[pStyles.badgeText, { color: COLORS.primary }]}>₹{provider.basePrice}</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity style={pStyles.bookBtn} onPress={onBook}>
        <Text style={pStyles.bookBtnText}>Book</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { color: COLORS.textMuted, fontSize: 13 },
  headline: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginTop: 2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  locationBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: '0 20px', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.card, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  locationText: { color: COLORS.text, fontSize: 13, flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  searchInput: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: COLORS.text, fontSize: 14 },
  aiBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  aiBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emergencyBanner: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#D32F2F', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergencyTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emergencySub: { color: '#ffaaaa', fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: { width: '22%', backgroundColor: COLORS.card, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  serviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  serviceLabel: { color: COLORS.text, fontSize: 9, fontWeight: '600', textAlign: 'center' },
});

const pStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.cardLight, alignItems: 'center', justifyContent: 'center' },
  name: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  meta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
