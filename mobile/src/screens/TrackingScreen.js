import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Linking, Alert, Platform
} from 'react-native';
import * as Location from 'expo-location';
import { useWebSocket } from '../hooks/useWebSocket';
import { bookingAPI } from '../api/booking_api';
import { useAppTheme } from '../context/AppThemeContext';
import { buildInlineMapHTML } from '../utils/inlineMap';

// ✅ Safe WebView import (ONLY for mobile)
let WebView = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function TrackingScreen({ route, navigation }) {

  const { booking, provider, service } = route.params || {};
  const { colors, isDark } = useAppTheme();
  const c = colors;

  const webViewRef = useRef(null);

  const [userLoc, setUserLoc] = useState(null);
  const [connected, setConnected] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [eta, setEta] = useState('~15 min');

  const isProvider = route.params?.isProvider || false;

  // 📍 Get location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLoc(loc.coords);

      if (isProvider) {
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (pos) =>
            sendLocation(pos.coords.latitude, pos.coords.longitude)
        );
      }
    })();
  }, []);

  // 🔌 WebSocket
  const { sendLocation } = useWebSocket(booking?.id, (pl) => {
    setConnected(true);

    if (webViewRef.current && mapReady && Platform.OS !== 'web') {
      webViewRef.current.injectJavaScript(
        `updateProvider(${pl.latitude},${pl.longitude}); true;`
      );
    }

    const d = dist(
      userLoc?.latitude || 13.08,
      userLoc?.longitude || 80.27,
      pl.latitude,
      pl.longitude
    );

    setEta(
      d < 0.5 ? '< 5 min' :
      d < 1.5 ? '~10 min' :
      d < 3 ? '~20 min' : '~30 min'
    );
  });

  useEffect(() => {
    if (isProvider && userLoc) {
      sendLocation(userLoc.latitude, userLoc.longitude);
    }
  }, [userLoc]);

  // ✅ Complete booking
  const markDone = () => {
    Alert.alert('Mark as Done?', 'Confirm service is completed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Done!',
        onPress: async () => {
          setCompleting(true);
          await bookingAPI.updateStatus(booking?.id, 'COMPLETED').catch(() => {});
          navigation.navigate('Payment', {
            booking: {
              ...booking,
              provider,
              price:
                provider?.pricePerUnit?.replace(/[^0-9.]/g, '') || '0',
            },
          });
          setCompleting(false);
        },
      },
    ]);
  };

  // 📍 Default location
  const lat = userLoc?.latitude || 13.0827;
  const lng = userLoc?.longitude || 80.2707;

  const mapHTML = buildInlineMapHTML({
    centerLat: lat,
    centerLng: lng,
    isDark,
    showRoute: true,
  });

  const providerName =
    provider?.name ||
    provider?.user?.name ||
    booking?.provider?.user?.name ||
    'Provider';

  const phone =
    provider?.phone ||
    booking?.provider?.user?.phone ||
    '';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>

      {/* ✅ MAP FIX (CRITICAL CHANGE) */}
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={mapHTML}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <WebView
          ref={webViewRef}
          style={{ flex: 1 }}
          source={{ html: mapHTML }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          onMessage={(e) => {
            if (e.nativeEvent.data === 'ready') setMapReady(true);
          }}
        />
      )}

      {/* HEADER */}
      <View style={{
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        padding: 16
      }}>
        <Text style={{ color: c.text, fontWeight: 'bold' }}>
          Live Tracking ({eta})
        </Text>
      </View>

      {/* CALL BUTTON */}
      {!!phone && (
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${phone}`)}
          style={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            backgroundColor: c.primary,
            padding: 12,
            borderRadius: 50
          }}>
          <Text style={{ color: '#fff' }}>📞</Text>
        </TouchableOpacity>
      )}

      {/* DONE BUTTON */}
      <TouchableOpacity
        onPress={markDone}
        disabled={completing}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: c.primary,
          padding: 15,
          borderRadius: 10,
          alignItems: 'center'
        }}>
        {completing
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff' }}>Mark as Done</Text>}
      </TouchableOpacity>

    </View>
  );
}

// 📏 Distance calculation
function dist(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}