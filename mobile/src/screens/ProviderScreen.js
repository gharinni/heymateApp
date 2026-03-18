import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Alert,
  ActivityIndicator, Modal, ScrollView, TextInput, Platform, Switch,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../context/AppThemeContext';

const BACKEND    = 'https://distinguished-elegance-production.up.railway.app/api';
const SOCKET_URL = 'https://distinguished-elegance-production.up.railway.app';

const STATUS_INFO = {
  pending:         { color: '#f59e0b', icon: '⏳', label: 'Pending' },
  assigned:        { color: '#3b82f6', icon: '👷', label: 'Assigned' },
  payment_pending: { color: '#8b5cf6', icon: '💳', label: 'Payment Pending' },
  active:          { color: '#10b981', icon: '🔄', label: 'Active' },
  completed:       { color: '#059669', icon: '✅', label: 'Completed' },
  cancelled:       { color: '#ef4444', icon: '❌', label: 'Cancelled' },
};

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  const AS = (await import('@react-native-async-storage/async-storage')).default;
  return AS.getItem('token');
};

export default function ProviderScreen({ navigation }) {
  const { user }      = useSelector(s => s.auth);
  const { colors: c } = useAppTheme();
  const socket        = useRef(null);

  const [tab, setTab]               = useState('new');
  const [newRequests, setNewRequests] = useState([]);
  const [activeJobs, setActiveJobs]  = useState([]);
  const [history, setHistory]        = useState([]);
  const [loading, setLoading]        = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Offer modal
  const [offerModal, setOfferModal]     = useState(false);
  const [selectedReq, setSelectedReq]   = useState(null);
  const [offerPrice, setOfferPrice]     = useState('');
  const [offerMsg, setOfferMsg]         = useState('');
  const [submitting, setSubmitting]     = useState(false);

  // Detail modal
  const [detailModal, setDetailModal]   = useState(false);
  const [detailJob, setDetailJob]       = useState(null);

  // New request alert
  const [newAlert, setNewAlert]         = useState(null);

  // Stats
  const [stats, setStats] = useState({ totalJobs: 0, earnings: 0, rating: 5.0 });

  useEffect(() => {
    fetchRequests();
    setupSocket();
    return () => { if (socket.current) socket.current.disconnect?.(); };
  }, []);

  const setupSocket = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { io } = await import('socket.io-client');
      socket.current = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });

      socket.current.on('connect', () => {
        socket.current.emit('join-providers');
      });

      socket.current.on('new-request', data => {
        setNewAlert(data);
        fetchRequests();
        setTimeout(() => setNewAlert(null), 5000);
      });

      socket.current.on('payment-confirmed', data => {
        Alert.alert('💰 Payment Confirmed!', (data.message || 'Customer paid!') + '\n\n📍 ' + (data.userAddress || ''));
        fetchRequests();
      });

      socket.current.on('request-cancelled', () => {
        Alert.alert('❌ Cancelled', 'Customer cancelled the request.');
        fetchRequests();
      });
    } catch {}
  };

  const apiCall = async (method, url, body = null) => {
    const token = await getToken();
    const res = await fetch(`${BACKEND}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      ...(body && { body: JSON.stringify(body) }),
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return {}; }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [newRes, activeRes, histRes] = await Promise.all([
        apiCall('GET', '/requests/provider-requests'),
        apiCall('GET', '/requests/provider-active'),
        apiCall('GET', '/requests/provider-history'),
      ]);
      setNewRequests(newRes?.data || newRes || []);
      setActiveJobs(activeRes?.data || activeRes || []);
      setHistory(histRes?.data || histRes || []);

      // Calculate stats
      const allJobs = [...(activeRes?.data || []), ...(histRes?.data || [])];
      const earnings = allJobs.reduce((sum, j) => sum + (j.finalAmount || 0), 0);
      setStats({ totalJobs: allJobs.length, earnings, rating: 5.0 });
    } catch {} finally { setLoading(false); }
  };

  const toggleAvailability = async val => {
    setIsAvailable(val);
    try {
      await apiCall('PUT', '/providers/availability', { isAvailable: val });
      if (socket.current?.connected) {
        socket.current.emit('update-availability', { isAvailable: val });
      }
    } catch {}
  };

  const submitOffer = async () => {
    if (!offerPrice || isNaN(Number(offerPrice))) {
      Alert.alert('Error', 'Enter a valid price'); return;
    }
    setSubmitting(true);
    try {
      const data = await apiCall('POST', `/requests/${selectedReq._id}/offer`, {
        price: Number(offerPrice), message: offerMsg,
      });
      if (data?.success || data?.data) {
        setOfferModal(false);
        setOfferPrice(''); setOfferMsg('');
        Alert.alert('✅ Offer Sent!', 'Customer will be notified of your offer.');
        fetchRequests();
      } else Alert.alert('Error', data?.message || 'Failed to send offer');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  const markComplete = async jobId => Alert.alert('Mark Complete?', 'Have you finished the service?', [
    { text: 'Not Yet', style: 'cancel' },
    { text: '✅ Yes, Done!', onPress: async () => {
      try {
        await apiCall('PUT', `/requests/${jobId}/complete`);
        Alert.alert('🎉 Great Work!', 'Service marked as completed!');
        fetchRequests();
      } catch (e) { Alert.alert('Error', e.message); }
    }},
  ]);

  const RequestCard = ({ item }) => (
    <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: c.border }}>
      {/* New badge */}
      <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: c.primary,
        borderBottomLeftRadius: 12, paddingHorizontal: 12, paddingVertical: 4, zIndex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>NEW</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: 8 }}>
        <View style={{ width: 50, height: 50, borderRadius: 14,
          backgroundColor: `${c.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>🛠️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {item.title || item.user?.name || 'Customer Request'}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
            {item.category} · {item.timeSlot || 'ASAP'}
          </Text>
        </View>
      </View>

      {item.location?.address && (
        <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 4 }}>📍 {item.location.address}</Text>
      )}
      {item.description && (
        <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
          📝 {item.description}
        </Text>
      )}
      {item.budget > 0 && (
        <Text style={{ color: c.success, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>
          💰 Customer budget: ₹{item.budget}
        </Text>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <TouchableOpacity onPress={() => { setSelectedReq(item); setOfferModal(true); }}
          style={{ flex: 2, backgroundColor: `${c.success}18`, borderRadius: 12, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: c.success, fontWeight: '800', fontSize: 14 }}>✅ Send Offer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#fee2e2', borderRadius: 12,
          padding: 12, alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 13 }}>✕ Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ActiveJobCard = ({ item }) => {
    const info = STATUS_INFO[item.status] || STATUS_INFO.active;
    return (
      <TouchableOpacity onPress={() => { setDetailJob(item); setDetailModal(true); }}
        style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 12,
          borderWidth: 1, borderColor: c.border, borderLeftWidth: 4, borderLeftColor: info.color }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>🔧</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{item.title}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
              {item.user?.name || '—'}
            </Text>
          </View>
          <View style={{ backgroundColor: `${info.color}20`, borderRadius: 10,
            paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: info.color, fontSize: 11, fontWeight: '700' }}>
              {info.icon} {info.label}
            </Text>
          </View>
        </View>
        {item.finalAmount > 0 && (
          <Text style={{ color: c.success, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>
            💰 ₹{item.finalAmount}
          </Text>
        )}
        {item.status === 'active' && (
          <TouchableOpacity onPress={() => markComplete(item._id)}
            style={{ backgroundColor: c.success, borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>✅ Mark as Completed</Text>
          </TouchableOpacity>
        )}
        {item.status === 'payment_pending' && (
          <View style={{ backgroundColor: `${c.warning}15`, borderRadius: 10, padding: 10, alignItems: 'center' }}>
            <Text style={{ color: c.warning, fontWeight: '600', fontSize: 13 }}>
              ⏳ Waiting for customer payment...
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>

      {/* New request alert */}
      {newAlert && (
        <TouchableOpacity onPress={() => { setTab('new'); setNewAlert(null); }}
          style={{ position: 'absolute', top: 100, left: 12, right: 12, zIndex: 999,
            backgroundColor: c.primary, borderRadius: 14, padding: 16,
            flexDirection: 'row', alignItems: 'center', elevation: 10 }}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>New Request!</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {newAlert.title || newAlert.category} — Tap to view
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 20 }}>›</Text>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={undefined}>

        {/* Header */}
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>PROVIDER MODE</Text>
          <Text style={{ color: c.text, fontSize: 24, fontWeight: '800', marginTop: 2 }}>
            {user?.name?.split(' ')[0] || 'Dashboard'} 👷
          </Text>
        </View>

        {/* Availability Toggle */}
        <View style={{ backgroundColor: c.card, borderRadius: 20, marginHorizontal: 20, marginBottom: 14,
          padding: 18, borderWidth: 2, borderColor: isAvailable ? `${c.success}66` : c.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5,
                  backgroundColor: isAvailable ? c.success : c.textMuted }} />
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 17 }}>
                  {isAvailable ? 'You are Available' : 'You are Offline'}
                </Text>
              </View>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                {isAvailable ? '🟢 Customers can find and book you' : 'Go online to receive requests'}
              </Text>
            </View>
            <Switch value={isAvailable} onValueChange={toggleAvailability}
              trackColor={{ true: c.success, false: c.border }} thumbColor="#fff" />
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 }}>
          {[
            { icon: '💰', label: 'Earnings',  val: `₹${stats.earnings}` },
            { icon: '✅', label: 'Jobs Done', val: stats.totalJobs },
            { icon: '⭐', label: 'Rating',    val: stats.rating.toFixed(1) },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: c.card, borderRadius: 14, padding: 14,
              alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, marginTop: 6 }}>{s.val}</Text>
              <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 }}>
          {[
            { key: 'new',    label: '📥 Requests', n: newRequests.length },
            { key: 'active', label: '🔧 Active',   n: activeJobs.length },
            { key: 'history',label: '📋 History',  n: 0 },
          ].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                borderWidth: 1.5,
                borderColor: tab === t.key ? c.primary : c.border,
                backgroundColor: tab === t.key ? `${c.primary}15` : c.card }}>
              <Text style={{ color: tab === t.key ? c.primary : c.textMuted, fontWeight: '700', fontSize: 11 }}>
                {t.label}{t.n > 0 ? ` (${t.n})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 20 }}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={c.primary} />
            </View>
          ) : tab === 'new' ? (
            newRequests.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 50 }}>
                <Text style={{ fontSize: 52 }}>📭</Text>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
                  No requests yet
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                  {isAvailable ? 'New requests will appear here instantly' : 'Go online to receive requests'}
                </Text>
              </View>
            ) : (
              newRequests.map(item => <RequestCard key={item._id} item={item} />)
            )
          ) : tab === 'active' ? (
            activeJobs.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 50 }}>
                <Text style={{ fontSize: 52 }}>🔧</Text>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>No active jobs</Text>
              </View>
            ) : (
              activeJobs.map(item => <ActiveJobCard key={item._id} item={item} />)
            )
          ) : (
            history.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 50 }}>
                <Text style={{ fontSize: 52 }}>📋</Text>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>No history yet</Text>
              </View>
            ) : (
              history.map(item => {
                const done = ['completed'].includes(item.status);
                return (
                  <View key={item._id} style={{ backgroundColor: c.card, borderRadius: 14, padding: 14,
                    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
                    borderWidth: 1, borderColor: c.border }}>
                    <Text style={{ fontSize: 26, marginRight: 12 }}>🔧</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: '700', fontSize: 14 }}>{item.title}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                        {item.user?.name || '—'} · ₹{item.finalAmount || '—'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: done ? `${c.success}20` : '#FEE2E2',
                      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: done ? c.success : '#EF4444', fontSize: 12, fontWeight: '700' }}>
                        {done ? '✅ Done' : '❌ Cancelled'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Offer Modal */}
      <Modal visible={offerModal} animationType="slide" transparent onRequestClose={() => setOfferModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24, paddingBottom: 44 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>💼 Send Your Offer</Text>
              <TouchableOpacity onPress={() => setOfferModal(false)}>
                <Text style={{ fontSize: 26, color: c.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedReq && (
              <View style={{ backgroundColor: c.bg, borderRadius: 14, padding: 14, marginBottom: 20 }}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{selectedReq.title}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>{selectedReq.category}</Text>
                {selectedReq.budget > 0 && (
                  <Text style={{ color: c.success, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                    Customer budget: ₹{selectedReq.budget}
                  </Text>
                )}
              </View>
            )}

            <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Your Price (₹) *</Text>
            <TextInput
              style={{ borderWidth: 2, borderColor: c.primary, borderRadius: 16, padding: 16,
                fontSize: 40, fontWeight: '800', color: c.text, backgroundColor: c.bg,
                textAlign: 'center', marginBottom: 16 }}
              value={offerPrice} onChangeText={setOfferPrice}
              placeholder="0" placeholderTextColor={c.border}
              keyboardType="number-pad" autoFocus />

            <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Message (Optional)</Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
                fontSize: 15, color: c.text, backgroundColor: c.bg, marginBottom: 20, height: 80,
                textAlignVertical: 'top' }}
              value={offerMsg} onChangeText={setOfferMsg}
              placeholder="e.g. I can do this today, experienced in..." placeholderTextColor={c.textMuted}
              multiline />

            <TouchableOpacity onPress={submitOffer} disabled={submitting}
              style={{ backgroundColor: c.success, borderRadius: 14, padding: 16,
                alignItems: 'center', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    ✅ Send Offer to Customer
                  </Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" transparent onRequestClose={() => setDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>Job Details</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}>
                <Text style={{ fontSize: 26, color: c.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            {detailJob && (
              <ScrollView>
                <View style={{ backgroundColor: c.bg, borderRadius: 14, padding: 16, marginBottom: 14 }}>
                  <Text style={{ color: c.text, fontWeight: '800', fontSize: 16, marginBottom: 8 }}>
                    {detailJob.title}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 14 }}>👤 {detailJob.user?.name || '—'}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 4 }}>
                    📍 {detailJob.location?.address || detailJob.address || '—'}
                  </Text>
                  {detailJob.finalAmount > 0 && (
                    <Text style={{ color: c.success, fontSize: 16, fontWeight: '800', marginTop: 8 }}>
                      💰 ₹{detailJob.finalAmount}
                    </Text>
                  )}
                </View>
                {detailJob.status === 'active' && (
                  <TouchableOpacity onPress={() => { setDetailModal(false); markComplete(detailJob._id); }}
                    style={{ backgroundColor: c.success, borderRadius: 14, padding: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>✅ Mark as Completed</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
