import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { bookingApi, paymentApi, reviewApi } from '../api/services';
import { COLORS } from '../constants';

// ─── BookingScreen ───────────────────────────────────────────────────────────
export function BookingScreen({ route, navigation }) {
  const { provider, service } = route.params || {};
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!address.trim()) { Alert.alert('Error', 'Please enter service address'); return; }
    setLoading(true);
    try {
      const res = await bookingApi.create({
        serviceType: service?.id || provider?.serviceType,
        serviceAddress: address,
        notes,
        providerId: provider?.id,
      });
      Alert.alert('Request Sent!', `Your request has been sent to ${provider?.name || 'nearby providers'}.`);
      navigation.navigate('Tracking', { booking: res.data.data });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color: COLORS.text, fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Book Service</Text>
      </View>

      {provider && (
        <View style={s.providerCard}>
          <Text style={{ fontSize: 36 }}>👷</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.providerName}>{provider.name}</Text>
            <Text style={s.providerMeta}>⭐ {provider.rating} · {provider.totalOrders} orders</Text>
            <Text style={{ color: COLORS.primary, fontWeight: '700', marginTop: 2 }}>
              ₹{provider.basePrice} {provider.priceUnit || ''}
            </Text>
          </View>
        </View>
      )}

      <View style={s.form}>
        <Text style={s.label}>📍 Service Address</Text>
        <TextInput style={s.input} placeholder="Enter your full address" placeholderTextColor={COLORS.textMuted}
          value={address} onChangeText={setAddress} multiline />

        <Text style={s.label}>📝 Notes to Provider</Text>
        <TextInput style={[s.input, { minHeight: 80 }]} placeholder="Describe the issue..." placeholderTextColor={COLORS.textMuted}
          value={notes} onChangeText={setNotes} multiline />

        <View style={s.priceBox}>
          <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 10 }}>💰 Price Estimate</Text>
          <Row label="Service Charge" value={`₹${provider?.basePrice || 'TBD'}`} />
          <Row label="Platform Fee" value="₹20" />
          <Row label="GST 18%" value="~₹7" />
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 8 }} />
          <Row label="Total" value={provider?.basePrice ? `₹${+provider.basePrice + 27}` : 'After quote'} bold />
        </View>

        <TouchableOpacity style={s.btn} onPress={handleBook} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send Request →</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: bold ? COLORS.primary : COLORS.text, fontWeight: bold ? '700' : '400', fontSize: bold ? 16 : 13 }}>{value}</Text>
    </View>
  );
}

// ─── TrackingScreen ──────────────────────────────────────────────────────────
export function TrackingScreen({ route, navigation }) {
  const { booking } = route.params || {};

  return (
    <View style={s.container}>
      <View style={{ padding: 20, paddingTop: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success }} />
          <Text style={{ color: COLORS.success, fontWeight: '700' }}>Live Tracking</Text>
        </View>
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '800' }}>
          {booking?.provider?.name || 'Provider'} is on the way!
        </Text>
      </View>

      {/* Map placeholder */}
      <View style={{ margin: 16, height: 240, backgroundColor: COLORS.card, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border }}>
        <Text style={{ fontSize: 42 }}>🗺️</Text>
        <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Google Maps Live Tracking</Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>Connect Google Maps SDK to enable</Text>
      </View>

      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: COLORS.success }]}
          onPress={() => navigation.navigate('Payment', { booking })}
        >
          <Text style={s.btnText}>✅ Mark as Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── PaymentScreen ───────────────────────────────────────────────────────────
export function PaymentScreen({ route, navigation }) {
  const { booking } = route.params || {};
  const [loading, setLoading] = useState(false);

  const handlePay = async (method) => {
    setLoading(true);
    try {
      const initRes = await paymentApi.initiate(booking?.id);
      const payData = initRes.data.data;

      // In production: integrate RazorpayCheckout.open() here
      // RazorpayCheckout.open({ key: payData.razorpayKeyId, order_id: payData.razorpayOrderId, ... })
      // For now simulate success:
      Alert.alert('Payment Successful!', 'Thank you for using HeyMate 🎉', [
        { text: 'Rate Provider', onPress: () => navigation.navigate('Feedback', { booking }) }
      ]);
    } catch (e) {
      Alert.alert('Payment Failed', e.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { icon: '📱', label: 'UPI / GPay / PhonePe', sub: 'Instant · Recommended', id: 'UPI' },
    { icon: '💳', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', id: 'CARD' },
    { icon: '🏦', label: 'Net Banking', sub: 'All major banks', id: 'NET_BANKING' },
    { icon: '💵', label: 'Cash on Delivery', sub: 'Pay after service', id: 'COD' },
  ];

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color: COLORS.text, fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>💳 Payment</Text>
      </View>

      <View style={[s.priceBox, { margin: 16 }]}>
        <Text style={{ color: COLORS.success, fontWeight: '700', marginBottom: 10 }}>Service Completed ✅</Text>
        <Row label="Service" value="₹350" />
        <Row label="Platform Fee" value="₹20" />
        <Row label="GST 18%" value="₹7" />
        <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 8 }} />
        <Row label="Total" value="₹377" bold />
      </View>

      <Text style={[s.label, { paddingHorizontal: 16 }]}>Choose Payment</Text>
      {methods.map((m) => (
        <TouchableOpacity key={m.id} style={s.payMethodCard} onPress={() => handlePay(m.id)}>
          <Text style={{ fontSize: 26 }}>{m.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 13 }}>{m.label}</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>{m.sub}</Text>
          </View>
          <Text style={{ color: COLORS.border, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── FeedbackScreen ──────────────────────────────────────────────────────────
export function FeedbackScreen({ route, navigation }) {
  const { booking } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { Alert.alert('Error', 'Please select a rating'); return; }
    setLoading(true);
    try {
      await reviewApi.submit({ bookingId: booking?.id, rating, comment });
      Alert.alert('Thank You!', 'Your feedback has been submitted 🎉', [
        { text: 'Home', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.container, { padding: 24, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 60, marginBottom: 16 }}>⭐</Text>
      <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 4 }}>
        Rate {booking?.provider?.name || 'Provider'}
      </Text>
      <Text style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 24 }}>
        How was your experience?
      </Text>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {[1,2,3,4,5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={{ fontSize: 36, opacity: n <= rating ? 1 : 0.3 }}>⭐</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[s.input, { width: '100%', minHeight: 90 }]}
        placeholder="Write your feedback..."
        placeholderTextColor={COLORS.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <TouchableOpacity style={[s.btn, { width: '100%', marginTop: 16 }]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Submit Feedback 🎉</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, gap: 12 },
  backBtn: { width: 36, height: 36, backgroundColor: COLORS.card, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  providerCard: { margin: 16, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', gap: 12, alignItems: 'center' },
  providerName: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  providerMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  form: { padding: 16 },
  label: { color: COLORS.text, fontWeight: '600', fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, color: COLORS.text, fontSize: 14, marginBottom: 14 },
  priceBox: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  payMethodCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
