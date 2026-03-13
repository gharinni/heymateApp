import { useEffect, useRef, useState, useCallback } from 'react';
import { BASE_URL } from '../api/index';

// Pure WebSocket (no STOMP) — works in Expo Go without native modules
export function useWebSocket(bookingId, onLocationUpdate) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!bookingId || !mountedRef.current) return;

    try {
      // Convert http → ws URL
      const wsUrl = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
      const ws = new WebSocket(`${wsUrl}/ws/tracking?bookingId=${bookingId}`);

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        console.log('[WS] Connected for booking', bookingId);
        // Send join message
        ws.send(JSON.stringify({ type: 'JOIN', bookingId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'LOCATION' && onLocationUpdate) {
            onLocationUpdate({ latitude: data.lat, longitude: data.lng });
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        // Auto-reconnect every 4s
        reconnectTimer.current = setTimeout(connect, 4000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      // Retry on failure
      reconnectTimer.current = setTimeout(connect, 4000);
    }
  }, [bookingId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [bookingId]);

  // Provider sends live location to all subscribers
  const sendLocation = useCallback((lat, lng) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LOCATION', bookingId, lat, lng }));
    }
  }, [bookingId]);

  return { connected, sendLocation };
}