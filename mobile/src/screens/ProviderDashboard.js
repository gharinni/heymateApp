import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Switch, ActivityIndicator, TextInput, Modal, RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { bookingAPI } from '../api/booking.api';
import { providerAPI } from '../api/provider.api';
import { useAppTheme } from '../context/AppThemeContext';
import { AVAILABILITY, SERVICES } from '../constants';

export default function ProviderDashboard({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { colors } = useAppTheme();
  const c = colors;

  const [isOnline, setIsOnline]         = useState(false);
  const [availability, setAvailability] = useState(user?.availability || 'on_demand');
  const [requests, setRequests]         = useState([]);
  const [completed, setCompleted]       = useState([]);
  const [stats, setStats]               = useState({ totalOrders: 0, rating: 5.0, earnings: 0 });
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [tab, setTab]                   = useState('requests');
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [newCount, setNewCount]         = useState(0);

  const [priceModal, setPriceModal]     = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [quotedPrice, setQuotedPrice]   = useState('');
  const [availModal, setAvailModal]     = useState(false);
  const [accepting, setAccepting]       = useState(false);

  const pollRef   = useRef(null);
  const prevCount = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    // Poll for new requests every 5 seconds when online
    pollRef.current = setInterval(() => { if (isOnline) pollRequests(); }, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
    };
  }, []);

  // Re-start poll when isOnline changes
  useEffect(() => {
    clearInterval(pollRef.current);
    if (isOnline) {
      pollRef.current = setInterval(pollRequests, 5000);
    }
  }, [isOnline]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchRequests(), fetchStats()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRequests(), fetchStats()]);
    setRefreshing(false);
  };

  const fetchRequests = async () => {
    try {
      const res = await bookingAPI.getPendingRequests();
      if (!mountedRef.current) return;
      const list = res.data || [];
      // Alert if new requests came in
      if (list.length > prevCount.current && prevCount.current >= 0) {
        const diff = list.length - prevCount.current;
        setNewCount(diff);
        if (diff > 0 && prevCount.current >= 0) {
          Alert.alert('🔔 New Request!', `You have ${diff} new booking request${diff>1?'s':''}!`, [{ text: 'View' }]);
        }
      }
      prevCount.current = list.length;
      setRequests(list);
    } catch (e) {
      // Keep current requests if fetch fails
    }
  };

  const pollRequests = async () => {
    try {
      const res = await bookingAPI.getPendingRequests();
      if (!mountedRef.current) return;
      const list = res.data || [];
      if (list.length > prevCount.current) {
        const diff = list.length - prevCount.current;
        setNewCount(n => n + diff);
        Alert.alert('🔔 New Request!', `${diff} new booking request${diff>1?'s':', !'} just arrived!`, [{ text: 'View Now' }]);
      }
      prevCount.current = list.length;
      setRequests(list);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await providerAPI.getStats();
      if (!mountedRef.current) return;
      if (res.data) {
        setStats(res.data);
        setIsOnline(res.data.isOnline || false);
      }
    } catch {}
  };

  const toggleOnline = async (val) => {
    setIsOnline(val);
    setTogglingOnline(true);
    try {
      await providerAPI.toggleOnline(val);
    } catch {}
    setTogglingOnline(false);
    if (val) Alert.alert('🟢 You are Online', 'Customers can now find and book you!');
  };

  const setAvail = async (avail) => {
    setAvailability(avail);
    dispatch(setUser({ ...user, availability: avail }));
    setAvailModal(false);
  };

  const openAcceptModal = (booking) => {
    setSelectedBooking(booking);
    setQuotedPrice(booking.price ? String(booking.price) : '');
    setPriceModal(true);
  };

  const confirmAccept = async () => {
    if (!quotedPrice || isNaN(Number(quotedPrice))) {
      Alert.alert('Enter price', 'Please enter a valid amount in ₹');
      return;
    }
    setAccepting(true);
    try {
      await bookingAPI.accept(selectedBooking.id, parseFloat(quotedPrice));
      setPriceModal(false);
      setRequests(prev => prev.filter(r => r.id !== selectedBooking.id));
      setCompleted(prev => [{ ...selectedBooking, status: 'ACCEPTED', price: quotedPrice }, ...prev]);
      setStats(s => ({ ...s, totalOrders: (s.totalOrders || 0) + 1 }));
      Alert.alert('✅ Job Accepted!', `You quoted ₹${quotedPrice}. The customer has been notified!\n\nHead to the address now.`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not accept booking. Check your connection.');
    } finally {
      setAccepting(false);
    }
  };

  const declineRequest = (bookingId) => {
    Alert.alert('Decline Request', 'Are you sure you want to decline this job?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => {
        try {
          await bookingAPI.decline(bookingId);
        } catch {}
        setRequests(prev => prev.filter(r => r.id !== bookingId));
      }},
    ]);
  };

  const getSvc = (id) => SERVICES.find(s => s.id === id) || { icon: '🔧', label: id, color: c.primary };
  const availInfo = AVAILABILITY.find(a => a.id === availability) || AVAILABILITY[5];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}>

        {/* Header */}
        <View style={{ padding: 20, paddingTop: 56 }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Provider Mode 🧰</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>Dashboard</Text>
            <TouchableOpacity onPress={onRefresh} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ fontSize: 16 }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Online Toggle */}
        <View style={{ backgroundColor: c.card, borderRadius: 20, marginHorizontal: 20, marginBottom: 14, padding: 18, borderWidth: 2, borderColor: isOnline ? `${c.success}55` : c.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isOnline ? c.success : c.textMuted }} />
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 17 }}>
                  {togglingOnline ? 'Updating...' : isOnline ? 'You are Online' : 'You are Offline'}
                </Text>
              </View>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }}>
                {isOnline ? '✅ Customers can find & book you • Checking every 5s' : 'Toggle ON to start receiving requests'}
              </Text>
            </View>
            {togglingOnline
              ? <ActivityIndicator color={c.primary} />
              : <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ true: c.success, false: c.border }} thumbColor="#fff" />}
          </View>

          {/* Availability */}
          <TouchableOpacity onPress={() => setAvailModal(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: c.bg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontSize: 20 }}>{availInfo.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{availInfo.label}</Text>
              <Text style={{ color: c.textMuted, fontSize: 11 }}>{availInfo.sub}</Text>
            </View>
            <Text style={{ color: c.textMuted }}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 }}>
          {[
            { icon: '💰', label: 'Earnings', val: `₹${stats.earnings || 0}` },
            { icon: '✅', label: 'Jobs Done', val: stats.totalOrders || completed.length },
            { icon: '⭐', label: 'Rating',   val: `${stats.rating || '5.0'}` },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: c.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, marginTop: 6 }}>{s.val}</Text>
              <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 }}>
          {[
            { key: 'requests', label: `📥 Requests`, badge: requests.length },
            { key: 'active',   label: '🔧 Active',   badge: 0 },
            { key: 'history',  label: '📋 History',  badge: 0 },
          ].map(t => (
            <TouchableOpacity key={t.key} onPress={() => { setTab(t.key); if(t.key==='requests') setNewCount(0); }}
              style={{ flex: 1, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: tab === t.key ? c.primary : c.border, backgroundColor: tab === t.key ? `${c.primary}18` : c.card }}>
              <Text style={{ color: tab === t.key ? c.primary : c.textMuted, fontWeight: '700', fontSize: 11 }}>
                {t.label}{t.badge > 0 ? ` (${t.badge})` : ''}
              </Text>
              {t.key === 'requests' && newCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{newCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {loading ? (
          <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={{ color: c.textMuted }}>Loading requests...</Text>
          </View>
        ) : tab === 'requests' ? (
          <RequestsTab
            requests={requests} isOnline={isOnline} colors={c}
            onRefresh={onRefresh} onAccept={openAcceptModal} onDecline={declineRequest} getSvc={getSvc}
          />
        ) : tab === 'active' ? (
          <EmptyTab icon="🔧" title="No active jobs" sub="Accepted jobs appear here" colors={c} />
        ) : (
          <HistoryTab completed={completed} colors={c} getSvc={getSvc} />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Accept + Price Modal */}
      <Modal visible={priceModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 28, borderTopWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 4 }}>💰 Quote Your Price</Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 6 }}>
              {selectedBooking?.user?.name || 'Customer'} · {selectedBooking?.serviceType}
            </Text>
            {selectedBooking?.address ? (
              <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>📍 {selectedBooking.address}</Text>
            ) : null}
            {selectedBooking?.notes ? (
              <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 16 }}>📝 {selectedBooking.notes}</Text>
            ) : null}

            <TextInput
              style={{ backgroundColor: c.bg, color: c.text, fontSize: 36, fontWeight: '800', borderRadius: 16, padding: 18, borderWidth: 2, borderColor: c.primary, textAlign: 'center', marginBottom: 8 }}
              value={quotedPrice} onChangeText={setQuotedPrice}
              placeholder="0" placeholderTextColor={c.border}
              keyboardType="number-pad" autoFocus
            />
            <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 24 }}>Amount in ₹ (customer will see this)</Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setPriceModal(false)}
                style={{ flex: 1, backgroundColor: c.bg, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
                <Text style={{ color: c.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAccept} disabled={accepting}
                style={{ flex: 2, backgroundColor: c.success, borderRadius: 14, padding: 16, alignItems: 'center', opacity: accepting ? 0.7 : 1 }}>
                {accepting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>✅ Accept Job</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Availability Modal */}
      <Modal visible={availModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, borderTopWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>⏰ Set Availability</Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 18 }}>When are you available to work?</Text>
            {AVAILABILITY.map(a => (
              <TouchableOpacity key={a.id} onPress={() => setAvail(a.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: availability === a.id ? `${c.primary}18` : c.bg, borderWidth: 1, borderColor: availability === a.id ? c.primary : c.border }}>
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: availability === a.id ? c.primary : c.text, fontWeight: '700', fontSize: 14 }}>{a.label}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }}>{a.sub}</Text>
                </View>
                {availability === a.id && <Text style={{ color: c.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setAvailModal(false)}
              style={{ backgroundColor: c.bg, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.textMuted, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function RequestsTab({ requests, isOnline, colors: c, onRefresh, onAccept, onDecline, getSvc }) {
  if (!isOnline) return (
    <View style={{ margin: 20, backgroundColor: `${c.warning}15`, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: `${c.warning}44` }}>
      <Text style={{ color: c.warning, fontWeight: '800', fontSize: 15, marginBottom: 6 }}>⚠️ You are Offline</Text>
      <Text style={{ color: c.textMuted, fontSize: 13 }}>Turn on the Online toggle to start receiving requests from customers.</Text>
    </View>
  );

  if (requests.length === 0) return (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <Text style={{ fontSize: 52 }}>📭</Text>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>No pending requests</Text>
      <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
        Customers who book you will appear here instantly.{'\n'}Pull down to refresh.
      </Text>
      <TouchableOpacity onPress={onRefresh}
        style={{ marginTop: 18, backgroundColor: `${c.primary}20`, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: `${c.primary}44` }}>
        <Text style={{ color: c.primary, fontWeight: '700' }}>🔄 Refresh Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {requests.map(req => {
        const svc = getSvc(req.serviceType);
        const timeAgo = req.createdAt ? getTimeAgo(req.createdAt) : 'Just now';
        return (
          <View key={req.id} style={{ backgroundColor: c.card, borderRadius: 18, marginHorizontal: 20, marginBottom: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
            {/* NEW badge */}
            <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: c.primary, borderBottomLeftRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>NEW REQUEST</Text>
            </View>

            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, marginTop: 4 }}>
                <View style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: `${svc.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{svc.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{req.user?.name || 'Customer'}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }}>{svc.label} · {req.timeSlot || 'ASAP'} · {timeAgo}</Text>
                </View>
              </View>

              {[
                req.address && { icon: '📍', val: req.address },
                req.notes   && { icon: '📝', val: req.notes },
              ].filter(Boolean).map((d, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                  <Text style={{ fontSize: 14 }}>{d.icon}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 13, flex: 1 }}>{d.val}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border }}>
              <TouchableOpacity onPress={() => onDecline(req.id)}
                style={{ flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: c.border }}>
                <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>✕ Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onAccept(req)}
                style={{ flex: 2, padding: 14, alignItems: 'center', backgroundColor: `${c.success}18` }}>
                <Text style={{ color: c.success, fontWeight: '800', fontSize: 14 }}>✅ Accept & Quote Price</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );
}

function HistoryTab({ completed, colors: c, getSvc }) {
  if (completed.length === 0) return <EmptyTab icon="📋" title="No history yet" sub="Completed jobs will appear here" colors={c} />;
  return (
    <>
      {completed.map((b, i) => {
        const svc = getSvc(b.serviceType);
        return (
          <View key={i} style={{ backgroundColor: c.card, borderRadius: 16, marginHorizontal: 20, marginBottom: 10, padding: 16, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 26 }}>{svc.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{b.user?.name || 'Customer'}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{svc.label} · ₹{b.price || '—'}</Text>
              </View>
              <View style={{ backgroundColor: `${c.success}20`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: c.success, fontSize: 12, fontWeight: '700' }}>✅ Done</Text>
              </View>
            </View>
          </View>
        );
      })}
    </>
  );
}

function EmptyTab({ icon, title, sub, colors: c }) {
  return (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <Text style={{ fontSize: 52 }}>{icon}</Text>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>{title}</Text>
      <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>{sub}</Text>
    </View>
  );
}

function getTimeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  return `${Math.floor(diff/3600)}h ago`;
}
