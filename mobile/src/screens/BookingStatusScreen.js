import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';
import { bookingAPI } from '../api/booking.api';

const STEPS = [
  { key: 'PENDING',     icon: '📤', label: 'Request Sent',     sub: 'Waiting for provider to accept' },
  { key: 'ACCEPTED',    icon: '✅', label: 'Accepted',         sub: 'Provider is on the way to you' },
  { key: 'IN_PROGRESS', icon: '🔧', label: 'Work In Progress', sub: 'Provider is working on the task' },
  { key: 'COMPLETED',   icon: '🎉', label: 'Completed',        sub: 'Service done successfully' },
];

export default function BookingStatusScreen({ route, navigation }) {
  const { booking, provider, service } = route.params;
  const { colors } = useAppTheme();
  const c = colors;

  const [status, setStatus]         = useState(booking?.status || 'PENDING');
  const [bookingData, setBookingData] = useState(booking);
  const [lastChecked, setLastChecked] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollRef   = useRef(null);
  const mountedRef = useRef(true);

  // Pulse animation while PENDING
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
    return () => { mountedRef.current = false; };
  }, []);

  // ── Real polling every 4 seconds ────────────────────────────────
  useEffect(() => {
    if (!booking?.id) return;

    const poll = async () => {
      try {
        const res = await bookingAPI.getById(booking.id);
        if (!mountedRef.current) return;
        const newStatus = res.data?.status;
        setLastChecked(new Date().toLocaleTimeString());
        if (newStatus && newStatus !== status) {
          setStatus(newStatus);
          setBookingData(res.data);
          // Notify on acceptance
          if (newStatus === 'ACCEPTED') {
            Alert.alert(
              '🎉 Request Accepted!',
              `${provider?.name || 'Your provider'} has accepted your booking and is on the way!`,
              [{ text: 'Great!' }]
            );
          }
        }
      } catch {
        // Backend not reachable — keep polling silently
      }
    };

    poll(); // immediate first check
    pollRef.current = setInterval(poll, 4000);
    return () => clearInterval(pollRef.current);
  }, [booking?.id, status]);

  const currentIdx = STEPS.findIndex(s => s.key === status);
  const step = STEPS[Math.max(0, currentIdx)];
  const providerName = provider?.name || provider?.user?.name || bookingData?.provider?.user?.name || 'Provider';

  const statusColor = {
    PENDING:     '#F59E0B',
    ACCEPTED:    c.success,
    IN_PROGRESS: c.primary,
    COMPLETED:   c.success,
  }[status] || c.primary;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 60 }}>

      {/* Header */}
      <View style={{ padding: 20, paddingTop: 56 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, marginBottom: 20 }}>
          <Text style={{ color: c.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>Booking #{bookingData?.id || booking?.id}</Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 3 }}>{service?.label} · {providerName}</Text>
          </View>
          <View style={{ backgroundColor: `${statusColor}20`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: `${statusColor}44` }}>
            <Text style={{ color: statusColor, fontWeight: '800', fontSize: 12 }}>{status}</Text>
          </View>
        </View>
      </View>

      {/* Big animated status icon */}
      <View style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Animated.View style={[
          { width: 110, height: 110, borderRadius: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 2,
            backgroundColor: `${statusColor}18`, borderColor: `${statusColor}55` },
          status === 'PENDING' && { transform: [{ scale: pulseAnim }] },
        ]}>
          <Text style={{ fontSize: 52 }}>{step.icon}</Text>
        </Animated.View>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginTop: 16 }}>{step.label}</Text>
        <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>{step.sub}</Text>

        {/* Live polling indicator */}
        {status === 'PENDING' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: `${c.warning}15`, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}>
            <ActivityIndicator size="small" color={c.warning} />
            <Text style={{ color: c.warning, fontSize: 12, fontWeight: '600' }}>
              Checking for updates every 4 sec...
            </Text>
          </View>
        )}

        {status === 'ACCEPTED' && (
          <View style={{ marginTop: 14, backgroundColor: `${c.success}15`, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: `${c.success}33` }}>
            <Text style={{ color: c.success, fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
              ✅ {providerName} accepted your request!
            </Text>
          </View>
        )}

        {lastChecked && (
          <Text style={{ color: c.border, fontSize: 10, marginTop: 10 }}>Last updated: {lastChecked}</Text>
        )}
      </View>

      {/* Progress steps */}
      <View style={{ backgroundColor: c.card, borderRadius: 20, marginHorizontal: 20, padding: 20, borderWidth: 1, borderColor: c.border, marginBottom: 16 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginBottom: 16 }}>📋 Booking Progress</Text>
        {STEPS.map((s, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          return (
            <View key={s.key} style={{ flexDirection: 'row', gap: 14, marginBottom: i < STEPS.length - 1 ? 18 : 0 }}>
              <View style={{ alignItems: 'center', width: 28 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? c.success : active ? statusColor : c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: done ? 14 : 13, color: '#fff' }}>{done ? '✓' : s.icon}</Text>
                </View>
                {i < STEPS.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: done ? c.success : c.border, marginTop: 4 }} />}
              </View>
              <View style={{ flex: 1, paddingTop: 4 }}>
                <Text style={{ color: active || done ? c.text : c.textMuted, fontWeight: active ? '800' : '600', fontSize: 14 }}>{s.label}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{s.sub}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Provider info */}
      <View style={{ backgroundColor: c.card, borderRadius: 18, marginHorizontal: 20, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 16 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginBottom: 12 }}>🧰 Provider</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: `${service?.color || c.primary}22`, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>{service?.icon || '🔧'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{providerName}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>⭐ {provider?.rating || bookingData?.provider?.rating || '5.0'} · {provider?.totalOrders || 0} jobs</Text>
          </View>
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: `${c.success}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${c.success}44` }}>
            <Text style={{ fontSize: 18 }}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Booking details */}
      <View style={{ backgroundColor: c.card, borderRadius: 18, marginHorizontal: 20, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 24 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 14, marginBottom: 12 }}>📄 Details</Text>
        {[
          ['Booking ID', `#${bookingData?.id || booking?.id}`],
          ['Service',    service?.label || booking?.serviceType],
          ['Time Slot',  booking?.timeSlot || bookingData?.timeSlot || 'ASAP'],
          ['Address',    booking?.address || bookingData?.address || '—'],
          ['Notes',      booking?.notes   || bookingData?.notes || '—'],
        ].map(([k, v]) => v && v !== '—' ? (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <Text style={{ color: c.textMuted, fontSize: 13, minWidth: 80 }}>{k}</Text>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' }} numberOfLines={2}>{v}</Text>
          </View>
        ) : null)}
      </View>

      {/* Action buttons */}
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {(status === 'ACCEPTED' || status === 'IN_PROGRESS') && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Tracking', { booking: bookingData || booking, provider, service })}
            style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>🗺️ Track Provider Live</Text>
          </TouchableOpacity>
        )}
        {status === 'COMPLETED' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Payment', { booking: bookingData || booking })}
            style={{ backgroundColor: c.success, borderRadius: 14, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>💳 Proceed to Payment</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={{ backgroundColor: c.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.textMuted, fontWeight: '600', fontSize: 14 }}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
