import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocation } from '../hooks/useLocation';
import { providerAPI } from '../api/provider.api';
import { useAppTheme } from '../context/AppThemeContext';
import { buildInlineMapHTML } from '../utils/inlineMap';
import { SERVICES } from '../constants';

function getMockProviders(location) {
  if (!location) return [];
  return [
    { id:1, name:'Ravi Kumar',    serviceType:'plumber',     pricePerUnit:'₹300/visit', rating:4.8, totalOrders:120, lat:location.latitude+0.008, lng:location.longitude+0.005 },
    { id:2, name:'Suresh M',      serviceType:'electrician', pricePerUnit:'₹400/visit', rating:4.5, totalOrders:85,  lat:location.latitude-0.006, lng:location.longitude+0.009 },
    { id:3, name:'Anbu Foods',    serviceType:'food',        pricePerUnit:'₹50 delivery',rating:4.9,totalOrders:340, lat:location.latitude+0.004, lng:location.longitude-0.008 },
    { id:4, name:'Quick Cab',     serviceType:'transport',   pricePerUnit:'₹12/km',     rating:4.7, totalOrders:210, lat:location.latitude-0.009, lng:location.longitude-0.004 },
    { id:5, name:'Priya Tutor',   serviceType:'tutor',       pricePerUnit:'₹200/hr',    rating:5.0, totalOrders:42,  lat:location.latitude+0.005, lng:location.longitude+0.011 },
    { id:6, name:'Glow Salon',    serviceType:'salon',       pricePerUnit:'₹300/session',rating:4.8,totalOrders:92,  lat:location.latitude-0.003, lng:location.longitude+0.007 },
  ];
}

export default function NearbyMapScreen({ navigation, route }) {
  const { colors, isDark } = useAppTheme();
  const { location, address } = useLocation();
  const webViewRef = useRef(null);
  const cardAnim = useRef(new Animated.Value(300)).current;
  const c = colors;

  const [providers, setProviders]     = useState([]);
  const [selectedSvc, setSelectedSvc] = useState(route?.params?.serviceFilter || null);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [mapHtml, setMapHtml]         = useState('');

  useEffect(() => { if (location) load(); }, [location, selectedSvc]);

  useEffect(() => {
    if (location && providers.length >= 0) rebuildMap();
  }, [providers, isDark, location]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await providerAPI.getNearby(location.latitude, location.longitude, selectedSvc, 5);
      const data = res.data || [];
      setProviders(data.length > 0 ? data : getMockProviders(location));
    } catch {
      setProviders(getMockProviders(location));
    }
    setLoading(false);
  };

  const rebuildMap = () => {
    if (!location) return;
    const markers = providers.map(p => {
      const svc = SERVICES.find(s => s.id === p.serviceType) || { icon:'📍', color:'#FF5722' };
      return { lat:p.lat, lng:p.lng, icon:svc.icon, color:svc.color, label:p.name||p.user?.name||'', id:p.id };
    });
    setMapHtml(buildInlineMapHTML({ centerLat:location.latitude, centerLng:location.longitude, isDark, markers, showRoute:false }));
  };

  const onMarkerTap = (id) => {
    const p = providers.find(pr => pr.id === id);
    if (!p) return;
    setSelected(p);
    Animated.spring(cardAnim, { toValue:0, useNativeDriver:true, tension:60 }).start();
  };

  const closeCard = () => {
    Animated.timing(cardAnim, { toValue:300, duration:200, useNativeDriver:true }).start(() => setSelected(null));
  };

  const getSvc = (id) => SERVICES.find(s => s.id === id) || { icon:'🔧', color:c.primary, label:id };

  if (!location) {
    return (
      <View style={{ flex:1, backgroundColor:c.bg, alignItems:'center', justifyContent:'center', gap:12 }}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ color:c.textMuted }}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:c.bg }}>

      {mapHtml ? (
        <WebView
          ref={webViewRef}
          style={{ flex:1 }}
          source={{ html: mapHtml }}
          javaScriptEnabled domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type === 'marker') onMarkerTap(msg.id);
            } catch {}
          }}
        />
      ) : (
        <View style={{ flex:1, backgroundColor:c.bg, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      )}

      {/* Header */}
      <View style={{ position:'absolute',top:0,left:0,right:0, flexDirection:'row',alignItems:'center',gap:10, padding:16,paddingTop:52, backgroundColor:isDark?'rgba(13,13,26,0.93)':'rgba(255,255,255,0.93)', borderBottomWidth:1,borderBottomColor:c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width:36,height:36,borderRadius:10,backgroundColor:c.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:c.border }}>
          <Text style={{ color:c.text,fontSize:20 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={{ color:c.text,fontSize:16,fontWeight:'800' }}>Nearby Services</Text>
          <Text style={{ color:c.textMuted,fontSize:11,marginTop:1 }} numberOfLines={1}>📍 {address}</Text>
        </View>
        <TouchableOpacity onPress={load} style={{ width:36,height:36,borderRadius:10,backgroundColor:c.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:c.border }}>
          <Text style={{ fontSize:16 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Service filters */}
      <View style={{ position:'absolute',top:110,left:0,right:0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:16,gap:8 }}>
          <TouchableOpacity onPress={() => setSelectedSvc(null)}
            style={{ paddingHorizontal:14,paddingVertical:7,borderRadius:20, backgroundColor:!selectedSvc?`${c.primary}22`:'rgba(22,33,62,0.9)', borderWidth:1,borderColor:!selectedSvc?c.primary:c.border }}>
            <Text style={{ color:!selectedSvc?c.primary:c.textMuted,fontSize:12,fontWeight:'700' }}>🌐 All</Text>
          </TouchableOpacity>
          {SERVICES.slice(0,10).map(sv => (
            <TouchableOpacity key={sv.id} onPress={() => setSelectedSvc(selectedSvc===sv.id?null:sv.id)}
              style={{ paddingHorizontal:14,paddingVertical:7,borderRadius:20, backgroundColor:selectedSvc===sv.id?`${sv.color}22`:'rgba(22,33,62,0.9)', borderWidth:1,borderColor:selectedSvc===sv.id?sv.color:c.border }}>
              <Text style={{ color:selectedSvc===sv.id?sv.color:c.textMuted,fontSize:12,fontWeight:'600' }}>{sv.icon} {sv.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Count */}
      <View style={{ position:'absolute',top:160,right:16 }}>
        <View style={{ backgroundColor:'rgba(22,33,62,0.9)',paddingHorizontal:12,paddingVertical:6,borderRadius:20,borderWidth:1,borderColor:c.border,marginBottom:8 }}>
          {loading ? <ActivityIndicator size="small" color={c.primary} />
            : <Text style={{ color:c.success,fontSize:12,fontWeight:'700' }}>{providers.length} nearby</Text>}
        </View>
        <TouchableOpacity
          onPress={() => webViewRef.current?.injectJavaScript('resetCenter(); true;')}
          style={{ width:38,height:38,borderRadius:12,backgroundColor:'rgba(22,33,62,0.9)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:c.border }}>
          <Text style={{ fontSize:18 }}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* Provider popup card */}
      {selected && (
        <Animated.View style={{ position:'absolute',bottom:140,left:16,right:16, transform:[{translateY:cardAnim}] }}>
          <View style={{ backgroundColor:c.card,borderRadius:20,padding:18,borderWidth:1,borderColor:c.border,elevation:10 }}>
            <TouchableOpacity style={{ position:'absolute',top:12,right:14 }} onPress={closeCard}>
              <Text style={{ color:c.textMuted,fontSize:18 }}>✕</Text>
            </TouchableOpacity>
            <View style={{ flexDirection:'row',alignItems:'center',gap:12,marginBottom:14 }}>
              <View style={{ width:52,height:52,borderRadius:14,backgroundColor:`${getSvc(selected.serviceType).color}22`,alignItems:'center',justifyContent:'center' }}>
                <Text style={{ fontSize:26 }}>{getSvc(selected.serviceType).icon}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:c.text,fontWeight:'800',fontSize:15 }}>{selected.name||selected.user?.name}</Text>
                <Text style={{ color:c.textMuted,fontSize:12,marginTop:2,textTransform:'capitalize' }}>{selected.serviceType}</Text>
                <View style={{ flexDirection:'row',alignItems:'center',gap:6,marginTop:3 }}>
                  <Text style={{ color:'#F59E0B',fontSize:12,fontWeight:'700' }}>⭐ {selected.rating}</Text>
                  <Text style={{ color:c.border }}>·</Text>
                  <Text style={{ color:c.textMuted,fontSize:12 }}>{selected.totalOrders} jobs</Text>
                  <Text style={{ color:c.border }}>·</Text>
                  <View style={{ flexDirection:'row',alignItems:'center',gap:3 }}>
                    <View style={{ width:6,height:6,borderRadius:3,backgroundColor:c.success }} />
                    <Text style={{ color:c.success,fontSize:11,fontWeight:'600' }}>Online</Text>
                  </View>
                </View>
              </View>
              <Text style={{ color:c.primary,fontWeight:'800',fontSize:13 }}>{selected.pricePerUnit}</Text>
            </View>
            <View style={{ flexDirection:'row',gap:10 }}>
              <TouchableOpacity style={{ flex:1,backgroundColor:c.bg,borderRadius:12,padding:12,alignItems:'center',borderWidth:1,borderColor:c.border }}>
                <Text style={{ color:c.text,fontWeight:'600',fontSize:13 }}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex:2,backgroundColor:c.primary,borderRadius:12,padding:12,alignItems:'center' }}
                onPress={() => { closeCard(); navigation.navigate('BookingConfirm', { provider:{...selected,user:{name:selected.name}}, service:getSvc(selected.serviceType) }); }}>
                <Text style={{ color:'#fff',fontWeight:'700',fontSize:14 }}>Book Now →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom strip */}
      {!selected && (
        <View style={{ position:'absolute',bottom:0,left:0,right:0, backgroundColor:isDark?'rgba(13,13,26,0.95)':'rgba(255,255,255,0.95)', paddingTop:12,paddingBottom:24,borderTopWidth:1,borderTopColor:c.border }}>
          <Text style={{ color:c.textMuted,fontSize:12,fontWeight:'600',paddingHorizontal:16,marginBottom:8 }}>
            {loading?'Finding providers...':`${providers.length} providers nearby`}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:16,gap:12 }}>
            {providers.map(p => {
              const svc = getSvc(p.serviceType);
              return (
                <TouchableOpacity key={p.id} onPress={() => onMarkerTap(p.id)}
                  style={{ width:110,backgroundColor:c.card,borderRadius:14,padding:12,alignItems:'center',borderWidth:1,borderColor:c.border,gap:4 }}>
                  <Text style={{ fontSize:24 }}>{svc.icon}</Text>
                  <Text style={{ color:c.text,fontSize:12,fontWeight:'700',textAlign:'center' }} numberOfLines={1}>{p.name||p.user?.name}</Text>
                  <Text style={{ color:'#F59E0B',fontSize:11 }}>⭐ {p.rating}</Text>
                  <Text style={{ color:c.primary,fontSize:11,fontWeight:'600' }}>{p.pricePerUnit}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
