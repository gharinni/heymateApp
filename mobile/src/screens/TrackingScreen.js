import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Linking, Alert, Platform,
} from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';

export default function TrackingScreen({ route, navigation }) {
  const { booking, provider, service } = route.params || {};
  const { colors: c } = useAppTheme();
  const [eta, setEta]         = useState('~15 min');
  const [status, setStatus]   = useState('En Route');
  const [mapHtml, setMapHtml] = useState('');

  const providerName = provider?.name || provider?.user?.name || 'Provider';
  const phone        = provider?.phone || '';

  useEffect(() => {
    // Build map HTML
    const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0;}#map{height:100vh;}</style>
</head><body><div id="map"></div>
<script>
var map = L.map('map').setView([13.0827,80.2707],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
L.marker([13.0827,80.2707]).addTo(map).bindPopup('📍 Your Location').openPopup();
L.marker([13.0900,80.2750],{
  icon:L.divIcon({className:'',html:'<div style="background:#FF5722;color:white;padding:4px 10px;border-radius:20px;font-weight:bold;font-size:12px;">🔧 ${providerName}</div>'})
}).addTo(map);
</script></body></html>`;
    setMapHtml(html);
  }, []);

  const MapView = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe srcDoc={mapHtml} style={{ width:'100%', height:'100%', border:'none' }} title="tracking" />
      );
    }
    try {
      const { WebView } = require('react-native-webview');
      return <WebView source={{ html: mapHtml }} style={{ flex: 1 }} javaScriptEnabled />;
    } catch {
      return (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: c.card }}>
          <Text style={{ fontSize: 60 }}>🗺️</Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>
            {providerName} is on the way!
          </Text>
          <Text style={{ color: c.textMuted, marginTop: 8 }}>ETA: {eta}</Text>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>

      {/* Map */}
      <View style={{ flex: 1 }}>
        {mapHtml ? <MapView /> : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        )}
      </View>

      {/* Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 16, paddingTop: 52,
        backgroundColor: 'rgba(13,13,26,0.93)', borderBottomWidth: 1, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Live Tracking</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.success }} />
            <Text style={{ color: c.success, fontSize: 11 }}>Provider location updating</Text>
          </View>
        </View>
        <View style={{ backgroundColor: `${c.primary}22`, borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ color: c.primary, fontWeight: '800', fontSize: 13 }}>{eta}</Text>
        </View>
      </View>

      {/* Bottom Card */}
      <View style={{ backgroundColor: c.card, padding: 20, paddingBottom: 32,
        borderTopWidth: 1, borderTopColor: c.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 13,
            backgroundColor: `${c.primary}22`, alignItems: 'center',
            justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 24 }}>{service?.icon || '🔧'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{providerName}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{service?.label || 'Service'}</Text>
          </View>
          {phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)}
              style={{ width: 40, height: 40, borderRadius: 11,
                backgroundColor: `${c.success}18`, alignItems: 'center',
                justifyContent: 'center', borderWidth: 1, borderColor: `${c.success}44` }}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Mark Done?', 'Confirm service completed?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Done!', onPress: () => navigation.navigate('Payment', {
                requestId: booking?.id,
                amount: booking?.finalAmount || 0,
                requestTitle: service?.label,
              })},
          ])}
          style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>✅ Mark as Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
