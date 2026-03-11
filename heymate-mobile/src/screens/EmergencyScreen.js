import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Linking,
} from 'react-native';
import { emergencyApi } from '../api/services';
import { useLocation } from '../hooks/useLocation';
import { COLORS, BLOOD_TYPES, EMERGENCY_NUMBERS } from '../constants';

export default function EmergencyScreen({ navigation }) {
  const { location } = useLocation();
  const [sheSafeActive, setSheSafeActive] = useState(false);
  const [bloodDonors, setBloodDonors] = useState([]);
  const [selectedBloodType, setSelectedBloodType] = useState(null);
  const [loadingDonors, setLoadingDonors] = useState(false);

  const handleSOS = async () => {
    Alert.alert('🚨 SOS Alert', 'This will send your location to all emergency contacts and call 112.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'SEND SOS', style: 'destructive', onPress: async () => {
          if (!location) { Alert.alert('Error', 'Location not available'); return; }
          try {
            await emergencyApi.triggerSOS({
              lat: location.lat, lng: location.lng,
              emergencyType: 'SOS', message: 'Need immediate help!'
            });
            Alert.alert('SOS Sent!', 'Emergency contacts notified. Stay safe!');
          } catch (e) {
            Linking.openURL('tel:112'); // Fallback to direct call
          }
        }
      }
    ]);
  };

  const toggleSheSafe = async () => {
    const newState = !sheSafeActive;
    try {
      await emergencyApi.toggleSheSafe(newState, location ? { lat: location.lat, lng: location.lng } : null);
      setSheSafeActive(newState);
      Alert.alert(
        newState ? '🛡️ She-Safe Activated' : 'She-Safe Deactivated',
        newState ? 'Trusted contacts have been notified with your live location.' : 'Safety tracking stopped.'
      );
    } catch (e) {
      Alert.alert('Error', 'Could not toggle She-Safe');
    }
  };

  const findBloodDonors = async (bloodType) => {
    if (!location) { Alert.alert('Error', 'Location not available'); return; }
    setLoadingDonors(true);
    setSelectedBloodType(bloodType);
    try {
      const res = await emergencyApi.findBloodDonors(bloodType, location.lat, location.lng, 15);
      setBloodDonors(res.data.data || []);
    } catch (e) {
      Alert.alert('Error', 'Could not find donors');
    } finally {
      setLoadingDonors(false);
    }
  };

  const callNumber = (num) => Linking.openURL(`tel:${num}`);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: COLORS.text, fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🚨 Emergency</Text>
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
        <Text style={{ fontSize: 48 }}>🆘</Text>
        <Text style={styles.sosText}>Tap & Hold for SOS</Text>
        <Text style={styles.sosSub}>Sends alert + location to contacts & 112</Text>
      </TouchableOpacity>

      {/* She-Safe */}
      <TouchableOpacity
        style={[styles.sheSafeCard, sheSafeActive && styles.sheSafeActive]}
        onPress={toggleSheSafe}
      >
        <Text style={{ fontSize: 36 }}>🛡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheSafeTitle}>She-Safe Mode</Text>
          <Text style={{ color: sheSafeActive ? '#f8bbd0' : COLORS.textMuted, fontSize: 12 }}>
            {sheSafeActive ? '✅ Active · Contacts notified · Live tracking ON' : 'Tap to activate safety tracking'}
          </Text>
        </View>
        <View style={[styles.toggle, sheSafeActive && styles.toggleOn]}>
          <View style={[styles.toggleDot, sheSafeActive && styles.toggleDotOn]} />
        </View>
      </TouchableOpacity>

      {/* Blood Donors */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Text style={{ fontSize: 28 }}>🩸</Text>
          <View>
            <Text style={styles.cardTitle}>Blood Donor Network</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>Find nearby donors by blood type</Text>
          </View>
        </View>
        <View style={styles.bloodTypes}>
          {BLOOD_TYPES.map((bt) => (
            <TouchableOpacity
              key={bt}
              style={[styles.bloodTypeBtn, selectedBloodType === bt && styles.bloodTypeBtnActive]}
              onPress={() => findBloodDonors(bt)}
            >
              <Text style={[styles.bloodTypeBtnText, selectedBloodType === bt && { color: '#fff' }]}>{bt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {loadingDonors && <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 8 }}>Searching...</Text>}
        {bloodDonors.map((d) => (
          <TouchableOpacity key={d.id} style={styles.donorRow} onPress={() => callNumber(d.phone)}>
            <Text style={{ fontSize: 20 }}>🩸</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 13 }}>{d.name}</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>{d.bloodType} · {d.distanceKm} km · {d.city}</Text>
            </View>
            <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 13 }}>📞 Call</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Emergency Contacts</Text>
        <View style={styles.contactGrid}>
          {[
            { icon: '🚑', label: 'Ambulance', num: EMERGENCY_NUMBERS.ambulance },
            { icon: '👮', label: 'Police', num: EMERGENCY_NUMBERS.police },
            { icon: '🔥', label: 'Fire', num: EMERGENCY_NUMBERS.fire },
            { icon: '👩', label: 'Women Help', num: EMERGENCY_NUMBERS.women },
          ].map((c) => (
            <TouchableOpacity key={c.label} style={styles.contactCard} onPress={() => callNumber(c.num)}>
              <Text style={{ fontSize: 28 }}>{c.icon}</Text>
              <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 12, marginTop: 6 }}>{c.label}</Text>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 13 }}>{c.num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, gap: 12 },
  backBtn: { width: 36, height: 36, backgroundColor: COLORS.card, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  title: { color: '#FF5252', fontSize: 22, fontWeight: '800' },
  sosBtn: { margin: 16, backgroundColor: '#B71C1C', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  sosText: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  sosSub: { color: '#ffaaaa', fontSize: 12, marginTop: 4, textAlign: 'center' },
  sheSafeCard: { margin: 16, backgroundColor: COLORS.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 14 },
  sheSafeActive: { backgroundColor: '#880E4F', borderColor: '#AD1457' },
  sheSafeTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: COLORS.border },
  toggleOn: { backgroundColor: '#F48FB1' },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', margin: 3 },
  toggleDotOn: { marginLeft: 25 },
  card: { margin: 16, backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  bloodTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  bloodTypeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardLight },
  bloodTypeBtnActive: { backgroundColor: '#C62828', borderColor: '#C62828' },
  bloodTypeBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  donorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  section: { padding: 16 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contactCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
});
