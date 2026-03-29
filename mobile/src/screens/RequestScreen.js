import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSelector } from 'react-redux';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';
const C = { bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722', success:'#4CAF50', border:'#2A2A3E', text:'#FFFFFF', muted:'#9CA3AF' };

const getToken = async () => {
  try {
    if (Platform.OS === 'web') return localStorage.getItem('token');
    const A = (await import('@react-native-async-storage/async-storage')).default;
    return A.getItem('token');
  } catch { return null; }
};

const CATEGORIES = ['Food','Grocery','Plumber','Electrician','Carpenter','Salon','Transport','Tutor','Hospital','Pharmacy','Laundry','Home Help','Mechanic','Pet Care','Fitness'];

export default function RequestScreen({ navigation, route }) {
  const { user } = useSelector(s => s.auth);
  const [desc, setDesc]     = useState('');
  const [cat, setCat]       = useState(route?.params?.category || '');
  const [loading, setL]     = useState(false);
  const [requests, setReqs] = useState([]);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const token = await getToken();
      const res   = await fetch(`${BACKEND}/requests/my`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      setReqs(data?.data || data || []);
    } catch {}
  };

  const postRequest = async () => {
    if (!cat) { Alert.alert('Error', 'Select a service category'); return; }
    if (!desc.trim()) { Alert.alert('Error', 'Describe what you need'); return; }
    setL(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${BACKEND}/requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: cat, description: desc }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Posted!', 'Providers nearby will see your request.');
        setDesc(''); fetchRequests();
      } else { Alert.alert('Error', data?.message || 'Failed'); }
    } catch { Alert.alert('Error', 'Cannot connect'); }
    finally { setL(false); }
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ padding:20, paddingTop:60 }}>
      <Text style={{ color:C.text, fontSize:24, fontWeight:'800', marginBottom:20 }}>📋 My Requests</Text>

      <View style={{ backgroundColor:C.card, borderRadius:18, padding:16, borderWidth:1, borderColor:C.border, marginBottom:20 }}>
        <Text style={{ color:C.text, fontWeight:'700', fontSize:15, marginBottom:12 }}>Post New Request</Text>
        <Text style={{ color:C.muted, fontSize:12, marginBottom:8 }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)}
              style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20, marginRight:8,
                backgroundColor: cat===c ? C.primary : C.bg, borderWidth:1, borderColor: cat===c ? C.primary : C.border }}>
              <Text style={{ color: cat===c ? '#fff' : C.muted, fontWeight:'600', fontSize:12 }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={{ color:C.muted, fontSize:12, marginBottom:8 }}>Description</Text>
        <TextInput
          style={{ backgroundColor:C.bg, color:'#fff', borderRadius:12, padding:14, borderWidth:1, borderColor:C.border, fontSize:14, minHeight:80, textAlignVertical:'top', marginBottom:14 }}
          placeholder="Describe what you need..." placeholderTextColor={C.muted}
          value={desc} onChangeText={setDesc} multiline />
        <TouchableOpacity onPress={postRequest} disabled={loading}
          style={{ backgroundColor:loading?'#555':C.primary, borderRadius:12, padding:14, alignItems:'center' }}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={{ color:'#fff', fontWeight:'700' }}>Post Request</Text>}
        </TouchableOpacity>
      </View>

      {requests.length > 0 && <>
        <Text style={{ color:C.text, fontWeight:'700', fontSize:15, marginBottom:12 }}>Your Requests</Text>
        {requests.map((r,i) => (
          <View key={i} style={{ backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:10, borderWidth:1, borderColor:C.border }}>
            <Text style={{ color:C.text, fontWeight:'700' }}>{r.category || r.serviceType}</Text>
            <Text style={{ color:C.muted, fontSize:12, marginTop:4 }}>{r.description || r.notes}</Text>
            <Text style={{ color:C.primary, fontSize:11, marginTop:6 }}>{r.status || 'PENDING'}</Text>
          </View>
        ))}
      </>}
      <View style={{ height:80 }} />
    </ScrollView>
  );
}
