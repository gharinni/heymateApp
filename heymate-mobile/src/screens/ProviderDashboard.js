import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { bookingApi, providerApi } from '../api/services';
import { useLocation } from '../hooks/useLocation';
import { COLORS } from '../constants';

export default function ProviderDashboard({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const { location, startTracking } = useLocation();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reqRes, profileRes] = await Promise.all([
        bookingApi.getProviderRequests(),
        providerApi.getMyProfile(),
      ]);
      setRequests(reqRes.data.data || []);
      setProfile(profileRes.data.data);
    } catch (e) { /* silent */ }
  };

  const handleToggleOnline = async (value) => {
    try {
      await providerApi.toggleOnline(value);
      setIsOnline(value);
      if (value && location) {
        // Start sending live location updates every 5s
        startTracking(async (coords) => {
          try { await providerApi.updateLocation(coords.lat, coords.lng); } catch (e) {}
        });
      }
      Alert.alert(value ? '✅ You are Online' : '⭕ You are Offline',
        value ? 'Customers can now find and book you!' : 'You won\'t receive new requests.');
    } catch (e) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  const handleAccept = async (request) => {
    Alert.prompt('Quote Price', 'Enter your price for this service (₹)', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept', onPress: async (price) => {
          if (!price || isNaN(price)) { Alert.alert('Error', 'Enter a valid price'); return; }
          setLoading(true);
          try {
            await bookingApi.accept(request.id, { price: parseFloat(price) });
            Alert.alert('Accepted!', 'Customer has been notified with your quote.');
            loadData();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not accept');
          } finally {
            setLoading(false);
          }
        }
      }
    ], 'plain-text', '', 'numeric');
  };

  const stats = [
    { icon: '💰', label: "Today's Earnings", value: '₹1,240' },
    { icon: '✅', label: 'Completed', value: requests.filter(r => r.status === 'COMPLETED').length },
    { icon: '⭐', label: 'Rating', value: profile?.rating || '5.0' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Provider Mode 🧰</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.onlineRow}>
          <Text style={{ color: isOnline ? COLORS.success : COLORS.textMuted, fontSize: 12, fontWeight: '600' }}>
            {isOnline ? '● Online' : '○ Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: COLORS.border, true: `${COLORS.success}66` }}
            thumbColor={isOnline ? COLORS.success : COLORS.textMuted}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={{ fontSize: 22 }}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['requests', 'ongoing', 'history'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && { color: COLORS.primary }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Requests */}
      <View style={{ padding: 16 }}>
        {requests.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 42 }}>📭</Text>
            <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>No requests yet</Text>
          </View>
        )}
        {requests.map((req) => (
          <View key={req.id} style={[styles.reqCard, req.status === 'PENDING' && styles.reqCardUrgent]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.reqUser}>{req.user?.name}</Text>
              {req.status === 'PENDING' && (
                <View style={styles.urgentBadge}><Text style={{ color: '#FF1744', fontSize: 10, fontWeight: '700' }}>NEW</Text></View>
              )}
            </View>
            <Text style={styles.reqMeta}>🔧 {req.serviceType} · 📍 {req.serviceAddress}</Text>
            {req.notes && <Text style={styles.reqNotes}>"{req.notes}"</Text>}
            {req.status === 'PENDING' && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={styles.declineBtn} onPress={() => bookingApi.cancel(req.id)}>
                  <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 13 }}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req)}>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>✅ Accept & Quote</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  headerSub: { color: COLORS.textMuted, fontSize: 12 },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { color: COLORS.text, fontWeight: '700', fontSize: 14, marginTop: 4 },
  statLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 2, textAlign: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  tabActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}18` },
  tabText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 12 },
  reqCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  reqCardUrgent: { borderColor: '#FF174444', shadowColor: '#FF1744', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  reqUser: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  urgentBadge: { backgroundColor: '#FF174420', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  reqMeta: { color: COLORS.textMuted, fontSize: 12 },
  reqNotes: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  declineBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardLight },
  acceptBtn: { flex: 2, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.primary },
});
