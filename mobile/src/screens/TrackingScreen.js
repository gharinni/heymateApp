import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useWebSocket } from '../hooks/useWebSocket';
import { bookingAPI } from '../api/booking.api';
import { useAppTheme } from '../context/AppThemeContext';
import { buildInlineMapHTML } from '../utils/inlineMap';

export default function TrackingScreen({ route, navigation }) {
  const { booking, provider, service } = route.params || {};
  const { colors, isDark } = useAppTheme();
  const c = colors;
  const webViewRef = useRef(null);

  const [userLoc, setUserLoc]     = useState(null);
  const [connected, setConnected] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [mapReady, setMapReady]   = useState(false);
  const [eta, setEta]             = useState('~15 min');

  const isProvider = route.params?.isProvider || false;

  // Get real GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLoc(loc.coords);

      if (isProvider) {
        await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
          (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude)
        );
      }
    })();
  }, []);

  const { sendLocation } = useWebSocket(booking?.id, (pl) => {
    setConnected(true);
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`updateProvider(${pl.latitude},${pl.longitude}); true;`);
    }
    const d = dist(userLoc?.latitude||13.08, userLoc?.longitude||80.27, pl.latitude, pl.longitude);
    setEta(d<0.5?'< 5 min':d<1.5?'~10 min':d<3?'~20 min':'~30 min');
  });

  useEffect(() => {
    if (isProvider && userLoc) sendLocation(userLoc.latitude, userLoc.longitude);
  }, [userLoc, isProvider]);

  const markDone = () => {
    Alert.alert('Mark as Done?', 'Confirm service is completed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Done!', onPress: async () => {
        setCompleting(true);
        await bookingAPI.updateStatus(booking?.id, 'COMPLETED').catch(() => {});
        navigation.navigate('Payment', {
          booking: { ...booking, provider, price: provider?.pricePerUnit?.replace(/[^0-9.]/g,'') || '0' }
        });
        setCompleting(false);
      }},
    ]);
  };

  const lat = userLoc?.latitude  || 13.0827;
  const lng = userLoc?.longitude || 80.2707;

  const mapHTML = buildInlineMapHTML({
    centerLat: lat, centerLng: lng,
    isDark, showRoute: true,
  });

  const providerName = provider?.name || provider?.user?.name || booking?.provider?.user?.name || 'Provider';
  const svcLabel     = service?.label || booking?.serviceType || '';
  const rating       = provider?.rating || '5.0';
  const phone        = provider?.phone || booking?.provider?.user?.phone || '';

  return (
    <View style={{ flex:1, backgroundColor:c.bg }}>

      <WebView
        ref={webViewRef}
        style={{ flex:1 }}
        source={{ html: mapHTML }}
        javaScriptEnabled domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        onMessage={(e) => { if(e.nativeEvent.data==='ready') setMapReady(true); }}
        onError={() => {}}
      />

      {/* Header */}
      <View style={{ position:'absolute',top:0,left:0,right:0, flexDirection:'row',alignItems:'center',gap:10, padding:16,paddingTop:52, backgroundColor:isDark?'rgba(13,13,26,0.93)':'rgba(255,255,255,0.93)', borderBottomWidth:1,borderBottomColor:c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width:36,height:36,borderRadius:10,backgroundColor:c.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:c.border }}>
          <Text style={{ color:c.text,fontSize:20 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={{ color:c.text,fontSize:16,fontWeight:'800' }}>Live Tracking</Text>
          <View style={{ flexDirection:'row',alignItems:'center',gap:5,marginTop:2 }}>
            <View style={{ width:7,height:7,borderRadius:4, backgroundColor:connected?c.success:'#F59E0B' }} />
            <Text style={{ color:connected?c.success:'#F59E0B',fontSize:11,fontWeight:'600' }}>
              {connected ? 'Provider location updating live' : 'Waiting for provider...'}
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor:`${c.primary}22`,borderRadius:10,paddingHorizontal:12,paddingVertical:5 }}>
          <Text style={{ color:c.primary,fontWeight:'800',fontSize:13 }}>{eta}</Text>
        </View>
      </View>

      {/* Provider card */}
      <View style={{ position:'absolute',top:112,left:16,right:16, backgroundColor:c.card,borderRadius:18,padding:14, flexDirection:'row',alignItems:'center', borderWidth:1,borderColor:c.border,elevation:5 }}>
        <View style={{ width:48,height:48,borderRadius:13,backgroundColor:`${c.primary}22`,alignItems:'center',justifyContent:'center',marginRight:12 }}>
          <Text style={{ fontSize:24 }}>{service?.icon || '🔧'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ color:c.text,fontWeight:'800',fontSize:15 }}>{providerName}</Text>
          <Text style={{ color:c.textMuted,fontSize:12,marginTop:1 }}>{svcLabel}</Text>
          <Text style={{ color:'#F59E0B',fontSize:12,marginTop:1 }}>⭐ {rating}</Text>
        </View>
        <View style={{ gap:8 }}>
          {!!phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)}
              style={{ width:40,height:40,borderRadius:11,backgroundColor:`${c.success}18`,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:`${c.success}44` }}>
              <Text style={{ fontSize:18 }}>📞</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isProvider && (
        <View style={{ position:'absolute',top:216,left:16,right:16, backgroundColor:`${c.success}15`,borderRadius:12,padding:10, flexDirection:'row',alignItems:'center',gap:8, borderWidth:1,borderColor:`${c.success}44` }}>
          <View style={{ width:8,height:8,borderRadius:4,backgroundColor:c.success }} />
          <Text style={{ color:c.success,fontWeight:'700',fontSize:13 }}>Sharing your location with customer</Text>
        </View>
      )}

      {/* Bottom */}
      <View style={{ position:'absolute',bottom:0,left:0,right:0, backgroundColor:c.card,padding:16,paddingBottom:32, borderTopWidth:1,borderTopColor:c.border }}>
        <View style={{ flexDirection:'row',gap:6,marginBottom:12,justifyContent:'center' }}>
          {[{l:'Accepted',on:true},{l:'En Route',on:connected},{l:'In Progress',on:false},{l:'Done',on:false}].map(s=>(
            <View key={s.l} style={{ flex:1,paddingVertical:6,borderRadius:20,alignItems:'center', backgroundColor:s.on?`${c.primary}22`:c.bg, borderWidth:1,borderColor:s.on?c.primary:c.border }}>
              <Text style={{ color:s.on?c.primary:c.textMuted,fontSize:10,fontWeight:'700' }}>{s.l}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={markDone} disabled={completing}
          style={{ backgroundColor:c.primary,borderRadius:14,padding:16,alignItems:'center',opacity:completing?0.7:1 }}>
          {completing ? <ActivityIndicator color="#fff" />
            : <Text style={{ color:'#fff',fontWeight:'800',fontSize:15 }}>✅ Mark as Done</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function dist(lat1,lng1,lat2,lng2){
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
