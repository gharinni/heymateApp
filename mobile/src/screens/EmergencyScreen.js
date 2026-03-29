import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, Switch,
} from 'react-native';
import { emergencyAPI } from '../api/emergency.api';
import { useLocation } from '../hooks/useLocation';
import { COLORS, EMERGENCY_NUMBERS } from '../constants';

export default function EmergencyScreen({ navigation }) {
  const { location, getLocation } = useLocation();
  const [sheSafeActive, setSheSafeActive] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const triggerSOS = async () => {
    Alert.alert('🚨 SOS Alert', 'This will alert your emergency contacts and share your location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS', style: 'destructive',
          onPress: async () => {
            try {
              setSosLoading(true);
              const loc = await getLocation();
              await emergencyAPI.triggerSOS(loc.latitude, loc.longitude);
              Alert.alert('SOS Sent ✅', 'Your emergency contacts have been notified with your location.');
            } catch (e) {
              Alert.alert('Error', 'Failed to send SOS. Call 112 directly.');
            } finally {
              setSosLoading(false);
            }
          },
        },
      ]
    );
  };

  const callNumber = (num) => Linking.openURL(`tel:${num}`);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: COLORS.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🚨 Emergency Services</Text>
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosBtn} onPress={triggerSOS} disabled={sosLoading}>
        <Text style={styles.sosEmoji}>🆘</Text>
        <Text style={styles.sosTitle}>SOS — Tap to Alert</Text>
        <Text style={styles.sosSub}>Sends your location to trusted contacts & 112</Text>
      </TouchableOpacity>

      {/* She-Safe */}
      <View style={[styles.card, sheSafeActive && styles.cardActive]}>
        <View style={styles.cardRow}>
          <Text style={{ fontSize: 36 }}>🛡️</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>She-Safe Mode</Text>
            <Text style={styles.cardSub}>
              {sheSafeActive ? '✅ Active — Tracking your location' : 'Activate safety tracking'}
            </Text>
          </View>
          <Switch
            value={sheSafeActive}
            onValueChange={setSheSafeActive}
            trackColor={{ true: '#AD1457', false: COLORS.border }}
            thumbColor="#fff"
          />
        </View>
        {sheSafeActive && (
          <View style={styles.activeChips}>
            {['📍 Location Shared', '👩 Contacts Notified', '🔴 Recording Active'].map(c => (
              <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
            ))}
          </View>
        )}
      </View>

      {/* Blood Donor */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🩸 Find Blood Donors</Text>
        <Text style={styles.cardSub}>Search nearby verified donors</Text>
        <View style={styles.bloodTypes}>
          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
            <TouchableOpacity key={g} style={styles.bloodBtn}
              onPress={() => navigation.navigate('BloodDonors', { bloodType: g, location })}>
              <Text style={styles.bloodBtnText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Dial */}
      <Text style={styles.sectionTitle}>Quick Emergency Contacts</Text>
      <View style={styles.quickGrid}>
        {[
          { icon: '🚑', label: 'Ambulance', num: EMERGENCY_NUMBERS.ambulance },
          { icon: '👮', label: 'Police', num: EMERGENCY_NUMBERS.police },
          { icon: '🔥', label: 'Fire', num: EMERGENCY_NUMBERS.fire },
          { icon: '👩', label: 'Women Help', num: EMERGENCY_NUMBERS.women },
        ].map(c => (
          <TouchableOpacity key={c.label} style={styles.quickCard} onPress={() => callNumber(c.num)}>
            <Text style={{ fontSize: 32 }}>{c.icon}</Text>
            <Text style={styles.quickLabel}>{c.label}</Text>
            <Text style={styles.quickNum}>{c.num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trusted Contacts */}
      <TouchableOpacity style={styles.manageBtn} onPress={() => navigation.navigate('TrustedContacts')}>
        <Text style={styles.manageBtnText}>⚙️ Manage Trusted Contacts</Text>
      </TouchableOpacity>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  title: { color: '#FF5252', fontSize: 20, fontWeight: '800' },
  sosBtn: { backgroundColor: '#B71C1C', borderRadius: 20, padding: 24, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
  sosEmoji: { fontSize: 52, marginBottom: 8 },
  sosTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  sosSub: { color: '#ffaaaa', fontSize: 12, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, marginHorizontal: 20, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardActive: { borderColor: '#AD1457', backgroundColor: '#880E4F' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  cardSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  activeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { backgroundColor: '#88000044', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: '#f8bbd0', fontSize: 10, fontWeight: '600' },
  bloodTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  bloodBtn: { borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 7 },
  bloodBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14, marginHorizontal: 20, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  quickCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  quickLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginTop: 8 },
  quickNum: { color: COLORS.primary, fontSize: 14, fontWeight: '800', marginTop: 4 },
  manageBtn: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center', marginHorizontal: 20, borderWidth: 1, borderColor: COLORS.border },
  manageBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
});
