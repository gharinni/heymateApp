import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  const AS = (await import('@react-native-async-storage/async-storage')).default;
  return AS.getItem('token');
};

export default function PaymentScreen({ route, navigation }) {
  const { requestId, amount, requestTitle } = route.params || {};
  const { colors: c } = useAppTheme();
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [paid, setPaid]         = useState(false);

  const paymentMethods = [
    { id: 'upi',        icon: '📱', label: 'UPI',         sub: 'GPay, PhonePe, Paytm', color: '#6366f1' },
    { id: 'card',       icon: '💳', label: 'Card',        sub: 'Debit / Credit Card',   color: '#3b82f6' },
    { id: 'netbanking', icon: '🏦', label: 'Net Banking', sub: 'All major banks',        color: '#0ea5e9' },
    { id: 'cash',       icon: '💵', label: 'Cash',        sub: 'Pay after service',      color: '#10b981' },
  ];

  const handlePayment = async method => {
    if (!method) { Alert.alert('Select', 'Please select a payment method'); return; }
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/requests/${requestId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentId: 'PAY_' + Date.now(), method }),
      });
      const data = await res.json();
      if (data?.success || data?.data) {
        setPaid(true);
      } else {
        Alert.alert('Payment Failed', data?.message || 'Please try again');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Payment failed');
    } finally { setLoading(false); }
  };

  if (paid) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 80 }}>🎉</Text>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '800', marginTop: 20, textAlign: 'center' }}>
          Payment Confirmed!
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 24 }}>
          Your booking is confirmed.{'\n'}Provider is on the way!
        </Text>
        <View style={{ backgroundColor: `${c.success}15`, borderRadius: 20, padding: 20,
          marginTop: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: `${c.success}33` }}>
          <Text style={{ color: c.success, fontWeight: '800', fontSize: 18 }}>₹{amount}</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }}>Amount Paid</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}
          style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16,
            alignItems: 'center', width: '100%', marginTop: 32 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>🏠 Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: c.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>💳 Complete Payment</Text>
        <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 4 }}>
          Choose your preferred payment method
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Amount Card */}
        <View style={{ backgroundColor: `${c.success}15`, borderRadius: 20, padding: 24,
          alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: `${c.success}33` }}>
          <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 8 }}>Total Amount</Text>
          <Text style={{ color: c.success, fontSize: 48, fontWeight: '800' }}>₹{amount || 0}</Text>
          <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }} numberOfLines={2}>
            {requestTitle || 'Service Payment'}
          </Text>
        </View>

        {/* Payment Methods */}
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 14 }}>
          Select Payment Method
        </Text>

        {paymentMethods.map(method => (
          <TouchableOpacity key={method.id}
            onPress={() => setSelected(method.id)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card,
              borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 2,
              borderColor: selected === method.id ? method.color : c.border }}>
            <View style={{ width: 52, height: 52, borderRadius: 14,
              backgroundColor: selected === method.id ? method.color + '20' : c.bg,
              alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 28 }}>{method.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{method.label}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{method.sub}</Text>
            </View>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2,
              borderColor: selected === method.id ? method.color : c.border,
              backgroundColor: selected === method.id ? method.color : 'transparent',
              alignItems: 'center', justifyContent: 'center' }}>
              {selected === method.id && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {/* Security Note */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>
            Your payment is secure and encrypted. We never store your card details.
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          onPress={() => handlePayment(selected)}
          disabled={loading || !selected}
          style={{ backgroundColor: selected ? c.primary : c.border, borderRadius: 16, padding: 18,
            alignItems: 'center', opacity: loading ? 0.7 : 1 }}>
          {loading ? <ActivityIndicator color="#fff" size="large" />
            : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
                {selected === 'cash' ? '💵 Confirm Cash Payment' : `💳 Pay ₹${amount || 0}`}
              </Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
