import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [address, setAddress]   = useState('Getting your location...');
  const [error, setError]       = useState(null);
  const watchRef = useRef(null);

  useEffect(() => {
    startTracking();
    return () => { if (watchRef.current) watchRef.current?.remove?.(); };
  }, []);

  const startTracking = async () => {
    // ── Web: use browser Geolocation API ─────────────────────────
    if (Platform.OS === 'web') {
      if (!navigator?.geolocation) {
        setAddress('Chennai, Tamil Nadu');   // sensible default
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setLocation(coords);
          await fetchAddressWeb(coords.latitude, coords.longitude);
        },
        () => { setAddress('Chennai, Tamil Nadu'); },
        { enableHighAccuracy: true, timeout: 8000 },
      );
      return;
    }

    // ── Native: use expo-location ─────────────────────────────────
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setAddress('Location permission denied');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(current.coords);
      fetchAddressNative(current.coords.latitude, current.coords.longitude);

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        newLoc => {
          setLocation(newLoc.coords);
          fetchAddressNative(newLoc.coords.latitude, newLoc.coords.longitude);
        },
      );
    } catch (e) {
      setError(e.message);
      setAddress('Unable to get location');
    }
  };

  const fetchAddressWeb = async (lat, lng) => {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      setAddress(data.display_name?.split(',').slice(0, 3).join(', ') || 'Location found');
    } catch { setAddress('Location found'); }
  };

  const fetchAddressNative = async (lat, lng) => {
    try {
      const Location = await import('expo-location');
      const results  = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results?.length > 0) {
        const r = results[0];
        setAddress([r.name, r.district || r.subregion, r.city, r.region].filter(Boolean).join(', '));
      }
    } catch {}
  };

  const getLocation = async () => {
    if (Platform.OS === 'web') {
      return new Promise(resolve => {
        navigator.geolocation?.getCurrentPosition(
          pos => { const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; setLocation(c); resolve(c); },
          ()  => resolve(null),
        );
      });
    }
    const Location = await import('expo-location');
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc.coords);
    return loc.coords;
  };

  return { location, address, error, getLocation };
}
