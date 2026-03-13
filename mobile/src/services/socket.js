import { Platform } from 'react-native';
import { SOCKET_URL } from '../api/index';

// Web uses localStorage, native uses AsyncStorage
const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  }
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  return AsyncStorage.getItem('token');
};

class SocketService {
  constructor() { this.socket = null; this.ioLib = null; }

  async loadIO() {
    if (this.ioLib) return true;
    try {
      const m = await import('socket.io-client');
      this.ioLib = m.io || m.default;
      return true;
    } catch { return false; }
  }

  async connect(userId) {
    const ok = await this.loadIO();
    if (!ok) return;
    const token = await getToken();
    if (!token) return;

    this.socket = this.ioLib(SOCKET_URL, {
      auth: { token },
      transports: Platform.OS === 'web' ? ['websocket', 'polling'] : ['websocket'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 8,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      if (userId) this.socket.emit('join-user-room', userId);
    });
    this.socket.on('connect_error', e => console.log('Socket err:', e.message));
  }

  disconnect()         { if (this.socket) { this.socket.disconnect(); this.socket = null; } }
  emit(ev, d)          { if (this.socket?.connected) this.socket.emit(ev, d); }
  on(ev, cb)           { if (this.socket) this.socket.on(ev, cb); }
  off(ev)              { if (this.socket) this.socket.off(ev); }
  removeAllListeners() { if (this.socket) this.socket.removeAllListeners(); }

  onNewRequest(cb)       { this.on('new-request-nearby', cb); }
  onNewOffer(cb)         { this.on('new-offer', cb); }
  onOfferAccepted(cb)    { this.on('offer-accepted', cb); }
  onStatusUpdate(cb)     { this.on('request-status-update', cb); }
  onPaymentConfirmed(cb) { this.on('payment-confirmed', cb); }
  onRequestCancelled(cb) { this.on('request-cancelled', cb); }
  onProviderLocationUpdate(cb) { this.on('provider-location-update', cb); }
  joinProviders()        { this.emit('join-providers'); }
  updateAvailability(v)  { this.emit('update-availability', { isAvailable: v }); }
  updateLocation(lat, lng, reqId = null) {
    this.emit('update-location', { latitude: lat, longitude: lng, requestId: reqId });
  }
}

export default new SocketService();
