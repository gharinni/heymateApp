import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [address, setAddress]   = useState('Chennai, Tamil Nadu');
  const [error, setError]       = useState(null);

  const getLocation = () => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        navigator.geolocation?.getCurrentPosition(
          async pos => {
            const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setLocation(coords);
            try {
              const res  = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
              );
              const data = await res.json();
              setAddress(data.display_name?.split(',').slice(0, 3).join(', ') || 'Chennai, Tamil Nadu');
            } catch {}
            resolve(coords);
          },
          () => {
            const def = { latitude: 13.0827, longitude: 80.2707 };
            setLocation(def);
            resolve(def);
          }
        );
      } else {
        // Native - try expo-location
        (async () => {
          try {
            const Loc = await import('expo-location');
            const { status } = await Loc.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const pos = await Loc.getCurrentPositionAsync({});
              const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
              setLocation(coords);
              const addr = await Loc.reverseGeocodeAsync(coords);
              if (addr?.[0]) setAddress(`${addr[0].city || ''}, ${addr[0].region || ''}`);
              resolve(coords);
            } else {
              const def = { latitude: 13.0827, longitude: 80.2707 };
              setLocation(def);
              resolve(def);
            }
          } catch {
            const def = { latitude: 13.0827, longitude: 80.2707 };
            setLocation(def);
            resolve(def);
          }
        })();
      }
    });
  };

  useEffect(() => { getLocation(); }, []);

  return { location, address, getLocation, error };
}
