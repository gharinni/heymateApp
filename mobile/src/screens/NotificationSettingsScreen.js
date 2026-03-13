import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';

export default function NotificationSettingsScreen({ navigation }) {
  const { colors } = useAppTheme();
  const [settings, setSettings] = useState({
    bookingUpdates: true,
    newRequests: true,
    promotions: false,
    emergencyAlerts: true,
    locationSharing: true,
    appUpdates: false,
    soundEnabled: true,
    vibration: true,
  });

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const groups = [
    {
      title: '📋 Booking',
      items: [
        { key: 'bookingUpdates', label: 'Booking Updates', sub: 'Status changes, confirmations' },
        { key: 'newRequests', label: 'New Job Requests', sub: 'For providers — new bookings nearby' },
      ],
    },
    {
      title: '🚨 Safety',
      items: [
        { key: 'emergencyAlerts', label: 'Emergency Alerts', sub: 'SOS, She-Safe notifications' },
        { key: 'locationSharing', label: 'Location Sharing Alerts', sub: 'When your location is shared' },
      ],
    },
    {
      title: '🔔 General',
      items: [
        { key: 'promotions', label: 'Offers & Promotions', sub: 'Discounts and deals' },
        { key: 'appUpdates', label: 'App Updates', sub: 'New features and improvements' },
      ],
    },
    {
      title: '🔊 Sound & Vibration',
      items: [
        { key: 'soundEnabled', label: 'Sound', sub: 'Play sound for notifications' },
        { key: 'vibration', label: 'Vibration', sub: 'Vibrate for notifications' },
      ],
    },
  ];

  const s = makeStyles(colors);

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>🔔 Notifications</Text>
      </View>

      {groups.map(group => (
        <View key={group.title} style={s.section}>
          <Text style={s.groupTitle}>{group.title}</Text>
          {group.items.map((item, i) => (
            <View key={item.key} style={[s.row, i < group.items.length - 1 && s.rowBorder]}>
              <View style={s.rowLeft}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowSub}>{item.sub}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>
      ))}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 56 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  title: { color: c.text, fontSize: 18, fontWeight: '800' },
  section: { backgroundColor: c.card, borderRadius: 16, marginHorizontal: 20, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: c.border },
  groupTitle: { color: c.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  rowLeft: { flex: 1 },
  rowLabel: { color: c.text, fontSize: 14, fontWeight: '600' },
  rowSub: { color: c.textMuted, fontSize: 12, marginTop: 2 },
});