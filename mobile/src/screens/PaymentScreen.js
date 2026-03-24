import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';
import { bookingAPI } from '../api/booking.api';

export default function PaymentScreen({ route, navigation }) {
  const { booking } = route.params;
  const { colors } = useAppTheme();
  const c = colors;

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const price = parseFloat(String(booking?.price || '0').replace(/[^0-9.]/g, '')) || 0;
  const platformFee = 20;
  const gst = Math.round((price + platformFee) * 0.18);
  const total = price + platformFee + gst;

  const methods = [
    { id: 'upi',  icon: '📱', label: 'UPI / GPay / PhonePe', sub: 'Instant · Recommended', badge: 'FAST' },
    { id: 'card', icon: '💳', label: 'Credit / Debit Card',  sub: 'Visa, Mastercard, RuPay', badge: null },
    { id: 'net',  icon: '🏦', label: 'Net Banking',           sub: 'All major banks', badge: null },
    { id: 'cod',  icon: '💵', label: 'Cash on Delivery',      sub: 'Pay directly to provider', badge: null },
  ];

  const handlePay = () => {
    if (!selected) { Alert.alert('Choose payment method', 'Please select how you want to pay.'); return; }

    const method = methods.find(m => m.id === selected);
    Alert.alert(
      `Pay ₹${total > 20 ? total.toFixed(0) : '—'} via ${method.label}`,
      selected === 'cod'
        ? 'You will pay the provider directly in cash once the service is done.'
        : 'You will be redirected to complete payment securely.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: selected === 'cod' ? 'Confirm' : 'Pay Now',
          onPress: async () => {
            setLoading(true);
            try {
              await bookingAPI.updateStatus(booking.id, 'COMPLETED').catch(() => {});
              await new Promise(r => setTimeout(r, 1500)); // simulate payment
              setPaid(true);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // SUCCESS SCREEN
  if (paid) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 110, height: 110, borderRadius: 34, backgroundColor: `${c.success}22`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${c.success}55`, marginBottom: 20 }}>
          <Text style={{ fontSize: 54 }}>🎉</Text>
        </View>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '800', marginBottom: 8 }}>Payment Done!</Text>
        <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Your payment of ₹{total > 20 ? total.toFixed(0) : '—'} was successful.{'\n'}Thank you for using HeyMate!
        </Text>
        <View style={{ backgroundColor: c.card, borderRadius: 18, width: '100%', padding: 20, borderWidth: 1, borderColor: c.border, marginBottom: 28 }}>
          {[
            ['Booking ID', `#${booking?.id || '—'}`],
            ['Service', booking?.serviceType],
            ['Amount Paid', total > 20 ? `₹${total.toFixed(0)}` : '₹—'],
            ['Status', '✅ Paid'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{v}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Feedback', { booking })}
          style={{ width: '100%', backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>⭐ Rate this Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={{ width: '100%', backgroundColor: c.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.textMuted, fontWeight: '600', fontSize: 14 }}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ padding: 20, paddingTop: 56 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, marginBottom: 16 }}>
          <Text style={{ color: c.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>💳 Payment</Text>
        <Text style={{ color: c.success, fontSize: 14, marginTop: 4 }}>Service Completed ✅</Text>
      </View>

      {/* Bill Card */}
      <View style={{ backgroundColor: c.card, borderRadius: 18, marginHorizontal: 20, marginBottom: 24, padding: 18, borderWidth: 1, borderColor: c.border }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginBottom: 14 }}>🧾 Bill Summary</Text>
        {[
          ['Service Charge', price > 0 ? `₹${price.toFixed(0)}` : 'TBD'],
          ['Platform Fee', '₹20'],
          [`GST (18%)`, price > 0 ? `₹${gst}` : 'On actual'],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{k}</Text>
            <Text style={{ color: c.text, fontSize: 13 }}>{v}</Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Total Amount</Text>
          <Text style={{ color: c.primary, fontWeight: '800', fontSize: 22 }}>{price > 0 ? `₹${total.toFixed(0)}` : 'TBD'}</Text>
        </View>
      </View>

      {/* Payment Methods */}
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginHorizontal: 20, marginBottom: 12 }}>Choose Payment Method</Text>
      {methods.map(m => (
        <TouchableOpacity
          key={m.id}
          onPress={() => setSelected(m.id)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10, borderWidth: 2, borderColor: selected === m.id ? c.primary : c.border }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: selected === m.id ? `${c.primary}22` : c.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Text style={{ fontSize: 22 }}>{m.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>{m.label}</Text>
              {m.badge && (
                <View style={{ backgroundColor: `${c.success}22`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: c.success, fontSize: 10, fontWeight: '800' }}>{m.badge}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{m.sub}</Text>
          </View>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected === m.id ? c.primary : c.border, alignItems: 'center', justifyContent: 'center' }}>
            {selected === m.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.primary }} />}
          </View>
        </TouchableOpacity>
      ))}

      {/* Pay Button */}
      <TouchableOpacity
        onPress={handlePay}
        disabled={loading}
        style={{ backgroundColor: c.success, borderRadius: 16, padding: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 16, marginBottom: 40, opacity: loading ? 0.7 : 1 }}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {selected === 'cod' ? 'Confirm Cash Payment' : `Pay ${price > 0 ? `₹${total.toFixed(0)}` : 'Now'} →`}
            </Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}
