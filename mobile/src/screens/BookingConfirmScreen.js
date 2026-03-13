import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';
import { useLocation } from '../hooks/useLocation';
import { bookingAPI } from '../api/booking.api';

const TIME_SLOTS = ['ASAP', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

export default function BookingConfirmScreen({ route, navigation }) {
  const { provider, service } = route.params;
  const { colors } = useAppTheme();
  const { address: gpsAddress } = useLocation();
  const c = colors;

  const [address, setAddress] = useState(gpsAddress || '');
  const [notes, setNotes] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('ASAP');
  const [loading, setLoading] = useState(false);

  const providerName = provider.user?.name || provider.name || 'Provider';
  const price = parseFloat(provider.pricePerUnit?.replace(/[^0-9.]/g, '') || '0');
  const platformFee = 20;
  const gst = Math.round((price + platformFee) * 0.18);
  const total = price + platformFee + gst;

  const confirmBooking = async () => {
    if (!address.trim()) {
      Alert.alert('Address required', 'Please enter your address so the provider knows where to come.');
      return;
    }

    Alert.alert(
      '📋 Confirm Booking',
      `Provider: ${providerName}\nService: ${service.label}\nSlot: ${selectedSlot}\nEstimated: ₹${total > 20 ? total.toFixed(0) : 'TBD'}\n\nSend booking request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Send',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await bookingAPI.create({
                providerId: provider.id,
                serviceType: service.id,
                address,
                notes,
                timeSlot: selectedSlot,
                price: null,
              });
              navigation.navigate('BookingStatus', {
                booking: res.data,
                provider,
                service,
              });
            } catch (e) {
              // Demo mode — create a mock booking object
              const mockBooking = {
                id: Math.floor(Math.random() * 9000) + 1000,
                serviceType: service.id,
                address,
                notes,
                timeSlot: selectedSlot,
                status: 'PENDING',
                provider,
                price: price || null,
                createdAt: new Date().toISOString(),
              };
              navigation.navigate('BookingStatus', {
                booking: mockBooking,
                provider,
                service,
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Confirm Booking</Text>
      </View>

      {/* Provider Card */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.card, borderRadius: 18, marginHorizontal: 20, marginBottom: 20, padding: 16, borderWidth: 1, borderColor: c.border }}>
        <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: `${service.color}22`, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>{service.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{providerName}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{service.label} · ⭐ {provider.rating}</Text>
          <Text style={{ color: c.primary, fontWeight: '700', fontSize: 14, marginTop: 4 }}>{provider.pricePerUnit || 'Price on request'}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.success }} />
            <Text style={{ color: c.success, fontSize: 11, fontWeight: '700' }}>Online</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 4 }}>~15 min</Text>
        </View>
      </View>

      {/* Time Slots */}
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginHorizontal: 20, marginBottom: 10 }}>🕐 Select Time</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {TIME_SLOTS.map(slot => (
          <TouchableOpacity
            key={slot}
            onPress={() => setSelectedSlot(slot)}
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: selectedSlot === slot ? c.primary : c.card, borderWidth: 1, borderColor: selectedSlot === slot ? c.primary : c.border }}>
            <Text style={{ color: selectedSlot === slot ? '#fff' : c.textMuted, fontWeight: '600', fontSize: 13 }}>{slot}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Address */}
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginHorizontal: 20, marginBottom: 8 }}>📍 Your Address</Text>
      <TextInput
        placeholder="Enter full address where provider should come..."
        placeholderTextColor={c.textMuted}
        style={{ backgroundColor: c.card, color: c.text, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: c.border, fontSize: 14, minHeight: 80, textAlignVertical: 'top' }}
        value={address}
        onChangeText={setAddress}
        multiline
      />

      {/* Notes */}
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginHorizontal: 20, marginBottom: 8 }}>📝 Task Description</Text>
      <TextInput
        placeholder="Describe the problem in detail..."
        placeholderTextColor={c.textMuted}
        style={{ backgroundColor: c.card, color: c.text, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border, fontSize: 14, minHeight: 100, textAlignVertical: 'top' }}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {/* Bill Estimate */}
      <View style={{ backgroundColor: c.card, borderRadius: 18, marginHorizontal: 20, marginBottom: 24, padding: 16, borderWidth: 1, borderColor: c.border }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginBottom: 14 }}>💰 Price Estimate</Text>
        {[
          ['Service Charge', price > 0 ? `₹${price}` : 'TBD by provider'],
          ['Platform Fee', '₹20'],
          ['GST (18%)', price > 0 ? `₹${gst}` : 'On actual'],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{k}</Text>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '500' }}>{v}</Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Estimated Total</Text>
          <Text style={{ color: c.primary, fontWeight: '800', fontSize: 18 }}>{price > 0 ? `₹${total.toFixed(0)}` : 'TBD'}</Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 8 }}>* Final price quoted by provider on acceptance</Text>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        onPress={confirmBooking}
        disabled={loading}
        style={{ backgroundColor: c.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginHorizontal: 20, marginBottom: 40 }}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Send Booking Request →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
