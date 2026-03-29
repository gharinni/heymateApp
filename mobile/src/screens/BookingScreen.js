import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { bookingAPI } from '../api/booking.api';
import { COLORS } from '../constants';

export default function BookingScreen({ route, navigation }) {
  const { provider } = route.params;
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!address.trim()) { Alert.alert('Error', 'Please enter your address'); return; }

    try {
      setLoading(true);
      const res = await bookingAPI.create({
        providerId: provider.id,
        serviceType: provider.serviceType,
        address,
        notes,
        price: null, // provider will quote
      });
      Alert.alert('Request Sent! 🎉',
        `${provider.user?.name || 'Provider'} has been notified. Wait for them to accept.`,
        [{ text: 'Track Booking', onPress: () => navigation.navigate('Tracking', { booking: res.data }) }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: COLORS.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book Service</Text>
      </View>

      {/* Provider Card */}
      <View style={styles.providerCard}>
        <View style={styles.providerAvatar}><Text style={{ fontSize: 28 }}>👤</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.providerName}>{provider.user?.name || 'Provider'}</Text>
          <Text style={styles.providerMeta}>⭐ {provider.rating} · {provider.serviceType}</Text>
          <Text style={{ color: COLORS.primary, fontWeight: '700', marginTop: 4 }}>
            {provider.pricePerUnit || 'Price on request'}
          </Text>
        </View>
      </View>

      {/* Address */}
      <Text style={styles.label}>📍 Your Address</Text>
      <TextInput
        placeholder="Enter full address"
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        multiline
      />

      {/* Notes */}
      <Text style={styles.label}>📝 Task Description</Text>
      <TextInput
        placeholder="Describe the task in detail..."
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, { height: 100 }]}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {/* Price Estimate */}
      <View style={styles.priceBox}>
        <Text style={styles.priceTitle}>💰 Price Info</Text>
        <Text style={styles.priceMeta}>
          Base: {provider.pricePerUnit || 'TBD'}{'\n'}
          Platform Fee: ₹20{'\n'}
          GST: 18% applied on total
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 6 }}>
          * Final price will be quoted by provider upon acceptance
        </Text>
      </View>

      <TouchableOpacity style={styles.bookBtn} onPress={handleBook} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={styles.bookBtnText}>Send Request to Provider →</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  providerAvatar: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#1E2D4A', alignItems: 'center', justifyContent: 'center' },
  providerName: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  providerMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  label: { color: COLORS.text, fontWeight: '600', fontSize: 13, marginHorizontal: 20, marginBottom: 8 },
  input: { backgroundColor: COLORS.card, color: COLORS.text, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, fontSize: 14 },
  priceBox: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  priceTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  priceMeta: { color: COLORS.textMuted, fontSize: 13, lineHeight: 22 },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginHorizontal: 20 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
