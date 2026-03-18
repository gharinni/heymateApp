import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal,
  FlatList, Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../context/AppThemeContext';

const BACKEND    = 'https://distinguished-elegance-production.up.railway.app/api';
const SOCKET_URL = 'https://distinguished-elegance-production.up.railway.app';

const CATEGORIES = [
  { icon: '🔧', name: 'Plumbing' },   { icon: '⚡', name: 'Electrical' },
  { icon: '🏠', name: 'Cleaning' },   { icon: '🎨', name: 'Painting' },
  { icon: '🔨', name: 'Carpentry' },  { icon: '❄️', name: 'AC Repair' },
  { icon: '🚗', name: 'Car Wash' },   { icon: '📦', name: 'Moving' },
  { icon: '💇', name: 'Salon' },      { icon: '🐾', name: 'Pet Care' },
  { icon: '📚', name: 'Tutoring' },   { icon: '🍔', name: 'Food Delivery' },
];

const STATUS_INFO = {
  pending:         { color: '#f59e0b', icon: '⏳', label: 'Finding Provider...' },
  assigned:        { color: '#3b82f6', icon: '👷', label: 'Provider Assigned' },
  payment_pending: { color: '#8b5cf6', icon: '💳', label: 'Payment Required' },
  active:          { color: '#10b981', icon: '🔄', label: 'Service in Progress' },
  completed:       { color: '#059669', icon: '✅', label: 'Completed' },
  cancelled:       { color: '#ef4444', icon: '❌', label: 'Cancelled' },
};

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem('token');
  const AS = (await import('@react-native-async-storage/async-storage')).default;
  return AS.getItem('token');
};

export default function RequestScreen({ navigation }) {
  const { user }      = useSelector(s => s.auth);
  const { colors: c } = useAppTheme();

  const [tab, setTab]               = useState('my');
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Socket
  const socketRef = useRef(null);
  const [notifList, setNotifList]     = useState([]);
  const [notifCount, setNotifCount]   = useState(0);
  const [notifPanel, setNotifPanel]   = useState(false);
  const [toast, setToast]             = useState(null);

  // Form
  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [category, setCategory]     = useState('');
  const [budget, setBudget]         = useState('');
  const [address, setAddress]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [detailModal, setDetailModal]   = useState(false);
  const [selectedReq, setSelectedReq]   = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [payModal, setPayModal]         = useState(false);
  const [payingReq, setPayingReq]       = useState(null);
  const [paying, setPaying]             = useState(false);

  useEffect(() => {
    fetchMyRequests();
    setupSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect?.(); };
  }, []);

  const showToast = n => {
    setToast(n);
    setNotifList(p => [n, ...p].slice(0, 20));
    setNotifCount(x => x + 1);
    setTimeout(() => setToast(null), 4000);
  };

  const setupSocket = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { io } = await import('socket.io-client');
      socketRef.current = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });

      socketRef.current.on('connect', () => {
        if (user?._id || user?.id) socketRef.current.emit('join-user-room', user._id || user.id);
      });

      socketRef.current.on('new-offer', data => {
        showToast({ id: Date.now(), icon: '💼', title: 'New Offer!',
          message: `Provider sent ₹${data.price} offer`, color: '#f59e0b', bg: '#fffbeb' });
        fetchMyRequests();
      });

      socketRef.current.on('request-status-update', data => {
        if (data.status === 'active') {
          showToast({ id: Date.now(), icon: '✅', title: 'Booking Confirmed!',
            message: 'Provider is on the way!', color: '#10b981', bg: '#f0fdf4' });
        }
        fetchMyRequests();
      });

      socketRef.current.on('payment-confirmed', () => {
        showToast({ id: Date.now(), icon: '💰', title: 'Payment Confirmed!',
          message: 'Service is confirmed', color: '#10b981', bg: '#f0fdf4' });
        fetchMyRequests();
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

  const fetchMyRequests = async () => {
    setRefreshing(true);
    try {
      const data = await apiCall('GET', '/requests/my-requests');
      setMyRequests(data.data || data || []);
    } catch {} finally { setRefreshing(false); }
  };

  const handleSubmit = async () => {
    if (!title.trim())       { Alert.alert('Error', 'Enter a title'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Describe the problem'); return; }
    if (!category)           { Alert.alert('Error', 'Select a category'); return; }
    setSubmitting(true);
    try {
      const data = await apiCall('POST', '/requests', {
        title: title.trim(), description: description.trim(),
        category, budget: budget ? Number(budget) : 0,
        address: address.trim() || 'Address not provided',
      });
      if (data?.success || data?._id || data?.data?._id) {
        Alert.alert('✅ Sent!', 'Providers will see your request instantly!');
        setTitle(''); setDesc(''); setCategory(''); setBudget(''); setAddress('');
        setTab('my'); fetchMyRequests();
      } else {
        Alert.alert('Failed', data?.message || data?.error || 'Try again');
      }
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
  };

  const openDetail = async req => {
    setSelectedReq(req); setDetailModal(true); setLoadingDetail(true);
    try {
      const data = await apiCall('GET', `/requests/${req._id}`);
      if (data?.data || data?._id) setSelectedReq(data.data || data);
    } catch {} finally { setLoadingDetail(false); }
  };

  const acceptOffer = async offerId => {
    try {
      const data = await apiCall('POST', `/requests/${selectedReq._id}/accept-offer`, { offerId });
      if (data?.success || data?.data) {
        Alert.alert('✅ Accepted!', 'Please complete payment to confirm.');
        setDetailModal(false);
        const req = data.data || selectedReq;
        setPayingReq(req); setPayModal(true);
        fetchMyRequests();
      } else Alert.alert('Error', data?.message || 'Failed');
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handlePayment = async method => {
    setPaying(true);
    try {
      const data = await apiCall('POST', `/requests/${payingReq._id}/payment`, {
        paymentId: 'PAY_' + Date.now(), method,
      });
      if (data?.success || data?.data) {
        setPayModal(false);
        Alert.alert('💰 Payment Confirmed!', 'Your booking is confirmed! Provider is on the way.');
        fetchMyRequests();
      } else Alert.alert('Error', data?.message || 'Payment failed');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setPaying(false); }
  };

  const cancelRequest = reqId => Alert.alert('Cancel?', 'Are you sure?', [
    { text: 'No', style: 'cancel' },
    { text: 'Yes', style: 'destructive', onPress: async () => {
      await apiCall('PUT', `/requests/${reqId}/cancel`, { reason: 'Cancelled by user' });
      fetchMyRequests(); setDetailModal(false);
    }},
  ]);

  const ReqCard = ({ item }) => {
    const info = STATUS_INFO[item.status] || STATUS_INFO.pending;
    const cat  = CATEGORIES.find(c => c.name === item.category);
    return (
      <TouchableOpacity onPress={() => openDetail(item)}
        style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 12,
          borderLeftWidth: 4, borderLeftColor: info.color, borderWidth: 1, borderColor: c.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14,
            backgroundColor: info.color + '20', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>{cat?.icon || '🛠️'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 2 }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{item.category}</Text>
            {item.budget > 0 && <Text style={{ color: c.success, fontSize: 12, fontWeight: '600' }}>
              💰 Budget: ₹{item.budget}
            </Text>}
          </View>
          <View>
            <View style={{ backgroundColor: info.color + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: info.color, fontSize: 11, fontWeight: '700' }}>{info.icon} {info.label}</Text>
            </View>
            {item.offers?.length > 0 && (
              <Text style={{ color: '#f59e0b', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                {item.offers.length} offer{item.offers.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={1}>
          📍 {item.location?.address || item.address || 'Location not set'}
        </Text>
        {item.status === 'payment_pending' && (
          <TouchableOpacity onPress={() => { setPayingReq(item); setPayModal(true); }}
            style={{ backgroundColor: '#8b5cf6', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>💳 Pay Now to Confirm</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>

      {/* Header */}
      <View style={{ paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: c.primary }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>📋 Requests</Text>
          <TouchableOpacity onPress={() => { setNotifPanel(true); setNotifCount(0); }}
            style={{ position: 'relative', padding: 4 }}>
            <Text style={{ fontSize: 26 }}>🔔</Text>
            {notifCount > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444',
                borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center',
                alignItems: 'center', paddingHorizontal: 4 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 4 }}>
          {['my', 'new'].map(t => (
            <TouchableOpacity key={t} onPress={() => { setTab(t); if (t === 'my') fetchMyRequests(); }}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                backgroundColor: tab === t ? '#fff' : 'transparent' }}>
              <Text style={{ color: tab === t ? c.primary : 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 13 }}>
                {t === 'my' ? 'My Requests' : '+ New Request'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Toast */}
      {toast && (
        <TouchableOpacity onPress={() => setToast(null)}
          style={{ position: 'absolute', top: 130, left: 12, right: 12,
            flexDirection: 'row', alignItems: 'center', backgroundColor: toast.bg,
            borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: toast.color,
            elevation: 10, zIndex: 999 }}>
          <Text style={{ fontSize: 28, marginRight: 12 }}>{toast.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: toast.color, fontWeight: '700', fontSize: 15, marginBottom: 2 }}>{toast.title}</Text>
            <Text style={{ color: '#374151', fontSize: 13 }} numberOfLines={2}>{toast.message}</Text>
          </View>
          <Text style={{ fontSize: 18, color: '#9ca3af', marginLeft: 8 }}>✕</Text>
        </TouchableOpacity>
      )}

      {/* My Requests Tab */}
      {tab === 'my' && (
        loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        ) : myRequests.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 60 }}>📋</Text>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '700', marginTop: 12 }}>No requests yet</Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
              Tap "+ New Request" to get started
            </Text>
            <TouchableOpacity onPress={() => setTab('new')}
              style={{ backgroundColor: c.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>+ Create Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList data={myRequests} keyExtractor={i => i._id || String(Math.random())}
            renderItem={({ item }) => <ReqCard item={item} />}
            contentContainerStyle={{ padding: 16 }}
            onRefresh={fetchMyRequests} refreshing={refreshing}
            showsVerticalScrollIndicator={false} />
        )
      )}

      {/* New Request Form */}
      {tab === 'new' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>📝 Create New Request</Text>

          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Service Title *</Text>
          <TextInput style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
            fontSize: 15, backgroundColor: c.card, color: c.text, marginBottom: 16 }}
            placeholder="e.g. Fix leaking pipe" placeholderTextColor={c.textMuted}
            value={title} onChangeText={setTitle} />

          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.name} onPress={() => setCategory(cat.name)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
                  paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 2,
                  borderColor: category === cat.name ? c.primary : c.border,
                  backgroundColor: category === cat.name ? `${c.primary}18` : 'transparent' }}>
                <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                <Text style={{ color: category === cat.name ? c.primary : c.text,
                  fontWeight: '600', marginLeft: 6, fontSize: 13 }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Describe the Problem *</Text>
          <TextInput style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
            fontSize: 15, backgroundColor: c.card, color: c.text, height: 100,
            textAlignVertical: 'top', marginBottom: 16 }}
            placeholder="Describe the issue in detail..." placeholderTextColor={c.textMuted}
            value={description} onChangeText={setDesc} multiline />

          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Your Address</Text>
          <TextInput style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
            fontSize: 15, backgroundColor: c.card, color: c.text, marginBottom: 16 }}
            placeholder="Enter your full address" placeholderTextColor={c.textMuted}
            value={address} onChangeText={setAddress} />

          <Text style={{ color: c.text, fontWeight: '600', marginBottom: 8 }}>Budget ₹ (Optional)</Text>
          <TextInput style={{ borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14,
            fontSize: 15, backgroundColor: c.card, color: c.text, marginBottom: 16 }}
            placeholder="e.g. 500" placeholderTextColor={c.textMuted}
            value={budget} onChangeText={setBudget} keyboardType="number-pad" />

          <TouchableOpacity onPress={handleSubmit} disabled={submitting}
            style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16,
              alignItems: 'center', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                  🚀 Send Request to Providers
                </Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" transparent onRequestClose={() => setDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 20, maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>Request Details</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}>
                <Text style={{ fontSize: 26, color: c.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color={c.primary} />
              </View>
            ) : selectedReq && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status */}
                {(() => {
                  const info = STATUS_INFO[selectedReq.status] || STATUS_INFO.pending;
                  return (
                    <View style={{ backgroundColor: info.color + '15', borderRadius: 14,
                      padding: 16, borderWidth: 1, borderColor: info.color, marginBottom: 14 }}>
                      <Text style={{ color: info.color, fontSize: 18, fontWeight: '800' }}>
                        {info.icon} {info.label}
                      </Text>
                    </View>
                  );
                })()}

                {/* Info */}
                <View style={{ backgroundColor: c.bg, borderRadius: 14, padding: 14, marginBottom: 12 }}>
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: '800', marginBottom: 4 }}>
                    {selectedReq.title}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 8 }}>{selectedReq.category}</Text>
                  <Text style={{ color: c.text, fontSize: 14, lineHeight: 22, marginBottom: 8 }}>
                    {selectedReq.description}
                  </Text>
                  {selectedReq.budget > 0 && (
                    <Text style={{ color: c.success, fontSize: 14, fontWeight: '600' }}>💰 Budget: ₹{selectedReq.budget}</Text>
                  )}
                  <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }}>
                    📍 {selectedReq.location?.address || selectedReq.address}
                  </Text>
                </View>

                {/* Offers */}
                {selectedReq.offers?.filter(o => o.status === 'pending').length > 0 && (
                  <View>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>
                      💼 Provider Offers ({selectedReq.offers.filter(o => o.status === 'pending').length})
                    </Text>
                    {selectedReq.offers.filter(o => o.status === 'pending').map(offer => (
                      <View key={offer._id} style={{ backgroundColor: c.bg, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                          <View style={{ width: 50, height: 50, borderRadius: 25,
                            backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 28 }}>👷</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 2 }}>
                              {offer.provider?.user?.name || 'Provider'}
                            </Text>
                            <Text style={{ color: c.success, fontSize: 16, fontWeight: '800' }}>💰 ₹{offer.price}</Text>
                            {offer.message && (
                              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4 }}>{offer.message}</Text>
                            )}
                          </View>
                        </View>
                        {selectedReq.status === 'pending' && (
                          <TouchableOpacity onPress={() => Alert.alert('Accept Offer?',
                            `Accept for ₹${offer.price}?\nYou will be redirected to payment.`,
                            [{ text: 'Cancel', style: 'cancel' },
                              { text: 'Accept & Pay', onPress: () => acceptOffer(offer._id) }])}
                            style={{ backgroundColor: c.success, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                              ✅ Accept & Pay ₹{offer.price}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Pay Now */}
                {selectedReq.status === 'payment_pending' && (
                  <TouchableOpacity onPress={() => { setDetailModal(false); setPayingReq(selectedReq); setPayModal(true); }}
                    style={{ backgroundColor: '#8b5cf6', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                      💳 Complete Payment ₹{selectedReq.finalAmount}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Cancel */}
                {['pending', 'payment_pending'].includes(selectedReq.status) && (
                  <TouchableOpacity onPress={() => cancelRequest(selectedReq._id)}
                    style={{ backgroundColor: '#fee2e2', borderRadius: 14, padding: 14,
                      alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 14 }}>❌ Cancel Request</Text>
                  </TouchableOpacity>
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Notification Panel */}
      <Modal visible={notifPanel} animationType="slide" transparent onRequestClose={() => setNotifPanel(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 20, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>🔔 Notifications</Text>
              <TouchableOpacity onPress={() => setNotifPanel(false)}>
                <Text style={{ fontSize: 26, color: c.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            {notifList.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ fontSize: 50 }}>🔕</Text>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>No notifications</Text>
              </View>
            ) : (
              <FlatList data={notifList} keyExtractor={i => String(i.id)}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 14,
                    borderLeftWidth: 4, borderLeftColor: item.color, marginBottom: 8,
                    borderRadius: 12, backgroundColor: item.bg }}>
                    <Text style={{ fontSize: 26, marginRight: 12, marginTop: 2 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: item.color, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{item.title}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18 }}>{item.message}</Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }} />
            )}
            {notifList.length > 0 && (
              <TouchableOpacity onPress={() => { setNotifList([]); setNotifCount(0); }}
                style={{ alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: c.border }}>
                <Text style={{ color: '#ef4444', fontWeight: '600' }}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={payModal} animationType="slide" transparent onRequestClose={() => setPayModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>💳 Complete Payment</Text>
              <TouchableOpacity onPress={() => setPayModal(false)}>
                <Text style={{ fontSize: 26, color: c.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            {payingReq && (
              <ScrollView>
                <View style={{ backgroundColor: '#f0fdf4', borderRadius: 14, padding: 20,
                  alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 8 }}>
                    {payingReq.title}
                  </Text>
                  <Text style={{ fontSize: 36, fontWeight: '800', color: '#10b981', marginBottom: 4 }}>
                    ₹{payingReq.finalAmount || payingReq.budget || 0}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>Provider accepted your request</Text>
                </View>

                <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>
                  Choose Payment Method
                </Text>

                {[
                  { icon: '📱', label: 'UPI', sub: 'GPay, PhonePe, Paytm', method: 'upi' },
                  { icon: '💳', label: 'Card', sub: 'Debit / Credit Card', method: 'card' },
                  { icon: '🏦', label: 'Net Banking', sub: 'All major banks', method: 'netbanking' },
                  { icon: '💵', label: 'Cash', sub: 'Pay after service', method: 'cash' },
                ].map(m => (
                  <TouchableOpacity key={m.label} onPress={() => handlePayment(m.method)} disabled={paying}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg,
                      borderRadius: 14, padding: 16, marginBottom: 10, opacity: paying ? 0.6 : 1 }}>
                    <Text style={{ fontSize: 28 }}>{m.icon}</Text>
                    <View style={{ marginLeft: 14, flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{m.label}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{m.sub}</Text>
                    </View>
                    {paying ? <ActivityIndicator color={c.primary} />
                      : <Text style={{ color: c.textMuted, fontSize: 20 }}>›</Text>}
                  </TouchableOpacity>
                ))}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
