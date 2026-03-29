import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

const C = { bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722', text:'#FFFFFF', muted:'#9CA3AF', border:'#2A2A3E', success:'#4CAF50', danger:'#EF4444' };

const clearStorage = async () => {
  try {
    if (Platform.OS === 'web') localStorage.clear();
    else { const A = (await import('@react-native-async-storage/async-storage')).default; await A.clear(); }
  } catch {}
};

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [dark, setDark] = useState(true);

  // Import logout from parent store
  const handleLogout = () => Alert.alert('Logout', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Logout', style: 'destructive', onPress: async () => {
      await clearStorage();
      // Dispatch logout action
      dispatch({ type: 'auth/logout' });
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }},
  ]);

  const Item = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor:danger?`${C.danger}44`:C.border }}>
      <Text style={{ fontSize:22, marginRight:14 }}>{icon}</Text>
      <Text style={{ color:danger?C.danger:C.text, fontSize:15, fontWeight:'600', flex:1 }}>{label}</Text>
      <Text style={{ color:C.muted, fontSize:18 }}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ padding:20, paddingTop:60 }}>
      <View style={{ backgroundColor:C.card, borderRadius:20, padding:24, alignItems:'center', marginBottom:24, borderWidth:1, borderColor:C.border }}>
        <View style={{ width:80, height:80, borderRadius:40, backgroundColor:`${C.primary}30`, alignItems:'center', justifyContent:'center', marginBottom:14 }}>
          <Text style={{ fontSize:40 }}>👤</Text>
        </View>
        <Text style={{ color:C.text, fontSize:22, fontWeight:'800' }}>{user?.name || 'User'}</Text>
        <Text style={{ color:C.muted, fontSize:14, marginTop:4 }}>{user?.email || user?.phone || '—'}</Text>
        <View style={{ backgroundColor:`${C.primary}20`, borderRadius:20, paddingHorizontal:14, paddingVertical:6, marginTop:10 }}>
          <Text style={{ color:C.primary, fontWeight:'700', fontSize:13 }}>
            {user?.role === 'PROVIDER' ? '🔧 Provider' : '👤 Customer'}
          </Text>
        </View>
      </View>

      <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', letterSpacing:1, marginBottom:10 }}>ACCOUNT</Text>
      <Item icon="📋" label="My Requests"    onPress={() => navigation.navigate('Request')} />
      <Item icon="🗺️" label="Nearby Map"    onPress={() => navigation.navigate('NearbyMap')} />
      <Item icon="🚨" label="Emergency"      onPress={() => navigation.navigate('Emergency')} />

      <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', letterSpacing:1, marginBottom:10, marginTop:10 }}>SETTINGS</Text>
      <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor:C.border }}>
        <Text style={{ fontSize:22, marginRight:14 }}>🌙</Text>
        <Text style={{ color:C.text, fontSize:15, fontWeight:'600', flex:1 }}>Dark Mode</Text>
        <Switch value={dark} onValueChange={setDark} trackColor={{ true:C.primary }} thumbColor="#fff" />
      </View>
      <Item icon="🔔" label="Notifications"  onPress={() => navigation.navigate('NotificationSettings')} />
      <Item icon="❓" label="Help & Support" onPress={() => navigation.navigate('HelpSupport')} />
      <Item icon="⭐" label="Rate App"        onPress={() => navigation.navigate('RateApp')} />

      <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', letterSpacing:1, marginBottom:10, marginTop:10 }}>DANGER ZONE</Text>
      <Item icon="🚪" label="Logout" onPress={handleLogout} danger />

      <Text style={{ color:C.muted, fontSize:12, textAlign:'center', marginTop:20 }}>HeyMate v1.0.0</Text>
      <View style={{ height:40 }} />
    </ScrollView>
  );
}
