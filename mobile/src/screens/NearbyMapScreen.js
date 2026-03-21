import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { useAppTheme } from '../context/AppThemeContext';

const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const MOCK_PROVIDERS = [
  { id:1, name:'Ravi Kumar',    serviceType:'Plumber',     rating:4.8, distance:'0.4 km', lat:13.090, lng:80.275 },
  { id:2, name:'Suresh M',      serviceType:'Electrician', rating:4.5, distance:'0.8 km', lat:13.085, lng:80.280 },
  { id:3, name:'Anbu Foods',    serviceType:'Food',        rating:4.9, distance:'0.3 km', lat:13.092, lng:80.272 },
  { id:4, name:'Quick Cab',     serviceType:'Transport',   rating:4.7, distance:'0.2 km', lat:13.088, lng:80.278 },
  { id:5, name:'Priya Tutor',   serviceType:'Tutor',       rating:5.0, distance:'1.1 km', lat:13.082, lng:80.282 },
  { id:6, name:'Glow Salon',    serviceType:'Salon',       rating:4.8, distance:'0.6 km', lat:13.086, lng:80.268 },
];

const ICONS = {
  Plumber:'🔧', Electrician:'⚡', Food:'🍔', Transport:'🚗',
  Tutor:'📚', Salon:'💇', Carpenter:'🔨', Mechanic:'🔩',
};

export default function NearbyMapScreen({ navigation }) {
  const { colors: c } = useAppTheme();
  const [providers, setProviders] = useState(MOCK_PROVIDERS);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [mapHtml, setMapHtml]     = useState('');

  useEffect(() => { buildMap(); }, [providers]);

  const buildMap = () => {
    const markers = providers.map(p =>
      `L.marker([${p.lat}, ${p.lng}])
        .addTo(map)
        .bindPopup('<b>${p.name}</b><br>${p.serviceType}<br>⭐ ${p.rating}')
        .on('click', function() {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({id:${p.id}}));
        });`
    ).join('\n');

    setMapHtml(`<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0;padding:0;}#map{height:100vh;}</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map').setView([13.0827, 80.2707], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
L.marker([13.0827, 80.2707], {
  icon: L.divIcon({className:'', html:'<div style="background:#FF5722;color:white;padding:4px 8px;border-radius:20px;font-size:12px;font-weight:bold;">📍 You</div>'})
}).addTo(map);
${markers}
</script>
</body></html>`);
  };

  // Web-compatible map using iframe
  const WebMap = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="map"
        />
      );
    }
    // Native - lazy load WebView
    try {
      const { WebView } = require('react-native-webview');
      return (
        <WebView
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          javaScriptEnabled
          onMessage={e => {
            try {
              const { id } = JSON.parse(e.nativeEvent.data);
              setSelected(providers.find(p => p.id === id));
            } catch {}
          }}
        />
      );
    } catch {
      return (
        <View style={{ flex: 1, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 40 }}>🗺️</Text>
          <Text style={{ color: c.textMuted, marginTop: 8 }}>Map not available</Text>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>

      {/* Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 16, paddingTop: 52,
        backgroundColor: 'rgba(13,13,26,0.93)', borderBottomWidth: 1, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Nearby Services</Text>
          <Text style={{ color: c.textMuted, fontSize: 11 }}>📍 Chennai, Tamil Nadu</Text>
        </View>
      </View>

      {/* Map */}
      <View style={{ flex: 1, marginTop: 100 }}>
        {mapHtml ? <WebMap /> : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        )}
      </View>

      {/* Provider List */}
      <View style={{ backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border, padding: 12 }}>
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
          {providers.length} providers nearby
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {providers.map(p => (
            <TouchableOpacity key={p.id} onPress={() => setSelected(p)}
              style={{ backgroundColor: selected?.id === p.id ? `${c.primary}22` : c.bg,
                borderRadius: 14, padding: 12, marginRight: 10, width: 110,
                alignItems: 'center', borderWidth: 1,
                borderColor: selected?.id === p.id ? c.primary : c.border }}>
              <Text style={{ fontSize: 24 }}>{ICONS[p.serviceType] || '🔧'}</Text>
              <Text style={{ color: c.text, fontSize: 11, fontWeight: '700',
                marginTop: 6, textAlign: 'center' }} numberOfLines={1}>{p.name}</Text>
              <Text style={{ color: '#F59E0B', fontSize: 11 }}>⭐ {p.rating}</Text>
              <Text style={{ color: c.textMuted, fontSize: 10 }}>{p.distance}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selected && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ServiceProviders', {
              category: selected.serviceType,
              icon: ICONS[selected.serviceType] || '🔧',
              color: '#FF5722',
            })}
            style={{ backgroundColor: c.primary, borderRadius: 14, padding: 14,
              alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>
              View {selected.serviceType} Providers →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
