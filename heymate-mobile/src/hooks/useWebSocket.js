import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from '../api/index';

/**
 * useWebSocket — connects to Spring Boot STOMP WebSocket.
 * Subscribes to /topic/tracking/{bookingId} for live location.
 */
export function useWebSocket(bookingId, onLocationUpdate) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      onConnect: () => {
        setConnected(true);
        // Subscribe to live location updates for this booking
        client.subscribe(`/topic/tracking/${bookingId}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            onLocationUpdate(data);
          } catch (e) {
            console.error('WS parse error:', e);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.error('STOMP error:', frame),
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [bookingId]);

  /**
   * Send provider's live location to server.
   * @param {{ lat: number, lng: number }} coords
   */
  const sendLocation = (coords) => {
    if (clientRef.current?.connected && bookingId) {
      clientRef.current.publish({
        destination: `/app/location/${bookingId}`,
        body: JSON.stringify(coords),
      });
    }
  };

  /**
   * Subscribe to She-Safe live location for a user.
   */
  const subscribeSheSafe = (userId, onUpdate) => {
    if (clientRef.current?.connected) {
      return clientRef.current.subscribe(`/topic/shesafe/${userId}`, (msg) => {
        onUpdate(JSON.parse(msg.body));
      });
    }
  };

  return { connected, sendLocation, subscribeSheSafe, client: clientRef.current };
}
