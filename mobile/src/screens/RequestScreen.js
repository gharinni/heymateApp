// Re-exports the uploaded RequestScreen with our theme adapter
// This is a bridge so it works with AppThemeContext + Redux instead of AuthContext/ThemeContext

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../context/AppThemeContext';
import { API_URL } from '../api/index';
import socket from '../services/socket';

const CATEGORIES = [
  { icon:'🔧', name:'Plumbing' },   { icon:'⚡', name:'Electrical' },
  { icon:'🏠', name:'Cleaning' },   { icon:'🎨', name:'Painting' },
  { icon:'🔨', name:'Carpentry' },  { icon:'❄️', name:'AC Repair' },
  { icon:'🚗', name:'Car Wash' },   { icon:'📦', name:'Moving' },
  { icon:'💇', name:'Salon' },      { icon:'🐾', name:'Pet Care' },
  { icon:'📚', name:'Tutoring' },   { icon:'🍔', name:'Food' },
];

const STATUS_INFO = {
  pending:         { color:'#f59e0b', icon:'⏳', label:'Finding Provider...' },
  assigned:        { color:'#3b82f6', icon:'👷', label:'Provider Assigned' },
  payment_pending: { color:'#8b5cf6', icon:'💳', label:'Payment Required' },
  active:          { color:'#10b981', icon:'🔄', label:'In Progress' },
  completed:       { color:'#059669', icon:'✅', label:'Completed' },
  cancelled:       { color:'#ef4444', icon:'❌', label:'Cancelled' },
};

export default function RequestScreen() {
  const { user } = useSelector(s => s.auth);
  const { colors: c } = useAppTheme();

  const [tab, setTab]             = useState('my');
  const [myRequests, setMyRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [notif, setNotif]         = useState(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState([]);
  const [notifPanel, setNotifPanel] = useState(false);

  const [title, setTitle]         = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]   = useState('');
  const [budget, setBudget]       = useState('');
  const [address, setAddress]     = useState('');
  const [userLoc, setUserLoc]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [detailModal, setDetailModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payingReq, setPayingReq] = useState(null);

  useEffect(() => {
    fetchMyRequests();
    detectLocation();
    setupSocket();
    return () => socket.removeAllListeners();
  }, []);

  const setupSocket = async () => {
    await socket.connect(user?._id || user?.id);
    socket.onNewOffer(data => showNotif({ id:Date.now(), type:'offer', icon:'💼', title:'New Offer!',
      message:`Provider sent ₹${data.price} offer`, time:new Date().toLocaleTimeString(), color:'#f59e0b', bg:'#fffbeb' }));
    socket.onStatusUpdate(data => {
      if (data.status==='active') showNotif({ id:Date.now(), type:'payment', icon:'💰', title:'Payment Confirmed!',
        message:'Your booking is confirmed! Provider is on the way.', time:new Date().toLocaleTimeString(), color:'#10b981', bg:'#f0fdf4' });
      if (data.status==='completed') showNotif({ id:Date.now(), type:'completed', icon:'🎉', title:'Service Completed!',
        message:'Service completed successfully!', time:new Date().toLocaleTimeString(), color:'#2563eb', bg:'#eff6ff' });
      fetchMyRequests();
    });
  };

  const showNotif = n => {
    setNotif(n); setNotifVisible(true);
    setNotifCount(p => p+1); setNotifList(p => [n,...p].slice(0,20));
    setTimeout(() => setNotifVisible(false), 4000);
  };

  const getToken = async () => {
    if (Platform.OS === 'web') return localStorage.getItem('token');
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem('token');
  };

  const apiCall = async (method, url, data=null) => {
    const token = await getToken();
    if (!token) throw new Error('Not logged in. Please login again.');
    const res = await fetch(`${API_URL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      ...(data && { body: JSON.stringify(data) }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('Session expired. Please login again.');
    return json;
  };

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status!=='granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const [addr] = await Location.reverseGeocodeAsync(loc.coords);
      setUserLoc(loc.coords);
      if (addr) setAddress(`${addr.street||''} ${addr.district||''} ${addr.city||''} ${addr.region||''}`.trim());
    } catch {}
  };

  const fetchMyRequests = async () => {
    setRefreshing(true);
    try { const res = await apiCall('GET','/requests/my-requests'); setMyRequests(res.data||[]); }
    catch {} finally { setRefreshing(false); }
  };

  const handleSubmit = async () => {
    if (!title.trim())       { Alert.alert('Error','Enter a title'); return; }
    if (!description.trim()) { Alert.alert('Error','Describe the problem'); return; }
    if (!category)           { Alert.alert('Error','Select a category'); return; }
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) { Alert.alert('Not logged in','Please log in again.'); setSubmitting(false); return; }

      const payload = {
        title:       title.trim(),
        description: description.trim(),
        category,
        budget:      budget ? Number(budget) : 0,
        address:     address.trim() || 'Address not provided',
        latitude:    userLoc?.latitude  || null,
        longitude:   userLoc?.longitude || null,
      };

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      let res = {};
      try { res = await response.json(); } catch {}

      if (res.success || res._id || res.id || response.ok) {
        socket.emit('new-request', {
          requestId:   res.data?._id || res.data?.id || res._id,
          title:       payload.title,
          category,
          serviceType: category.toLowerCase(),
          description: payload.description,
          address:     payload.address,
          budget:      payload.budget,
          latitude:    payload.latitude,
          longitude:   payload.longitude,
          user:        { name: user?.name, id: user?._id || user?.id },
          createdAt:   new Date().toISOString(),
        });
        Alert.alert('Request Sent!', 'Nearby providers will see it instantly.');
        setTitle(''); setDescription(''); setCategory(''); setBudget(''); setAddress('');
        setTab('my');
        fetchMyRequests();
      } else {
        Alert.alert('Failed', res.message || res.error || `Error ${response.status}. Try logging out and back in.`);
      }
    } catch (e) {
      Alert.alert('Network Error', e.message || 'Could not reach server.');
    } finally {
      setSubmitting(false);
    }
  };

  const openRequest = async req => {
    setSelectedReq(req); setDetailModal(true); setLoadingDetail(true);
    try { const res = await apiCall('GET',`/requests/${req._id}`); if (res.success) setSelectedReq(res.data); }
    catch {} finally { setLoadingDetail(false); }
  };

  const acceptOffer = async offerId => {
    try {
      const res = await apiCall('POST',`/requests/${selectedReq._id}/accept-offer`,{ offerId });
      if (res.success) {
        Alert.alert('✅ Accepted!','Please pay to confirm booking.');
        setDetailModal(false);
        const req = res.data||selectedReq;
        if (!req.finalAmount) { const o=selectedReq.offers?.find(x=>x._id===offerId); if(o) req.finalAmount=o.price; }
        setPayingReq(req); setPaymentModal(true); fetchMyRequests();
      } else Alert.alert('Error',res.message);
    } catch (e) { Alert.alert('Error',e.message); }
  };

  const handlePayment = async () => {
    try {
      const res = await apiCall('POST',`/requests/${payingReq._id}/payment`,{ paymentId:'PAY_'+Date.now() });
      if (res.success) {
        setPaymentModal(false);
        Alert.alert('💰 Payment Confirmed!','Booking confirmed!\nProvider will arrive soon.'); fetchMyRequests();
      } else Alert.alert('Error',res.message);
    } catch (e) { Alert.alert('Error',e.message); }
  };

  const cancelReq = reqId => {
    Alert.alert('Cancel?','Sure you want to cancel?',[
      { text:'No', style:'cancel' },
      { text:'Yes', style:'destructive', onPress: async () => {
        await apiCall('PUT',`/requests/${reqId}/cancel`,{ reason:'Cancelled by user' });
        fetchMyRequests(); setDetailModal(false);
      }},
    ]);
  };

  const ReqCard = ({ item }) => {
    const info = STATUS_INFO[item.status]||STATUS_INFO.pending;
    const cat  = CATEGORIES.find(c=>c.name===item.category);
    return (
      <TouchableOpacity onPress={() => openRequest(item)}
        style={{ backgroundColor:c.card, borderRadius:16, padding:16, marginBottom:12, borderLeftWidth:4, borderLeftColor:info.color, borderWidth:1, borderColor:c.border }}>
        <View style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:8 }}>
          <View style={{ width:48, height:48, borderRadius:14, backgroundColor:`${info.color}20`, justifyContent:'center', alignItems:'center' }}>
            <Text style={{ fontSize:24 }}>{cat?.icon||'🛠️'}</Text>
          </View>
          <View style={{ flex:1, marginLeft:12 }}>
            <Text style={{ color:c.text, fontSize:15, fontWeight:'700', marginBottom:2 }} numberOfLines={1}>{item.title}</Text>
            <Text style={{ color:c.textMuted, fontSize:12 }}>{item.category}</Text>
            {item.budget>0&&<Text style={{ color:c.success, fontSize:12, fontWeight:'600' }}>💰 Budget: ₹{item.budget}</Text>}
          </View>
          <View>
            <View style={{ backgroundColor:`${info.color}20`, paddingHorizontal:8, paddingVertical:4, borderRadius:8 }}>
              <Text style={{ color:info.color, fontSize:11, fontWeight:'700' }}>{info.icon} {info.label}</Text>
            </View>
            {item.offers?.length>0&&<Text style={{ color:'#f59e0b', fontSize:11, textAlign:'center', marginTop:4 }}>{item.offers.length} offer{item.offers.length>1?'s':''}</Text>}
          </View>
        </View>
        <Text style={{ color:c.textMuted, fontSize:12 }} numberOfLines={1}>📍 {item.location?.address||'Location not set'}</Text>
        {item.status==='payment_pending'&&(
          <TouchableOpacity onPress={() => { setPayingReq(item); setPaymentModal(true); }}
            style={{ backgroundColor:'#8b5cf6', borderRadius:10, padding:10, alignItems:'center', marginTop:8 }}>
            <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>💳 Pay Now to Confirm</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex:1, backgroundColor:c.bg }}>

      {/* Header */}
      <View style={{ paddingTop:52, paddingBottom:12, paddingHorizontal:16, backgroundColor:c.primary }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <Text style={{ color:'#fff', fontSize:20, fontWeight:'800' }}>📋 Requests</Text>
          <TouchableOpacity onPress={() => { setNotifPanel(true); setNotifCount(0); }} style={{ position:'relative', padding:4 }}>
            <Text style={{ fontSize:26 }}>🔔</Text>
            {notifCount>0&&<View style={{ position:'absolute', top:-2, right:-2, backgroundColor:'#ef4444', borderRadius:10, minWidth:20, height:20, justifyContent:'center', alignItems:'center', paddingHorizontal:4 }}>
              <Text style={{ color:'#fff', fontSize:11, fontWeight:'800' }}>{notifCount>9?'9+':notifCount}</Text>
            </View>}
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection:'row', backgroundColor:'rgba(255,255,255,0.2)', borderRadius:12, padding:4 }}>
          {['my','new'].map(t => (
            <TouchableOpacity key={t} onPress={() => { setTab(t); if(t==='my') fetchMyRequests(); }}
              style={{ flex:1, paddingVertical:8, borderRadius:10, alignItems:'center', backgroundColor:tab===t?'#fff':'transparent' }}>
              <Text style={{ color:tab===t?c.primary:'rgba(255,255,255,0.8)', fontWeight:'700', fontSize:13 }}>
                {t==='my'?'My Requests':'+ New Request'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Toast notification */}
      {notifVisible&&notif&&(
        <TouchableOpacity onPress={() => setNotifVisible(false)}
          style={{ position:'absolute', top:130, left:12, right:12, flexDirection:'row', alignItems:'center',
            backgroundColor:notif.bg, borderRadius:14, padding:14, borderLeftWidth:4, borderLeftColor:notif.color, elevation:10, zIndex:999 }}>
          <Text style={{ fontSize:28, marginRight:12 }}>{notif.icon}</Text>
          <View style={{ flex:1 }}>
            <Text style={{ color:notif.color, fontWeight:'700', fontSize:15, marginBottom:2 }}>{notif.title}</Text>
            <Text style={{ color:'#374151', fontSize:13 }} numberOfLines={2}>{notif.message}</Text>
          </View>
          <Text style={{ fontSize:18, color:'#9ca3af', marginLeft:8 }}>✕</Text>
        </TouchableOpacity>
      )}

      {/* My requests */}
      {tab==='my' && (
        refreshing ? (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        ) : myRequests.length===0 ? (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:40 }}>
            <Text style={{ fontSize:60 }}>📋</Text>
            <Text style={{ color:c.text, fontSize:20, fontWeight:'700', marginTop:12 }}>No requests yet</Text>
            <Text style={{ color:c.textMuted, fontSize:13, marginTop:6, marginBottom:20, textAlign:'center' }}>Tap "+ New Request" to get started</Text>
            <TouchableOpacity onPress={() => setTab('new')}
              style={{ backgroundColor:c.primary, borderRadius:14, paddingHorizontal:24, paddingVertical:12 }}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:15 }}>+ Create Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList data={myRequests} keyExtractor={i=>i._id}
            renderItem={({ item }) => <ReqCard item={item} />}
            contentContainerStyle={{ padding:16 }}
            onRefresh={fetchMyRequests} refreshing={refreshing} showsVerticalScrollIndicator={false} />
        )
      )}

      {/* New request form */}
      {tab==='new' && (
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color:c.text, fontSize:20, fontWeight:'800', marginBottom:16 }}>📝 Create New Request</Text>
          {[
            { label:'Service Title *', val:title, set:setTitle, ph:'e.g. Fix leaking pipe', kb:'default' },
            { label:'Your Address *',  val:address, set:setAddress, ph:'Full address', kb:'default' },
            { label:'Budget ₹ (optional)', val:budget, set:setBudget, ph:'e.g. 500', kb:'number-pad' },
          ].map(f => (
            <View key={f.label}>
              <Text style={{ color:c.text, fontWeight:'600', marginBottom:8 }}>{f.label}</Text>
              <TextInput style={{ borderWidth:1.5, borderColor:c.border, borderRadius:12, padding:14, fontSize:15, backgroundColor:c.card, color:c.text, marginBottom:14 }}
                placeholder={f.ph} placeholderTextColor={c.textMuted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
            </View>
          ))}
          <Text style={{ color:c.text, fontWeight:'600', marginBottom:8 }}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.name} onPress={() => setCategory(cat.name)}
                style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:10, borderRadius:20, marginRight:8, borderWidth:2,
                  borderColor:category===cat.name?c.primary:c.border, backgroundColor:category===cat.name?`${c.primary}18`:'transparent' }}>
                <Text style={{ fontSize:18 }}>{cat.icon}</Text>
                <Text style={{ color:category===cat.name?c.primary:c.text, fontWeight:'600', marginLeft:6, fontSize:13 }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={{ color:c.text, fontWeight:'600', marginBottom:8 }}>Describe the Problem *</Text>
          <TextInput style={{ borderWidth:1.5, borderColor:c.border, borderRadius:12, padding:14, fontSize:15, backgroundColor:c.card, color:c.text, height:100, textAlignVertical:'top', marginBottom:14 }}
            placeholder="Describe the issue..." placeholderTextColor={c.textMuted}
            value={description} onChangeText={setDescription} multiline />
          <TouchableOpacity onPress={handleSubmit} disabled={submitting}
            style={{ backgroundColor:c.primary, borderRadius:14, padding:16, alignItems:'center', opacity:submitting?0.7:1 }}>
            {submitting ? <ActivityIndicator color="#fff" />
              : <Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>🚀 Send Request to Providers</Text>}
          </TouchableOpacity>
          <View style={{ height:40 }} />
        </ScrollView>
      )}

      {/* Request detail modal */}
      <Modal visible={detailModal} animationType="slide" transparent onRequestClose={() => setDetailModal(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:c.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'92%', borderTopWidth:1, borderTopColor:c.border }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <Text style={{ color:c.text, fontSize:20, fontWeight:'800' }}>Request Details</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}><Text style={{ fontSize:26, color:c.textMuted }}>✕</Text></TouchableOpacity>
            </View>
            {loadingDetail ? <ActivityIndicator size="large" color={c.primary} style={{ padding:40 }} />
            : selectedReq && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {(() => { const info=STATUS_INFO[selectedReq.status]||STATUS_INFO.pending; return (
                  <View style={{ backgroundColor:`${info.color}15`, borderRadius:14, padding:16, borderWidth:1, borderColor:info.color, marginBottom:14 }}>
                    <Text style={{ color:info.color, fontSize:18, fontWeight:'800' }}>{info.icon} {info.label}</Text>
                  </View>
                );})()}
                <View style={{ backgroundColor:c.bg, borderRadius:14, padding:14, marginBottom:12 }}>
                  <Text style={{ color:c.text, fontSize:17, fontWeight:'700', marginBottom:4 }}>{selectedReq.title}</Text>
                  <Text style={{ color:c.textMuted, fontSize:13, marginBottom:8 }}>{selectedReq.category}</Text>
                  <Text style={{ color:c.text, fontSize:14, lineHeight:22, marginBottom:8 }}>{selectedReq.description}</Text>
                  {selectedReq.budget>0&&<Text style={{ color:c.success, fontWeight:'600' }}>💰 Budget: ₹{selectedReq.budget}</Text>}
                  <Text style={{ color:c.textMuted, fontSize:13, marginTop:4 }}>📍 {selectedReq.location?.address}</Text>
                </View>

                {/* Offers */}
                {selectedReq.offers?.filter(o=>o.status==='pending').length>0&&(
                  <View>
                    <Text style={{ color:c.text, fontWeight:'700', fontSize:16, marginBottom:12 }}>
                      💼 Provider Offers ({selectedReq.offers.filter(o=>o.status==='pending').length})
                    </Text>
                    {selectedReq.offers.filter(o=>o.status==='pending').map(offer => (
                      <View key={offer._id} style={{ backgroundColor:c.bg, borderRadius:14, padding:14, marginBottom:10, borderWidth:1, borderColor:c.border }}>
                        <View style={{ flexDirection:'row', alignItems:'center', marginBottom:10 }}>
                          <View style={{ width:50, height:50, borderRadius:25, backgroundColor:`${c.primary}18`, justifyContent:'center', alignItems:'center' }}>
                            <Text style={{ fontSize:24 }}>👷</Text>
                          </View>
                          <View style={{ flex:1, marginLeft:10 }}>
                            <Text style={{ color:c.text, fontWeight:'700', fontSize:15 }}>{offer.provider?.user?.name||'Provider'}</Text>
                            <Text style={{ color:c.success, fontWeight:'800', fontSize:16 }}>💰 ₹{offer.price}</Text>
                            {offer.message&&<Text style={{ color:c.textMuted, fontSize:13, marginTop:4 }}>{offer.message}</Text>}
                          </View>
                        </View>
                        {selectedReq.status==='pending'&&(
                          <TouchableOpacity onPress={() => Alert.alert('Accept Offer?',`Accept for ₹${offer.price}?`,[
                            { text:'Cancel', style:'cancel' },
                            { text:'Accept & Pay', onPress: () => acceptOffer(offer._id) },
                          ])} style={{ backgroundColor:c.success, borderRadius:12, padding:12, alignItems:'center' }}>
                            <Text style={{ color:'#fff', fontWeight:'700' }}>✅ Accept & Pay ₹{offer.price}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {selectedReq.status==='payment_pending'&&(
                  <TouchableOpacity onPress={() => { setDetailModal(false); setPayingReq(selectedReq); setPaymentModal(true); }}
                    style={{ backgroundColor:'#8b5cf6', borderRadius:14, padding:16, alignItems:'center', marginBottom:10 }}>
                    <Text style={{ color:'#fff', fontWeight:'700', fontSize:15 }}>💳 Pay ₹{selectedReq.finalAmount}</Text>
                  </TouchableOpacity>
                )}
                {['pending','payment_pending'].includes(selectedReq.status)&&(
                  <TouchableOpacity onPress={() => cancelReq(selectedReq._id)}
                    style={{ backgroundColor:'#fee2e2', borderRadius:14, padding:14, alignItems:'center' }}>
                    <Text style={{ color:'#ef4444', fontWeight:'700' }}>❌ Cancel Request</Text>
                  </TouchableOpacity>
                )}
                <View style={{ height:20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Notification Panel */}
      <Modal visible={notifPanel} animationType="slide" transparent onRequestClose={() => setNotifPanel(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:c.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'85%', borderTopWidth:1, borderTopColor:c.border }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <Text style={{ color:c.text, fontSize:20, fontWeight:'800' }}>🔔 Notifications</Text>
              <TouchableOpacity onPress={() => setNotifPanel(false)}><Text style={{ fontSize:26, color:c.textMuted }}>✕</Text></TouchableOpacity>
            </View>
            {notifList.length===0 ? (
              <View style={{ alignItems:'center', padding:40 }}>
                <Text style={{ fontSize:50 }}>🔕</Text>
                <Text style={{ color:c.text, fontSize:16, fontWeight:'700', marginTop:12 }}>No notifications yet</Text>
                <Text style={{ color:c.textMuted, fontSize:13, marginTop:6 }}>Offers and updates appear here</Text>
              </View>
            ) : (
              <FlatList data={notifList} keyExtractor={i => i.id?.toString()}
                renderItem={({ item }) => (
                  <View style={{ flexDirection:'row', alignItems:'flex-start', padding:14, borderLeftWidth:4, borderLeftColor:item.color, marginBottom:8, borderRadius:12, backgroundColor:item.bg }}>
                    <Text style={{ fontSize:26, marginRight:12, marginTop:2 }}>{item.icon}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ color:item.color, fontWeight:'700', fontSize:14, marginBottom:2 }}>{item.title}</Text>
                      <Text style={{ color:'#374151', fontSize:13, lineHeight:18 }}>{item.message}</Text>
                      <Text style={{ color:'#9ca3af', fontSize:11, marginTop:4 }}>{item.time}</Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom:20 }} showsVerticalScrollIndicator={false} />
            )}
            {notifList.length>0&&(
              <TouchableOpacity onPress={() => { setNotifList([]); setNotifCount(0); }}
                style={{ alignItems:'center', padding:14, borderTopWidth:1, borderTopColor:c.border }}>
                <Text style={{ color:'#ef4444', fontWeight:'600' }}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment modal */}
      <Modal visible={paymentModal} animationType="slide" transparent onRequestClose={() => setPaymentModal(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:c.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, borderTopWidth:1, borderTopColor:c.border }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <Text style={{ color:c.text, fontSize:20, fontWeight:'800' }}>💳 Complete Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModal(false)}><Text style={{ fontSize:26, color:c.textMuted }}>✕</Text></TouchableOpacity>
            </View>
            {payingReq&&(
              <ScrollView>
                <View style={{ backgroundColor:'#f0fdf4', borderRadius:14, padding:20, alignItems:'center', marginBottom:16 }}>
                  <Text style={{ color:'#1f2937', fontWeight:'700', fontSize:16, marginBottom:8 }}>{payingReq.title}</Text>
                  <Text style={{ color:'#10b981', fontWeight:'800', fontSize:36, marginBottom:4 }}>₹{payingReq.finalAmount||payingReq.budget||0}</Text>
                  <Text style={{ color:'#6b7280', fontSize:14 }}>Provider accepted your request</Text>
                </View>
                <Text style={{ color:c.text, fontWeight:'700', fontSize:16, marginBottom:12 }}>Choose Payment Method</Text>
                {[
                  { icon:'📱', label:'UPI', sub:'GPay, PhonePe, Paytm' },
                  { icon:'💳', label:'Card', sub:'Debit / Credit Card' },
                  { icon:'🏦', label:'Net Banking', sub:'All major banks' },
                  { icon:'💵', label:'Cash', sub:'Pay after service' },
                ].map(m => (
                  <TouchableOpacity key={m.label} onPress={handlePayment}
                    style={{ flexDirection:'row', alignItems:'center', backgroundColor:c.bg, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor:c.border }}>
                    <Text style={{ fontSize:28 }}>{m.icon}</Text>
                    <View style={{ marginLeft:14 }}>
                      <Text style={{ color:c.text, fontWeight:'600', fontSize:16 }}>{m.label}</Text>
                      <Text style={{ color:c.textMuted, fontSize:12, marginTop:2 }}>{m.sub}</Text>
                    </View>
                    <Text style={{ color:c.textMuted, marginLeft:'auto', fontSize:20 }}>›</Text>
                  </TouchableOpacity>
                ))}
                <View style={{ height:20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}